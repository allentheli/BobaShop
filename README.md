# Boba Shop

Boba Shop is a team game for 2 to 4 kids, about 5 to 8 years old. They run a pretend bubble tea shop at a real table and build drinks by hand from cups, Play-Doh and small pieces. This app runs on one iPad at the table. It plays the shop's boss and its customers, and it keeps the clock, the money and the score.

The full game design is in `boba-shop-handoff.md`. The build plan is in `boba-shop-claude-code.md`.

## What works now (Milestones 1 and 2: the full day)

A whole day runs from the title screen and back:

1. **Meet the boss.** The boss asks how many are playing (2, 3 or 4). Each player taps an apron color. The boss gives each apron a job, with a picture and one spoken sentence. Tap a job card to hear it again. Jobs move to the next one each day. Then the boss shows the day's coin goals for 1, 2 and 3 stars.
2. **Before opening.** Each apron gets a column with its job's checklist pictures. Tap a picture to hear what to do. The boss says a hint for the day (for example "Taro is today's special!"), and that item really does get ordered more. When every apron taps Ready, the sign flips to Open.
3. **Open.** The 5-minute shift from milestone 1: customers order, the cashier rings up, the manager taps a waiting customer and the bell to serve, and the customer leaves a tip.
4. **Closing.**
   - **Inspection:** the boss replays up to 3 random orders. Compare each one to the real cup and tap Right or Not right. A right cup earns a bonus coin, and a wrong one gets a silly face.
   - **Stars:** the day's money (with bonuses) against the goals. The money also goes into the savings jar shown on the title screen.
   - **Badges:** the boss asks whether any topping bowl ran empty. Then come "perfect day", "perfect register" and "never ran out", plus an empty fourth slot for the tea maker's badge.
   - **Cleanup song:** dough goes into its matching tub. Tap Done to return to the title screen.

**Saving:** the day is saved after every step. If the app is closed in the middle of a day, the title screen shows a big **Continue** button. **New day** starts over.

**How to make:** after jobs are given out, the boss walks the team through the station cards from the printed sheet (boba pearls, coconut jelly, gummy hearts, how much topping, tea, ice, sugar, finish the drink). Each step lights up on the card as the boss reads it. Cards for things not in today's orders (like ice at level 1) are left out. The arrows go back and forward, tapping the card repeats a step, and "Got it!" moves on. Before opening also has a "How to make" button to watch them again.

**Skipping:** hold **Skip** (top right) during Meet the boss or Before opening to go straight to the shop. In the settings, "Before the shift" can be set to Full, Jobs only (no how-to cards), or Skip to the shop.

**Decorating the shop:** the money from each day goes into the savings jar. At closing, after the badges, the day's decorator (it rotates between aprons, like the jobs) opens the decoration shop and may buy one thing: wall patterns, floors, counter colors, the sign, or things like a plant, a clock, string lights, a picture, balloons, a rug or a sleepy shop kitty. Tap once to see it in the little shop, tap again to buy. Every price is shown in coins; there are no mystery prizes, and decorations only change the look. Bought decorations show in the shop during play, and the next day a customer notices the new one. The coin button on the title screen shows the jar and lets you switch between decorations you already own.

**Music:** the cashier picks the shop's music on the radio during Before opening (the radio picture on the cashier's list). Tapping a song plays it, so kids choose by listening. During the shift, the manager or cashier can change it by tapping the radio on the wall. The music gets quieter whenever someone talks, speeds up a little as the sun sets, and stops when paused. Settings has music on/off and volume. The four songs are made by the app; any of them can be replaced by a recorded file in `js/music.js`.

**Crowd:** in the settings, Normal (up to 3 in line), Busy (faster, up to 5 in line), or Chaos (customers keep pouring in with no limit, like Overcooked).

**Drinks in progress at once:** a slider from 1 to 5, or Chaos for no limit on paid customers waiting for drinks.

**Customers:** seven kinds of visitors (cat, bear, dragon, bunny, panda, frog, penguin). Each visitor gets a random look: maybe a hat (crown, party hat, flower, bow, beanie, cap), glasses (round, sunglasses, hearts), a bow tie or scarf, sometimes a different fur color, and one of four names. They keep their look all day, including at the inspection.

**Pause:** during the day, hold the round pause button (top of the screen) for 1 second. The clock, the customers and their patience all freeze. From the pause menu you can keep playing, go Home (the day is saved, so Continue picks it up), turn the sound off, open the settings, or end the shift early (tap twice).

**Customers who wait too long:** a patience bar over each customer's head shrinks from green to yellow to red. A customer in line who runs out of patience leaves without buying. A customer who already paid and runs out while waiting for their drink leaves and gets their coins back: a red "−3" floats over their head. Both can be switched off in the settings.

**Parent settings:** hold the "Parents" button on the title screen for 3 seconds, or open Settings from the pause menu.

- **Order level** (1 to 8): 1 tea and topping, 2 cup size, 3 extra topping, 4 ice, 5 sugar, 6 fresh topping, 7 a longer line, 8 freshly brewed tea. Each detail can also be switched on or off by hand.
- **Our cups:** type how many small and large cups you have. When all are used, the shop sells out and closes early.
- **Shift length**, **what teas and toppings you have**, **drinks in progress** (1 or 2).
- **Register:** easy (picture buttons), medium (type the total), hard (the customer pays with a bigger coin; type the change). Medium and hard show a price list next to the register.
- **Call mode:** easy (the ticket travels with the cup), normal (only the manager holds the ticket), hard (customers only say hello; the order is pictures only).
- **Waiting customers:** leave or not, and patience bars on or off.
- **Lock an apron to a job**, **sound** volume and voice, a **demo shift**, and **reset** the day or everything.

- **Backup and restore:** save the whole shop (settings, savings jar, stars, history, decorations, the day in progress) as a file, or copy it as a text code. Load it on this or another iPad to bring the shop back; the app shows what is in the backup and asks twice before replacing anything.

The order level and cup counts start with the next day. Everything else changes right away.

The order pictures match the printed order ticket: the same pictures, on the same row colors and numbers (1 Cup, 2 Tea, 3 Topping, 4 Ice, 5 Sugar, 6 Notes). Freshly brewed tea is not on the ticket, so the cashier writes it on the Notes line.

## How to open it on the iPad

The app needs to be hosted on the web once. After that it works offline.

1. Turn on hosting (GitHub Pages). See "Turning on hosting" below.
2. On the iPad, open **Safari** and go to the address GitHub gives you (it looks like `https://allentheli.github.io/BobaShop/`).
3. Tap the **Share** button (the square with an arrow pointing up).
4. Tap **Add to Home Screen**, then **Add**.
5. Open Boba Shop from the Home Screen icon, turn the iPad sideways, and turn the sound up.

Always open it from the Home Screen icon. Safari can delete saved data for websites that have not been used for a while, and the Home Screen app is protected better.

## Keeping the shop safe

Safari can clear saved data from web apps that are not opened for a few weeks, and deleting the app from the Home Screen erases it. Now and then, open **Parents → Backup and restore → Save a backup file** and keep the file in Files or iCloud Drive. To move the shop to another iPad, load that file there.

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

- `?demo` plays a fast shift by itself (it does not touch the saved day).
- `?speed=4` makes a normal shift run 4 times faster.

## For developers

- Plain HTML, CSS and JavaScript modules with no build step. Open `index.html` through any web server.
- `js/config.js` holds every number that can be tuned. `js/strings.js` holds every word and spoken line. `js/assets.js` lists every picture and sound. `js/menu.js` is the menu.
- `js/logic.js` (orders, prices, tips, stars, hints, inspection, badges), `js/shift.js` (the shift), `js/jobs.js` (jobs and rotation) and `js/storage.js` (saving) have no screen code and are covered by tests. Run them with `npm test` (needs Node 20 or newer, no packages to install).
- `sw.js` keeps the app working offline. Add any new file to its list and change `VERSION`. A test checks that nothing is missing.
