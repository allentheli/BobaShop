// One shift of the Open phase, as plain state. No DOM here: the screen reads
// this state and draws it, and the tests drive it directly.
//
// A customer moves through these places:
//   line -> counter -> waiting -> served -> gone
//   line -> gone (leaves when the shop closes, or runs out of patience)

import { generateOrder, price, tipFor, activeDetails, useCup, soldOut, payWith, makeLook } from './logic.js';

let nextId = 1;

export class Shift {
  // looks: { accessories, nameCount } so each visitor gets their own look.
  constructor({ config, menu, customers, rng = Math.random, onEvent = () => {}, looks = null }) {
    this.looks = looks;
    this.config = config;
    this.menu = menu;
    this.customerTypes = customers;
    this.rng = rng;
    this.emit = onEvent;

    this.time = 0;
    this.closed = false;
    this.nextArrival = config.firstArrivalAt;
    this.nextOrderNumber = 1;
    this.lastOrder = null;

    this.people = [];          // every customer still on screen
    this.served = [];          // records of served orders, for the day total
    this.sales = 0;
    this.tips = 0;
    this.registerMistakes = 0;
    this.rungUp = 0;
    this.closedBecause = null;
    this.refunds = 0;

    // Cups are counted only when orders name a size. A cup is used when
    // its order is rung up.
    // Cups are counted only when orders have a size and the family has
    // entered some cups (0 and 0 means "don't count").
    this.countsCups = activeDetails(menu, config.level, config.enabledDetails).some((d) => d.id === 'size')
      && Object.values(config.cups || {}).some((n) => n > 0);
    this.cupsLeft = { ...config.cups };
    this.cupsStart = { ...config.cups };   // to follow a change in the settings
  }

  get lineLimit() {
    const on = (this.config.enabledDetails || {}).longLine;
    return (on !== undefined ? on : this.config.level >= 7) ? this.config.longLine : this.config.lineLength;
  }

  // Cups not yet promised to a customer who is in line or ordering.
  get cupsFree() {
    const free = { ...this.cupsLeft };
    for (const p of this.people) {
      if ((p.place === 'line' || p.place === 'counter') && p.order.size) free[p.order.size] = (free[p.order.size] ?? 0) - 1;
    }
    return free;
  }

  get money() { return this.sales + this.tips; }
  get line() { return this.people.filter((p) => p.place === 'line'); }
  get counter() { return this.people.find((p) => p.place === 'counter') || null; }
  get waiting() { return this.people.filter((p) => p.place === 'waiting'); }
  get progress() { return Math.min(1, this.time / this.config.shiftLength); }

  tick(dt) {
    this.time += dt;
    for (const p of this.people) p.placeTime += dt;

    if (!this.closed && this.time >= this.config.shiftLength) this.close('sunset');
    if (!this.closed && this.countsCups && soldOut(this.cupsLeft)) this.close('soldOut');

    if (!this.closed && this.time >= this.nextArrival) {
      this.nextArrival += this.config.arrivalEvery;
      if (this.line.length < this.lineLimit) this.arrive();
    }

    if (this.config.customersLeave) {
      const pat = this.config.patience;
      if (!this.closed) {
        for (const p of this.line) if (p.placeTime >= pat.lineLeave) this.leave(p, 'gaveUp');
      }
      // A paid customer who waits too long for their drink leaves, and the
      // shop gives back what they paid.
      for (const p of this.waiting) {
        if (p.placeTime >= pat.waitLeave) {
          p.refund = p.price;
          this.sales -= p.price;
          this.refunds += p.price;
          this.leave(p, 'gaveUp');
        }
      }
    }

    this.stepUpIfFree();

    // Customers who were served or left are removed after their exit.
    this.people = this.people.filter((p) => !(p.place === 'gone' && p.placeTime > 3));
  }

  // A new order under the current rules, or null when no cup is left for it.
  // `cupsFree` may be given to count a customer's own promised cup as free.
  newOrder(cupsFree = this.cupsFree) {
    return generateOrder(this.menu, {
      level: this.config.level,
      enabled: this.config.enabledDetails,
      owned: this.config.owned,
      bias: this.config.bias,
      previous: this.lastOrder,
      cupsLeft: this.countsCups ? cupsFree : undefined,
      rng: this.rng,
    });
  }

  arrive() {
    const type = this.pickCustomerType();
    const order = this.newOrder();
    if (!order) return null;   // every cup is already promised
    this.lastOrder = order;
    const look = this.looks ? makeLook(type, this.looks.accessories, this.rng, this.looks.nameCount) : null;
    const p = { id: nextId++, type, look, order, place: 'line', placeTime: 0, number: null, paidAt: null };
    this.people.push(p);
    this.emit('arrive', p);
    return p;
  }

  // Prefer the customer type that is least on screen right now.
  pickCustomerType() {
    const counts = new Map(this.customerTypes.map((c) => [c.id, 0]));
    for (const p of this.people) if (p.place !== 'gone') counts.set(p.type.id, (counts.get(p.type.id) || 0) + 1);
    const least = Math.min(...counts.values());
    const pool = this.customerTypes.filter((c) => counts.get(c.id) === least);
    return pool[Math.floor(this.rng() * pool.length)];
  }

  // A customer steps up only when a waiting spot is free.
  stepUpIfFree() {
    if (this.closed || this.counter) return;
    if (this.waiting.length >= this.config.drinksInProgress) return;
    const next = this.line[0];
    if (!next) return;
    this.move(next, 'counter');
    next.number = this.nextOrderNumber++;
    next.pays = payWith(price(next.order, this.config.prices), this.config.payCoins);
    this.emit('stepUp', next);
  }

  // The register reports a total. Returns true when it is right.
  ringUp(total) {
    const p = this.counter;
    if (!p) return false;
    const due = price(p.order, this.config.prices);
    if (total !== due) {
      p.registerWrong = true;
      this.registerMistakes++;
      this.emit('wrongTotal', p);
      return false;
    }
    p.price = due;
    p.paidAt = this.time;
    if (this.countsCups) this.cupsLeft = useCup(this.cupsLeft, p.order);
    // Each customer keeps the same waiting spot until served, so the
    // numbers on screen never shuffle around.
    // A spot where a served customer is still sipping is used only if
    // there is no other choice.
    // (If the setting was lowered mid-shift, there may be more customers
    // waiting than spots; there is always a free spot for the new one.)
    const spots = [...Array(Math.max(this.config.drinksInProgress, this.waiting.length + 1)).keys()];
    const waitingIn = new Set(this.waiting.map((q) => q.spot));
    const sippingIn = new Set(this.people.filter((q) => q.place === 'served').map((q) => q.spot));
    p.spot = spots.find((i) => !waitingIn.has(i) && !sippingIn.has(i))
      ?? spots.find((i) => !waitingIn.has(i));
    this.sales += due;
    this.rungUp++;
    this.move(p, 'waiting');
    this.emit('paid', p);
    return true;
  }

  serve(id) {
    const p = this.people.find((q) => q.id === id && q.place === 'waiting');
    if (!p) return null;
    const tip = tipFor(this.time - p.paidAt, this.config.tips);
    p.tip = tip;
    this.tips += tip;
    this.move(p, 'served');
    this.served.push({ number: p.number, order: p.order, type: p.type.id, look: p.look, price: p.price, tip });
    this.emit('served', p);
    return p;
  }

  // Called by the screen once a served customer has had their sip.
  finishServed(id) {
    const p = this.people.find((q) => q.id === id && q.place === 'served');
    if (p) this.move(p, 'gone');
  }

  leave(p, why) {
    this.move(p, 'gone');
    p.leftBecause = why;
    this.emit('leave', p);
  }

  // why: 'sunset' when the shift time is up, 'soldOut' when every cup is used.
  close(why = 'sunset') {
    this.closed = true;
    this.closedBecause = why;
    this.emit('close', why);
    // Customers in line leave cheerfully. Anyone already ordering stays.
    for (const p of this.line) this.leave(p, 'closed');
  }

  move(p, place) {
    p.place = place;
    p.placeTime = 0;
  }

  // How much patience a customer has left, from 1 (full) to 0, and whether
  // they are past the warning point. Customers at the counter or served
  // have no bar.
  patienceOf(p) {
    const pat = this.config.patience;
    if (p.place === 'line') return { left: Math.max(0, 1 - p.placeTime / pat.lineLeave), warn: p.placeTime >= pat.lineWarn };
    if (p.place === 'waiting') return { left: Math.max(0, 1 - p.placeTime / pat.waitLeave), warn: p.placeTime >= pat.waitWarn };
    return null;
  }

  // True when nothing more can happen except pressing Finish.
  get allDone() {
    return this.closed && !this.counter && this.waiting.length === 0;
  }

  // A plain copy of the shift for saving. Customers who already left, or
  // who were served and are only sipping, are not kept.
  toJSON() {
    return {
      time: this.time,
      closed: this.closed,
      nextArrival: this.nextArrival,
      nextOrderNumber: this.nextOrderNumber,
      lastOrder: this.lastOrder,
      people: this.people
        .filter((p) => p.place === 'line' || p.place === 'counter' || p.place === 'waiting')
        .map((p) => ({ ...p, type: p.type.id })),
      served: this.served.slice(),
      sales: this.sales,
      tips: this.tips,
      registerMistakes: this.registerMistakes,
      rungUp: this.rungUp,
      cupsLeft: this.cupsLeft,
      cupsStart: this.cupsStart,
      closedBecause: this.closedBecause,
      refunds: this.refunds,
    };
  }

  // After a parent changed the order level or details in the middle of the
  // shift: customers who have not paid yet (in line or at the counter) get a
  // new order that fits, so the register and the orders always agree.
  // Customers who already paid keep theirs (their drink is being made).
  // Returns the customers whose order changed.
  refitOrders() {
    const want = activeDetails(this.menu, this.config.level, this.config.enabledDetails).map((d) => d.id).sort().join();
    const changed = [];
    for (const p of this.people) {
      if (p.place !== 'line' && p.place !== 'counter') continue;
      if (Object.keys(p.order).sort().join() === want) continue;
      const free = this.cupsFree;
      if (p.order.size && free[p.order.size] !== undefined) free[p.order.size]++;
      const order = this.newOrder(free);
      // No cup left for them: they quietly go (the screen is not drawn yet).
      if (!order) { this.people = this.people.filter((q) => q !== p); continue; }
      p.order = order;
      if (p.place === 'counter') {
        p.pays = payWith(price(order, this.config.prices), this.config.payCoins);
        p.registerWrong = false;
      }
      changed.push(p);
    }
    return changed;
  }

  // Rebuild a saved shift. Customers whose kind no longer exists come back
  // as the first kind. If the cup counts were changed in the settings, the
  // cups already used still count.
  static restore(data, opts) {
    const s = new Shift(opts);
    for (const k of ['time', 'closed', 'nextArrival', 'nextOrderNumber', 'lastOrder', 'sales', 'tips', 'registerMistakes', 'rungUp', 'cupsLeft', 'closedBecause', 'refunds']) {
      if (data[k] !== undefined) s[k] = data[k];
    }
    s.served = (data.served || []).slice();
    s.people = (data.people || []).map((p) => ({
      ...p,
      type: opts.customers.find((c) => c.id === p.type) || opts.customers[0],
    }));
    nextId = Math.max(nextId, ...s.people.map((p) => p.id + 1));
    if (data.cupsStart && data.cupsLeft) {
      for (const size of Object.keys(s.cupsStart)) {
        const used = (data.cupsStart[size] ?? 0) - (data.cupsLeft[size] ?? 0);
        s.cupsLeft[size] = Math.max(0, s.cupsStart[size] - used);
      }
    }
    s.refitOrders();
    return s;
  }

  summary() {
    return {
      money: this.money,
      sales: this.sales,
      tips: this.tips,
      drinks: this.served.length,
      registerMistakes: this.registerMistakes,
      rungUp: this.rungUp,
      soldOut: this.closedBecause === 'soldOut',
      refunds: this.refunds,
      served: this.served.slice(),
    };
  }
}
