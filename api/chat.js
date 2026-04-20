import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let SYSTEM_PROMPT_CACHE = null;

function buildSystemPrompt() {
  if (SYSTEM_PROMPT_CACHE) return SYSTEM_PROMPT_CACHE;

  // process.cwd() is the project root in Vercel functions
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "persona.yaml"), "utf8");
    const p = yaml.load(raw);

    const L = [];
    L.push(`KİMLİK: Sen "${p.identity.name}" — ${p.identity.role}.`);
    L.push(p.identity.context.trim());
    L.push("");

    L.push("SES:");
    L.push(`- Dil: ${p.voice.language}`);
    L.push(`- Ton: ${p.voice.register}`);
    L.push(`- Yoğunluk: ${p.voice.density}`);
    L.push(`- Tempo: ${p.voice.tempo}`);
    L.push(`- Ruh hali: ${p.voice.mood}`);
    L.push("");

    L.push("TEMEL İLKELER:");
    p.core_principles.forEach((x) => L.push(`- ${x}`));
    L.push("");

    L.push("ASLA YAPMA:");
    p.never_do.forEach((x) => L.push(`- ${x}`));
    L.push("");

    L.push("DAİMA YAP:");
    p.always_do.forEach((x) => L.push(`- ${x}`));
    L.push("");

    L.push("VARSAYILAN YANIT YAPISI:");
    L.push(p.response_structure.default.trim());
    L.push("");
    L.push("KAVRAM AÇIKLARKEN:");
    L.push(p.response_structure.when_explaining_concept.trim());
    L.push("");
    L.push("HATA GİDERİRKEN:");
    L.push(p.response_structure.when_troubleshooting.trim());
    L.push("");
    L.push("KULLANICI KAYBOLDUYSA:");
    L.push(p.response_structure.when_user_lost.trim());
    L.push("");

    L.push("NAVİGASYON AKSİYONLARI:");
    L.push(p.navigation_actions.description.trim());
    L.push(`Format: ${p.navigation_actions.syntax}`);
    for (const [type, info] of Object.entries(p.navigation_actions.types)) {
      const params = info.valid_params
        ? ` Geçerli parametreler: ${Array.isArray(info.valid_params) ? info.valid_params.join(", ") : info.valid_params}.`
        : "";
      L.push(`- ${type}: ${info.description}${params} Örnek: ${info.example}`);
    }
    L.push("");

    L.push(`UZMANLIK ALANIN: ${p.domain_expertise.depth}`);
    L.push("Konular:");
    p.domain_expertise.topics.forEach((t) => L.push(`- ${t}`));
    L.push("");

    L.push("ÖRNEKLER (tonuna ve uzunluğuna dikkat et):");
    L.push("");
    p.tone_examples.forEach((ex, i) => {
      L.push(`Örnek ${i + 1}:`);
      L.push(`Kullanıcı: ${ex.user_prompt}`);
      L.push("İyi yanıt:");
      L.push(ex.good_response.trim());
      if (ex.bad_response) {
        L.push("Kötü yanıt (BÖYLE YAPMA):");
        L.push(ex.bad_response.trim());
      }
      L.push("");
    });

    L.push("FALLBACK STRATEJİLERİ:");
    L.push(`- Bilmediğin konu: ${p.fallback_strategies.unknown_topic.trim()}`);
    L.push(`- Konu dışı: ${p.fallback_strategies.off_topic.trim()}`);
    L.push(`- Kullanıcı sinirli: ${p.fallback_strategies.user_frustrated.trim()}`);
    L.push(`- Belirsiz soru: ${p.fallback_strategies.vague_question.trim()}`);

    SYSTEM_PROMPT_CACHE = L.join("\n");
    return SYSTEM_PROMPT_CACHE;
  } catch (err) {
    throw err;
  }
}

function sendJson(res, status, data) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  const MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash").replace(/['"]/g, "").trim();
  const rawApiKey = process.env.GEMINI_API_KEY || "";
  const API_KEY = rawApiKey.replace(/['"]/g, "").trim();

  if (req.method === "OPTIONS") {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (!API_KEY) {
    return sendJson(res, 500, { error: "GEMINI_API_KEY ayarlı değil. Vercel ayarlarına ekleyin." });
  }

  let body = req.body;
  if (!body) {
    return sendJson(res, 400, { error: "Geçersiz JSON (Boş body)" });
  }
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { error: "Geçersiz JSON" });
    }
  }

  const history = Array.isArray(body?.history) ? body.history : null;
  if (!history || history.length === 0) {
    return sendJson(res, 400, { error: "Boş konuşma geçmişi" });
  }

  const trimmed = history.slice(-20);

  let systemPrompt;
  try {
    systemPrompt = buildSystemPrompt();
  } catch (err) {
    console.error("Persona yükleme hatası:", err);
    return sendJson(res, 500, { error: `Persona yüklenemedi: ${err.message}` });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  let geminiRes;
  try {
    geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: trimmed,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95,
        },
      }),
    });
  } catch (err) {
    return sendJson(res, 502, { error: `Network hatası: ${err.message}` });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    let errMsg = `Gemini API ${geminiRes.status}`;
    try {
      const j = JSON.parse(errText);
      errMsg = j?.error?.message || errMsg;
    } catch {}
    return sendJson(res, geminiRes.status, { error: errMsg });
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finish = data?.candidates?.[0]?.finishReason || "UNKNOWN";
    return sendJson(res, 500, { error: `Boş yanıt (${finish})` });
  }

  return sendJson(res, 200, { text });
}
