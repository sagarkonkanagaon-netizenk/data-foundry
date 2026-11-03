# Banner source

`banner-scene.html` is the three.js scene behind the link preview, the LinkedIn cover and
the animated strip (`public/brand/`). To re-render:

1. From this folder, link three and the fonts: `ln -s ../node_modules/three three`, then put
   Space Grotesk and JetBrains Mono woff2 files plus a `fonts/fonts.css` next to it.
2. Serve the folder (`python3 -m http.server 8765`) and open
   `banner-scene.html?mode=og&w=1200&h=630` (or `mode=cover&w=1584&h=396`,
   `mode=strip&w=1600&h=500`). Screenshot `#stage` at 2x.
3. For the strip, call `window.renderAt(t)` for t = 0, 1/30, ... 10 and encode the frames
   with ffmpeg (H.264, CRF 26). Every motion repeats every 10 s, so the loop is seamless.
