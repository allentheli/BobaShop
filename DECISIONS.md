# Decisions

Choices made while building that the build instructions did not settle. One line each, newest milestone last.

## Milestone 1

- No framework and no build step: plain JavaScript modules load directly in Safari and are the simplest thing to host and keep working offline.
- The app draws on a fixed 1180 x 820 stage that is scaled to fit the screen, so every iPad shows the same layout.
- Level 1 orders have no cup size, so they cost the "plain drink" price, set to 3 coins (the small price) in `config.js`.
- A customer's order is chosen when they join the line, so the line can show their topping. The order number is given when they step up to the counter.
- Order numbers keep counting past 12 in milestone 1. Cup counting (milestone 3) will stop orders at 12 with the default cups.
- Serving takes two taps: tap the waiting customer, then the bell. This stops a stray tap from serving the wrong drink.
- Each paid customer keeps the same waiting spot until served, so the numbers on screen never shuffle.
- A served customer steps forward from their own spot to pick up the drink, so they never overlap the customer at the counter.
- The tip clock starts when the order is rung up.
- The first customer walks in 2 seconds after opening, then one every 35 seconds. A new arrival is skipped if the line is full.
- When two customers of the same kind would be on screen, the app picks whichever kind is on screen least.
- Customers in line look impatient after 45 seconds (foot tapping, a little watch). Customers in waiting spots look impatient after 150 seconds but never leave.
- When "waiting customers leave" is on (milestone 3 setting), a customer leaves the line after 100 seconds.
- At closing, a customer already at the counter can still pay and be served.
- The clock stops while the app is hidden (iPad locked or another app open).
- Sound effects are made by the app itself, so there are no sound files yet. Any of them can be replaced with a file in `assets.js`.
- The device voice prefers a clear English voice (Samantha on iPad). Each customer has their own pitch.
- The player count is asked and remembered for the shift but does not change anything until jobs arrive in milestone 2.
- The day total already shows stars against the goals, because the goals are on screen during the shift. Badges come with milestone 2.
- A small parent panel (hold "Parents" for 3 seconds) has the voice switch and the demo shift. The full settings come in milestone 3.
- The demo shift is also reachable with `?demo` in the address, for automated checks.
- Offline: the app is served from the saved copy first and refreshed in the background, so an update shows on the second launch after it is published.

## Milestone 2

- Players pick from 6 apron colors. Jobs and the decorator rotate by apron color, so the same child keeps the same color from day to day.
- Each apron moves to the job after the one it had on the last day with the same number of players. Aprons new to that player count fill the jobs left over. A parent lock (milestone 3 setting) always wins.
- The rotation moves on only when a day is finished, so restarting or abandoning a day does not skip anyone's turn.
- The day's decorator is worked out and saved now, but not shown until decorating arrives in milestone 5.
- The boss's job sentences change with the call mode (easy, normal, hard).
- The job cards play one after another, and a green arrow appears when the boss has finished. Tapping a card replays its sentence.
- Checklist pictures speak their step when tapped and turn green, but nothing has to be ticked: the Ready button is all that counts.
- A Ready button can be tapped again to undo it, until everyone is ready.
- The day's hint is a tea or a topping the family owns, ordered twice as often as the others (`hintWeight` in `config.js`).
- Inspection always speaks the order, even in hard call mode, because it is the team checking its own cups.
- The inspection orders are picked when the shift ends and saved, so continuing after a restart checks the same cups.
- A wrong inspected cup gets a winking, tongue-out face and a giggle, never a frown.
- "Perfect register" needs at least one order rung up, and "perfect day" needs at least one inspected cup.
- The savings jar and total stars are added once, at the stars step, and a saved flag stops them being added twice.
- During the shift the save happens every 2 seconds and after every order, payment and serve, so closing the app loses at most 2 seconds.
- A customer who was sipping their drink when the app closed has already paid and tipped, so they are not brought back.
- On continuing a shift, everyone appears in their place at once and the customer at the counter says their order again.
- The cleanup song is a short tune made by the app, played twice, while the boss names each dough color and tub.
- The day history keeps the last 100 days (date, players, money, stars, badges, drinks) for later use.

## Order levels (brought forward from milestone 3)

- The order level picker moved into the parent panel early, because level 1 orders only name tea and topping. The default is still level 1.
- The order level is fixed when a day starts, so changing it never changes a shift halfway.
- Order pictures follow the manager's calling order: cup size, topping, scoops, fresh, tea, ice, sugar.
- Pictures shrink to fit when an order has many details, and the bubble widens.
- The spoken order joins every detail into one sentence, for example "a large taro with three scoops of fresh boba pearls, lots of ice and half sugar".
- "No ice" and "no sugar" are a red no-sign over the ice cube and the sugar jar. Half and full sugar show the jar's fill level.
- The easy register shows a small cup, a large cup and a "fresh" button, each with its coins.
- Cups are counted only from level 2, when orders name a size. A cup is used when its order is rung up.
- A customer only joins the line if a cup is still free for them, counting the cups already promised to customers in line.
- Sold out closes the shop with a cheerful fanfare instead of the sunset sound.
- Level 7's longer line holds 5 customers (`longLine` in `config.js`).
- Level 8 (added at Allen's request): some customers ask for freshly brewed tea. It costs 1 coin more (`prices.brew`), has its own register button, and shows as a sparkly teapot right after the tea picture. The app does not track the pots; brewing happens at the table.

## Milestone 3

- The menu now matches the printed order ticket (Allen's design): toppings include "none"; "extra topping" (one more scoop than the cup calls for) replaced 1 to 3 scoops; sugar is none, some or lots; milk tea is red. Level 3 is now extra topping.
- Each order picture sits on a tile with its ticket row's color and number, so "no ice" and "no sugar" (the same dashed face on the ticket) cannot be mixed up.
- No extra or fresh topping is ever ordered with "no topping". "No topping" can always be ordered, even if the family has only some toppings.
- Extra topping costs 1 coin more, like fresh topping and freshly brewed tea (`prices` in `config.js`).
- Yes/no notes (extra, fresh, freshly brewed) come up about a third of the time, so most orders stay simple.
- Cups: any number from 0 to 99 of each size, typed in or set with + and −. Order numbers keep counting with the cups (the printed tickets have a blank number circle).
- Customers leaving (Allen's decision, changing the original "nothing is lost" rule): leaving is on by default. A customer in line leaves after 100 seconds without paying. A paid customer leaves after 3 minutes in a waiting spot and gets their coins back, shown as a red "−3" over their head with coins flying back. Their tip is lost too. Cups already used stay used.
- Patience bars (Allen's decision, changing the "no harsh countdown" rule): a bar over each waiting customer, green then yellow at the warning point then a pulsing red. No numbers. It can be hidden in the settings.
- A sad face with a tear and a soft "aww" sound when a customer leaves; never a frown at the team.
- The pause button needs a 1-second hold. It freezes the clock and every customer's patience. "End the shift" needs a second tap.
- Settings opened during a shift take effect when the settings close (the shift restarts from its save, in the same state). The order level and cup counts wait for the next day.
- Hard register: the customer pays with the smallest coin bigger than the price (5, 10 or 20), shown in the order bubble, and says it aloud.
- Medium and hard registers have a number pad with two-digit entry and a price list next to the register.
- Hard call mode hides the repeat button; the customer only says hello.
- The printable sheet is Allen's own design, so the app does not make one.
- How-to cards (Allen's request): the station cards are cut from Allen's printed sheet (`assets/cards/`), so they look exactly the same. The boss reads one line per lit-up part of the card. They play after jobs are given, before the checklists, and can be watched again from Before opening.
- Cards and lines follow the day: no ice or sugar cards until those levels, "how much" only explains sizes, extra and fresh when they are in the orders, and only the toppings the family has.
- Skip (hold 1 second) on Meet the boss and Before opening goes straight to the shop. A skipped day gives no jobs, so the job rotation waits for the next full day.
- "Before the shift" setting: Full (default), Jobs only, or Skip to the shop.
- Music (Allen's idea that a child picks it): the cashier (or the front counter at 2 players) has the radio on their Before opening list; the radio on the shop wall lets anyone change it during the shift. The choice is remembered for the next day.
- The four songs are written as notes and played by the app (free, offline). The music only plays during the shift and while choosing, so the other screens stay calm. It ducks to about a third while anyone talks.
- Crowd setting (Allen's "Overcooked" request): Busy and Chaos change how fast customers arrive and how long the line can grow (no limit in Chaos; extra customers crowd the door).
- Drinks in progress is a slider: 1 to 5, or Chaos (stored as 99, no limit). From 3 up, waiting customers stand in staggered rows of four.
- More customers (Allen's request): four new animals (bunny, panda, frog, penguin) and accessories drawn as separate pictures in `assets/accessories/`, placed by each character's head, face and neck points in `js/assets.js`. A visitor's look (hat about half the time, glasses a third, neckwear a third, fur color and name) is picked when they arrive and saved with them.
- Kids' drawings (milestone 4) will use the same head, face and neck points, so they can wear accessories too.
