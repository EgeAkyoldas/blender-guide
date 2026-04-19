# Blender Rehberi — Interactive 3D Guide

Turkish-language Blender 3D learning platform with:
- **Interactive 3D cube** — drag/touch to rotate, auto-spins when idle
- **Avatar selector** — choose from 12 emojis or upload custom image
- **AI chat** (Gemini) — Blender expert assistant, context-aware with navigation actions
- **Keyboard shortcuts** — 70+ Turkish shortcuts organized by category
- **Quiz mode** — test your knowledge
- **Progress tracking** — localStorage-based learning state

## Deploy

Hosted on **Netlify**. Environment variables required:

```env
GEMINI_API_KEY=your-google-ai-key
GEMINI_MODEL=gemini-2.5-flash  # optional, defaults to this
```

Add these to **Netlify Site Settings → Environment Variables**.

## Local Dev

```bash
npm install -g netlify-cli
netlify link  # connect to your Netlify site
netlify dev   # runs on http://localhost:8888
```

## Tech Stack

- **Frontend**: HTML5, CSS3 (3D transforms), Vanilla JS
- **Backend**: Netlify Functions (Node.js)
- **AI**: Google Gemini API
- **Config**: `netlify.toml`, `persona.yaml` (system prompt)

## Key Files

- `index.html` — main app (cube, chat, shortcuts, quiz)
- `netlify/functions/chat.mjs` — Gemini API proxy
- `persona.yaml` — AI assistant personality + instructions
- `.env.example` → `.env` — local development secrets

## Features

### Cube Interaction
- Mouse drag = free rotation
- Touch drag = mobile rotation
- Auto-spin when idle

### Avatar Picker
- Click avatar button in chat input
- 12 preset emojis
- Upload custom image (stored in localStorage)
- User avatar appears in all messages

### Chat Actions
- `/filter:<category>` — navigate to shortcut category
- `/search:<query>` — search shortcuts
- `/quiz` — start quiz mode
- `/scroll:<id>` — jump to shortcut by ID

### Persona-Driven
Blender expert in Turkish. Responds to:
- Concept explanations
- Troubleshooting
- Shortcut recommendations
- Quiz suggestions

---

Made with 🧡 for Blender learners.
