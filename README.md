# Boba Shop

Boba Shop is a team game for 2 to 4 kids, about 5 to 8 years old. They run a pretend bubble tea shop at a real table and build drinks by hand from cups, Play-Doh and small pieces. This app runs on one iPad at the table. It plays the shop's boss and its customers, and it keeps the clock, the money and the score.

The full game design is in `boba-shop-handoff.md`. The build plan is in `boba-shop-claude-code.md`.

## What works now (Milestone 1: one shift)

- Title screen with a big Start button.
- The boss asks how many players there are.
- A 5-minute shift. Customers walk in, wait in line (each shows the topping they want), step up to the counter and order by voice and pictures.
- The easy register: tap the drink button, then the green check. A wrong total gets a friendly "Hmm" and another try.
- Paid customers wait in one of two numbered spots. Tap a waiting customer, then the bell, to serve. They sip, hop and leave a tip.
- The sun crosses the shop window as the clock. When it sets, the sign flips to Closed and a Finish button appears.
- A day total with coins, tips, stars and drinks served.
- Parents: hold the "Parents" button on the title screen for 3 seconds to turn the voice on or off, or to watch a demo shift that plays itself at high speed.

## How to open it on the iPad

The app needs to be hosted on the web once. After that it works offline.

1. Turn on hosting (GitHub Pages). See "Turning on hosting" below.
2. On the iPad, open **Safari** and go to the address GitHub gives you (it looks like `https://allentheli.github.io/BobaShop/`).
3. Tap the **Share** button (the square with an arrow pointing up).
4. Tap **Add to Home Screen**, then **Add**.
5. Open Boba Shop from the Home Screen icon, turn the iPad sideways, and turn the sound up.

Always open it from the Home Screen icon. Safari can delete saved data for websites that have not been used for a while, and the Home Screen app is protected better.

## Turning on hosting

GitHub Pages is free for **public** repositories. This repository is currently **private**, and Pages for private repositories needs a paid GitHub plan. Choose one:

- Make the repository public (free). The code and the placeholder art become visible to anyone. No family photos, drawings or voices are ever stored in the repository; those stay on the iPad.
- Or keep it private and upgrade to GitHub Pro (costs money).

Then:

1. On github.com, open the **BobaShop** repository.
2. Click **Settings** (top right of the repository page).
3. In the left menu, click **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Under **Branch**, pick the branch with the app (for now `claude/new-session-0tzwq4`, or `main` once the work is merged), choose **/ (root)**, and click **Save**.
6. Wait a minute or two and refresh. The page shows the web address at the top.

## Trying it on a computer

Open the web address in Chrome and make the window wide. On your own computer you can also run `npm run serve` in this folder and open `http://localhost:8080`.

Handy addresses for testing:

- `?demo` plays a fast shift by itself.
- `?speed=4` makes a normal shift run 4 times faster.

## For developers

- Plain HTML, CSS and JavaScript modules with no build step. Open `index.html` through any web server.
- `js/config.js` holds every number that can be tuned. `js/strings.js` holds every word and spoken line. `js/assets.js` lists every picture and sound. `js/menu.js` is the menu.
- `js/logic.js` (orders, prices, tips, stars) and `js/shift.js` (the shift) have no screen code and are covered by tests. Run them with `npm test` (needs Node 20 or newer, no packages to install).
- `sw.js` keeps the app working offline. Add any new file to its list and change `VERSION`. A test checks that nothing is missing.
