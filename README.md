# 🛡️ PhotoShield Pro

Advanced photo metadata extractor & privacy protector. Runs 100% in the browser — no file uploads, no tracking, no API keys.

## Features
- 📸 Extract EXIF, GPS, IPTC, XMP, ICC metadata (JPEG, PNG, WebP, HEIC, TIFF)
- 🤖 Local AI analysis (SmolLM2 360M via WebLLM) — zero API key, zero cloud
- 🔒 Binary-level metadata removal (piexifjs) + Canvas fallback
- 📦 Batch processing (up to 20 files)
- 💬 AI chat about photo metadata
- 📋 Copy/Download metadata as JSON
- 🌙 Dark modern UI

## Deploy on Render
1. Fork this repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects Node.js. Set:
   - Build: `npm install`
   - Start: `node server.js`
5. Deploy!

## Tech Stack
- **Backend**: Express (Node.js)
- **EXIF Extraction**: [exifr](https://github.com/MikeKovarik/exifr)
- **EXIF Removal**: [piexifjs](https://github.com/hMatoba/piexifjs)
- **Local AI**: [@nearstack-dev/ai](https://www.npmjs.com/package/@nearstack-dev/ai) + WebLLM
