# Sahil Kumar, Data Engineer

Personal portfolio: a static Next.js site with a Colour theme and a Dark theme.

## Run locally

Use Node.js 22.18 or newer.

```sh
npm ci
npm run dev        # development, http://127.0.0.1:3000
npm run build      # exports the site to out/
npm start          # serves out/
```

## Edit content

| File               | What it holds                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `data/profile.ts`  | Name, tagline, navigation, data engineering stages, AI skills, certifications, toolkit, hobbies, background, links |
| `data/projects.ts` | Project cards and filter groups                                                                                    |
| `data/icons.ts`    | Tool logos. A tool without a logo here shows a dot                                                                 |
| `lib/art.ts`       | The animated project pictures and the wheel                                                                        |
| `lib/motion.ts`    | All animation and interaction                                                                                      |
| `app/globals.css`  | Colours, type, layout, and motion rules                                                                            |

To show an email address or a résumé, set `links.email` or `links.resume` in `data/profile.ts`. Keep certification dates in step with LinkedIn, because some of them expire.

Original assets are kept locally in `legacy/static/`, which git ignores. Don't restore a root `static/` folder, because Next.js would publish it.

## How it behaves

- All content is in the HTML, so the page reads fine without JavaScript. `.js` on the root element gates anything that would otherwise hide content.
- `prefers-reduced-motion` gives a complete, still page.
- The pause button in the top bar stops all looping motion and is remembered between visits. Loops also stop when they're off screen.
- Below 1000px the wheel stacks above its text. Screens under 620px tall (521px on phones) get a plain list instead.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Browser tests run against the export on their own port, 3199, across five screen sizes and both themes, with axe accessibility scans.

For Lighthouse, serve the export on that port, then run the audit in a second terminal:

```sh
npx serve out -l tcp://127.0.0.1:3199
npm run audit
```

## Deploy

Every push to `master` builds the site and publishes it to GitHub Pages at <https://sahilbanait.github.io/personal-portfolio/> through `.github/workflows/deploy.yml`.

To move to a custom domain, set it in the repository's Pages settings, clear `NEXT_PUBLIC_BASE_PATH`, and set `NEXT_PUBLIC_SITE_URL` to the new address in the workflow.
