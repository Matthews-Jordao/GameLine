# 🎉 Party Pocket

Free multiplayer party games for your phone. No downloads, no accounts, no BS.

## Live Games
- 🕵️ **Secret Agent** — 3+ players, every phone joins. One person is the hidden spy.
- 🙋 **Heads Up!** — 2+ players, one device, pass it around. 6 decks included.

## Coming Soon
Trivia Blitz, Truth or Dare, Would You Rather, Doodle & Guess, Never Have I Ever, Story Builder, Name That Tune, Hot Take

## How It Works
Peer-to-peer WebRTC via PeerJS — the host phone creates a room, guests connect directly. No real-time server costs.

## Deploy

### Vercel (recommended — 30 seconds)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework: **Other** | Root: leave as `/`
4. Deploy ✅

### Netlify
1. Push to GitHub
2. [app.netlify.com](https://app.netlify.com) → New site from Git
3. Build command: *(leave blank)* | Publish directory: `.`
4. Deploy ✅

### GitHub Pages
1. Push to GitHub
2. Settings → Pages → Source: `main` branch, root `/`
3. Done ✅

### Local
Just open `index.html` in a browser. Or use any static server:
```bash
npx serve .
# or
python3 -m http.server 3000
```

## File Structure
```
/
├── index.html      ← Landing page
├── landing.css     ← Landing page styles
├── app.html        ← Game app
├── app.css         ← App styles
├── js/
│   ├── main.js     ← App controller
│   ├── room.js     ← PeerJS room manager
│   └── games/
│       ├── spy.js      ← Secret Agent game logic
│       └── headsup.js  ← Heads Up game data
├── vercel.json     ← Vercel config
└── netlify.toml    ← Netlify config
```
