# Boba Shop: build instructions for Claude Code

Last updated: October 13, 2026

You are building the tablet app for Boba Shop, a family tabletop game. Read this whole file before writing code. The companion file `boba-shop-handoff.md` has the full game design and the reasons behind it.

## 1. What you are building

Boba Shop is a team game where 2 to 4 kids, about 5 to 8 years old, run a pretend bubble tea shop at a real table. They build drinks by hand from cups, Play-Doh and small pieces. The app runs on one iPad at the table and plays the shop's boss and its customers. It also keeps the clock, the money and the score.

The app is one part of a physical game. Most of the play happens off the screen.

## 2. Who you are working with

- Allen owns the project and does not write code. Do the work yourself, run it, and tell him in plain words how to see the result.
- When he has to do something by hand (create a repository, turn on hosting, add the app to the Home Screen), give numbered steps with the exact names of buttons.
- Explain choices in everyday language and skip jargon.
- Ask at most one question at a time, and only when the answer changes what you build. Otherwise pick the simplest option, make it a setting, and record it in `DECISIONS.md`.
- Ask before publishing anything or doing anything that costs money.
- Never report something as working unless you ran it.

## 3. Hard rules

1. **The app cannot see the table.** It never knows what is in a cup, how full a bowl is, or whether tea has been brewed. Never build a feature that pretends otherwise.
2. **Kids need no reading.** Every order, instruction and button works through voice and pictures. Text is a secondary label for parents.
3. **Screen time stays short.** The big animations happen when a customer arrives and when a drink is served. The screen stays calm while the kids are building.
4. **Nothing fails harshly.** No game-over screens, no losing money, no scolding. A mistake gets a friendly retry.
5. **No accounts, no ads, no analytics, no network calls while playing.** Everything is saved on the device. Kids' drawings and voice recordings never leave the device.
6. **No camera scanning of cups or tags.**
7. **Build only what this file lists.** Section 13 lists ideas that are parked on purpose.

## 4. Technical approach

This follows the pattern of Allen's other family apps.

- A static web app in plain HTML, CSS and JavaScript, with no build step and no framework unless you can justify one in `DECISIONS.md`.
- Hosted on GitHub Pages. Installable to the iPad Home Screen and playable offline (web app manifest and a service worker).
- Target: iPad Safari in landscape. It should also work in desktop Chrome for testing.
- Milestone 1 may be a single `index.html` if that is fastest. Split it into modules once it grows.
- Save settings and progress in `localStorage`. Save images and audio in IndexedDB.
- Draw characters and effects with SVG and CSS animation.
- Keep every piece of art and audio as a swappable file listed in one manifest, so pictures and voices can be replaced without changing code.
- Keep every tunable number in one config file, and show the important ones in the parent settings screen.
- Keep all on-screen words and spoken lines in one strings file, so another language can be added later.

iPad details to handle:

- Audio and speech need a tap before they will play. Use the first "Start" tap to unlock them.
- Turn off double-tap zoom, text selection, long-press menus and rubber-band scrolling.
- Ask the browser to keep the screen awake during a shift, where supported.
- Safari may clear saved data for a site that has not been used for a while. Tell Allen to add the app to the Home Screen, and build the backup code in section 10.

## 5. The physical game, briefly

You need this to understand what the screens are for.

- **Jobs:** Cashier (plays the tablet and fills in paper tickets), manager (holds the ticket, calls each step aloud, checks the cup by eye, taps the tablet to serve), topping maker (Play-Doh), tea maker (builds the drink and adds the lid).
- **The call:** The cashier hands each ticket to the manager. The makers never see the ticket, and the manager never touches the cup. The makers build from what the manager says.
- **With 3 players** the jobs are cashier, manager and one maker. **With 2 players** they are front counter (cashier and manager) and one maker.
- **Order tickets** are paper, numbered 1 to 12. The cashier circles pictures on them. The app's order numbers must match: the first order of the day is number 1.
- **Cups** come in two sizes, 6 small and 6 large by default. Finished drinks stay on the table until closing.
- **Physical only, never tracked by the app:** tea pots and brewing, ice, sugar, topping stock, the bell, the sand timer.

## 6. Game data

### Menu

| Detail | Values | Default level it appears |
| --- | --- | --- |
| Tea flavor | Milk tea (brown), matcha (green), taro (purple) | 1 |
| Topping (exactly one per order) | Boba pearls (black), coconut jelly (white), gummy hearts (red) | 1 |
| Cup size | Small, large | 2 |
| Scoops of topping | 1, 2, 3 | 3 |
| Ice | None, some, lots | 4 |
| Sugar | None, half, full | 5 |
| Fresh topping | Yes or no | 6 |

Make the menu data-driven, so a flavor, a topping or a whole second menu can be added without code changes.

### Order generator

- Use only the details and items a parent has switched on.
- Never order a cup size that has run out (section 8).
- At levels below a detail's level, leave that detail out of the order entirely.
- Apply the boss's hint for the day as a mild bias. "Taro is today's special" means more taro orders.
- Avoid giving the same order twice in a row.

### Customers

Each customer is a data record: id, name, body picture, where the face goes on the picture, color, and voice clips. Start with three code-drawn placeholders: Mochi the cat, Bao the bear and Taro the dragon. Each customer needs three expressions: waiting, happy and impatient.

### Config defaults

All of these are guesses to be tuned after playtesting.

| Setting | Default |
| --- | --- |
| Shift length | 5 minutes |
| Cups | 6 small, 6 large |
| Drinks in progress at once | 2 |
| Customers waiting in line | Up to 3 |
| Time between arrivals | 35 seconds |
| Price | Small 3 coins, large 5, fresh adds 1 |
| Tip | 2 coins if served within 75 seconds of the order, 1 coin within 150 seconds, otherwise 0 |
| Inspection | 3 drinks, bonus tip of 1 coin for each correct one |
| Star goals | 10, 18 and 26 coins for 1, 2 and 3 stars |
| Waiting customers leave | Off on easy, on at normal |
| Call mode | Normal |

## 7. Screens and flow

The app is one loop: Title, Meet the boss, Before opening, Open, Closing, then back to Title.

### Title

- One large Start button. This tap also unlocks sound.
- A parent settings button that needs a 3-second hold.

### Meet the boss

1. The boss greets the team by voice and asks how many are playing. Buttons: 2, 3, 4.
2. Each player taps an apron color.
3. The boss gives each apron a job and explains it in one spoken sentence with a picture.
4. The boss shows the day's coin goals for stars.

Job sets: with 4 players the jobs are cashier, manager, topping maker and tea maker. With 3 they are cashier, manager and one maker. With 2 they are front counter (cashier and manager) and one maker.

Jobs rotate: shift each apron to the next job from the previous day. A parent can lock an apron to a job in settings. Pick the day's decorator the same way (section 9).

### Before opening

- Show a picture checklist for each job. The items are things done at the table, so the app does not check them.
- The boss speaks one hint for the day.
- Each apron has a Ready button. When all are tapped, the sign flips to Open.

Checklists: cashier (stack tickets, try the register), manager (brew the first pot of each flavor, set up the ticket rail), topping maker (make a starting batch of each topping), tea maker (set out the cups by size, fill the ice and sugar bowls, stack lids and straws).

### Open

The view is from behind the counter, looking at the door. The screen has five areas:

- **Counter:** One customer at a time walks up, greets the team and orders. The order is spoken and shown as a row of pictures with its order number. A button repeats the voice.
- **Register:** See below.
- **Line:** Up to 3 customers wait at the door. Each shows a small picture of the topping they will order, so the cashier can warn the team.
- **Waiting spots:** Up to 2 customers whose orders were taken wait here while their drinks are made.
- **Clock and goal:** A sun crosses the shop window over the shift. The day's money shows against the star goals.

Order steps on the tablet:

1. A customer steps up to the counter only when a waiting spot is free.
2. The cashier circles the order on paper, then rings it up on the register. At the table, the cashier then hands the ticket to the manager, who calls the steps to the makers.
3. When the total is right, the drawer opens with a sound, the customer pays, and the customer moves to a waiting spot. The price is added to the day's money.
4. Later, the manager taps that customer in a waiting spot to serve the drink. The customer walks to the counter, picks up the drink, sips, reacts happily and leaves a tip based on the time since the order was taken.

Register modes, set per session in parent settings:

- **Easy:** Picture buttons for the priced parts of the order (cup size, fresh). The cashier taps the ones on the ticket and the register adds them up.
- **Medium:** A number pad. The cashier adds the prices and types the total.
- **Hard:** The customer pays with a bigger coin and the cashier types the change.

A wrong total gets a friendly spoken "Hmm, that doesn't sound right" and another try. The only cost is the "perfect register" badge.

Call mode, set in parent settings, decides how much of the order the whole table hears:

- **Easy:** The customer says the whole order aloud. At the table the makers may read the ticket.
- **Normal:** The same on the tablet as easy. At the table only the manager holds the ticket.
- **Hard:** The customer only greets the team aloud. The order shows as pictures and is not spoken, and the repeat button is hidden.

The boss's spoken job explanations in Meet the boss should match the call mode.

Waiting and patience:

- Customers in line show impatience with body language (foot tapping, checking a watch). Do not show a harsh countdown.
- If "waiting customers leave" is on, a customer who runs out of patience in line leaves without buying. No money is lost.
- A customer whose order was taken never leaves.

Running out of cups:

- Reduce the count for a size when an order of that size is taken.
- When every cup is used, the shop is "sold out" and goes to Closing early, presented as a win.

End of shift:

- When the sun sets, the sign flips to Closed. No new customer steps up, and customers in line leave cheerfully.
- Customers in waiting spots can still be served. A "Finish" button moves on to Closing.

### Closing

1. **Boss inspection:** Pick 3 served orders at random, or all of them if fewer were served. For each, replay the order by voice and pictures with its order number. The team compares it to the real cup, and the manager taps "Right" or "Not right." A right answer brings the customer back for a happy sip and a bonus tip. A wrong one gets a funny face and no bonus.
2. **Stars:** Count the day's money against the goals and award 1 to 3 stars.
3. **Badges:** "Perfect day" if every inspected cup was right. "Perfect register" if every total was right the first time. "Never ran out" is on the honor system: the boss asks whether any topping bowl ran empty and a player taps the answer. The tea maker's badge is undecided, so leave a slot for a fourth badge.
4. **Decorating:** See section 9.
5. **Cleanup song:** Play a short song with a picture of each dough color going into its tub. A "Done" button returns to Title.

## 8. Parent settings

Behind the 3-second hold on the Title screen:

- Number of cups of each size on the table
- Shift length
- Order level (1 to 7), or each detail switched on or off
- Which tea flavors and toppings the family owns
- Register mode
- Call mode: easy, normal or hard
- Drinks in progress at once: 1 or 2
- Waiting customers leave: on or off
- Lock an apron to a job
- Sound volume and voice on or off
- Backup code: export and import (section 10)
- Reset the day, and reset everything (with a confirmation)

During a shift, a small pause button that needs a hold freezes the clock and all timers.

## 9. Decorating the shop

- The day's money is added to a savings jar that carries over between sessions.
- At closing, the day's decorator opens the catalog and may buy one item. The decorator role rotates across aprons like the jobs.
- Every item is a direct purchase at a shown price. Do not build random boxes, mystery prizes or anything that works like gambling.
- Decorations change only how the shop looks. They never change difficulty, prices or tips.
- First version: colors and patterns for the wall, the floor, the counter and the sign, drawn in code. Furniture, plants, lights and a shop pet come later as art allows.
- Owned decorations show in the Open view behind the customers. Now and then a customer mentions a new one.
- Price items so that something is affordable after any ordinary day, and the largest items take three or four days.
- New toppings and customers unlock with stars, never with money. A new topping still has to be switched on by a parent, because the family must own the real pieces.

## 10. Saving

- Save after every change: settings, savings jar, owned and chosen decorations, stars, unlocks, the job rotation, and the state of a shift in progress.
- If the app is closed during a shift, offer to continue it on the next launch.
- Backup code: a button that turns the whole save into a link or a code a parent can copy, and a way to load one. This moves the shop to another tablet and protects against lost data.

## 11. Art and sound

- **Milestones 1 to 3:** Code-drawn placeholder characters and icons. The built-in device voice speaks everything.
- **Ingredient icons:** One simple, consistent set. The same pictures will be printed on paper tickets and bowl labels, so make them exportable as a printable sheet.
- **Custom customers (milestone 4):** A parent picks a photo of a child's drawing and drags a face into place on it once. The app then draws eyes and a mouth on top that can blink, talk, smile and frown. The photo should already have its background removed, which the iPad can do by lifting the subject out of a photo. Use the file picker, which lets the parent choose from the photo library.
- **Recorded voices (milestone 4):** Let a parent attach short audio clips for greetings and reactions per customer. Orders have too many combinations to record whole, so the device voice keeps speaking those.
- Use movement for emotion too: a hop with stars for happy, a wobble for unsure.

## 12. Build order

Finish and show each milestone before starting the next. Each one ends with something Allen can open on the iPad.

**Milestone 1: one shift.** Title, a quick player count, the Open phase with plain orders (tea and topping only), the easy register, tapping a waiting customer to serve, the sun clock, tips, and a day total at the end. Done when four people can play a 5-minute shift from start to finish on the iPad with sound.

**Milestone 2: the full day.** Meet the boss with aprons and job rotation, Before opening with checklists and Ready buttons, Closing with the inspection, stars, badges and the cleanup song. Saving and continuing a shift. Done when a whole day runs from Title back to Title and survives closing the app halfway.

**Milestone 3: settings and difficulty.** Parent settings, cup counting and sold out, order levels 1 to 7, register medium and hard, call mode, waiting customers leaving, the pause button, the printable sheet of tickets and bowl labels. Done when a parent can set up an easy game and a hard game without help.

**Milestone 4: the family's own customers.** Customers from kids' drawings with app-drawn faces, recorded voice clips, and the backup code. Done when a drawing photographed on the iPad walks into the shop and orders.

**Milestone 5: decorating.** The savings jar, the catalog, the decorator of the day, and decorations showing in the shop. Whether this moves earlier is an open question, so keep the save format ready for it from milestone 2.

## 13. Parked on purpose

Do not build these unless Allen asks:

- Tricksters, regulars who order "the usual," free samples
- Changed minds, rush hour, supplies running out mid-shift
- Riddle orders and orders that disappear
- Silly rules, delivery orders, kid-invented specials
- A froyo menu
- Anything that tracks tea pots, ice, sugar or topping stock

## 14. Open design questions that touch the app

Build these as settings with the defaults shown, so the answer can change without new code.

| Question | Default for now |
| --- | --- |
| How the tea is represented on the table | Does not affect the app. Orders name only a tea flavor |
| Shift length | 5 minutes |
| Number of cups | 6 small, 6 large |
| Whether one manager can call two drinks at once | 2 drinks in progress, with a setting to drop to 1 |
| Waiting customers leave | Off on easy, on at normal |
| Inspection size | 3 drinks |
| Prices, tips and star goals | Section 6 |
| The boss's name and look | A friendly placeholder shopkeeper called "the boss" |
| Tea maker's badge | An empty fourth badge slot |

## 15. Robustness and testing

- Ignore double taps and taps during animations. Every button should respond once.
- Make touch targets large, at least 64 pixels, with space between them.
- Add a demo mode, reachable from parent settings, that plays a shift by itself at high speed. Use it to check timing and to find stuck states.
- Write small automated tests for the order generator, pricing, tips, cup counting and star goals.
- Test in landscape on an iPad-sized screen before calling a milestone done, and say plainly what you could not test.

## 16. Files to keep in the repository

- `README.md`: what the app is and how to open it, in plain language
- `DECISIONS.md`: each choice you made that this file did not settle, one line each
- `CHANGELOG.md`: what changed in each milestone, in plain language
- This file and `boba-shop-handoff.md`
