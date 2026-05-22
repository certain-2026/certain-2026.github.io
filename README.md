# CERTAIN @ NeurIPS 2026

Static website for the CERTAIN workshop at NeurIPS 2026, served from this repository via GitHub Pages at <https://certain-2026.github.io/>.

The site is plain HTML, hand-written CSS, and a single vanilla JS file — no build step.

## Structure

- `index.html`, `students.html`, `schedule.html`, `sessions.html`, `404.html` — pages
- `css/site.css` — stylesheet
- `js/nav.js` — navigation, scroll spy, scroll reveal, smooth scroll
- `img/` — images (people photos, logos, favicon, OG card)
- `fonts/` — self-hosted webfonts
- `attributions.json` — photo attributions
- `robots.txt`, `sitemap.xml` — SEO

## Local preview

Open `index.html` directly in a browser, or run any static file server:

```sh
python3 -m http.server 8080
```

Then visit <http://localhost:8080>.

## Deployment

GitHub Pages serves the working copy of the default branch — no build step. To deploy a change, commit and push to `main`.
