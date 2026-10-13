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
