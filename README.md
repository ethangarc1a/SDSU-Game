# SDSU Game (Sober & 21+ Party Modes)

Lightweight browser game + resume site. No build tools. Deployed with GitHub Pages.

## Live Site
`https://<your-username>.github.io/SDSU-Game/`

## Folders & Files
- `index.html` – Game UI
- `styles.css` – Shared styling + themes
- `deck.js` – Data-only card deck & config
- `app.js` – Game engine (vanilla JS)
- `resume.html` – Portfolio/resume page
- `README.md` – You are here

## How to Play
- **New Game / Round** to start.
- **Next** to draw next card.
- **Crowd** meter triggers **Storm the Court** at max, then resets.
- **Trolley Tokens**: _Skip_ (skip next card) and _Boost_ (+2 on next positive point).
- **Modes**: Sober (points/water/mini-challenges) and 21+ Party (age-gated).

## Keyboard Shortcuts
- `N` – Next card  
- `S` – New Game / Round  
- `[` `]` – Crowd −1 / +1  
- `1…9` – +1 to player #1–#9 (hold `Alt/Option` for −1)  
- `Esc` – Close dialogs

## Theme
Header **Theme** cycles: System → Light → Dark. Choice persists.

## Local Dev
Open the repo in a browser (no server required). To test locally with a simple server:
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
