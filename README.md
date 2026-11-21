# VDT Mini Project Portfolio — Team 02 (T1A1)

FPGA-Controlled Variable Gain Amplifier · EE-VDT · KLE Technological University

Static site (HTML + CSS + JS, no build). Structure follows the *Mini Project Portfolio Guide — EE-VDT*:
Home + 15 pages (`index`, `team`, `problem`, `concepts`, `requirements`, `architecture`, `design`,
`integration`, `build`, `validation`, `failures`, `notebook`, `reviews`, `reflections`, `demo`, `files`).

## Editing content
Everything is in **`assets/js/data.js`**. Add newest entries at the top of each array, dates as `YYYY-MM-DD`.
Search for `TODO` to find placeholders. Put images/videos in `assets/img/` and reference them as `assets/img/name.png`.

Weekly rhythm (Guide): Monday plan a notebook entry, post predictions before measurements, Friday close the entry
and update `steps` status (progress strip) and `latest`.

## Preview locally
Run `node dev-server.mjs` (Node 18+, no install) and open http://localhost:3000. It serves clean URLs like Vercel and runs
`middleware.js`, so `/admin` and `/login` work. Without `ADMIN_PASSWORD` set, the local admin password is `admin`
(`ADMIN_PASSWORD=secret PORT=4000 node dev-server.mjs` to change either).

## Admin login
`/admin` redirects to the `/login` form. The password is the `ADMIN_PASSWORD` environment variable (set it in Vercel
Project Settings; never commit it). A correct password sets an HttpOnly session cookie for 8 hours; `/logout` ends it.
If the variable is missing the admin is unavailable. There is no attempt limit at the edge: add a Vercel Firewall
rate-limit rule on `POST /login` if the site is public.

## Tests
`node --test tests/auth.test.mjs` needs nothing. The browser tests also need Playwright:
`PLAYWRIGHT_DIR=<folder with node_modules/playwright> node --test tests/`.

## Deploy on Vercel
1. Push this folder to a GitHub repo (or run `npx vercel` in this folder).
2. Import in Vercel: Framework preset **Other**, no build command, output directory `.` (root).
3. Name the project `vdt-mp-2026-T1A1-team02`.
Note: the Guide asks for access restricted to kletech.ac.in — enable Vercel Password Protection / Vercel Authentication
for the project, and add the mentor and coordinator.
