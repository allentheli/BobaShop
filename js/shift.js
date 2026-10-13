// One shift of the Open phase, as plain state. No DOM here: the screen reads
// this state and draws it, and the tests drive it directly.
//
// A customer moves through these places:
//   line -> counter -> waiting -> served -> gone
//   line -> gone (leaves when the shop closes, or runs out of patience)

import { generateOrder, price, tipFor } from './logic.js';

let nextId = 1;

export class Shift {
  constructor({ config, menu, customers, rng = Math.random, onEvent = () => {} }) {
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
  }

  get money() { return this.sales + this.tips; }
  get line() { return this.people.filter((p) => p.place === 'line'); }
  get counter() { return this.people.find((p) => p.place === 'counter') || null; }
  get waiting() { return this.people.filter((p) => p.place === 'waiting'); }
  get progress() { return Math.min(1, this.time / this.config.shiftLength); }

  tick(dt) {
    this.time += dt;
    for (const p of this.people) p.placeTime += dt;

    if (!this.closed && this.time >= this.config.shiftLength) this.close();

    if (!this.closed && this.time >= this.nextArrival) {
      this.nextArrival += this.config.arrivalEvery;
      if (this.line.length < this.config.lineLength) this.arrive();
    }

    if (!this.closed && this.config.waitingCustomersLeave) {
      for (const p of this.line) {
        if (p.placeTime >= this.config.patience.leaveAfter) this.leave(p, 'gaveUp');
      }
    }

    this.stepUpIfFree();

    // Customers who were served or left are removed after their exit.
    this.people = this.people.filter((p) => !(p.place === 'gone' && p.placeTime > 3));
  }

  arrive() {
    const type = this.pickCustomerType();
    const order = generateOrder(this.menu, {
      level: this.config.level,
      enabled: this.config.enabledDetails,
      owned: this.config.owned,
      bias: this.config.bias,
      previous: this.lastOrder,
      rng: this.rng,
    });
    if (!order) return null;
    this.lastOrder = order;
    const p = { id: nextId++, type, order, place: 'line', placeTime: 0, number: null, paidAt: null };
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
    // Each customer keeps the same waiting spot until served, so the
    // numbers on screen never shuffle around.
    // A spot where a served customer is still sipping is used only if
    // there is no other choice.
    const spots = [...Array(this.config.drinksInProgress).keys()];
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
    this.served.push({ number: p.number, order: p.order, type: p.type.id, price: p.price, tip });
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

  close() {
    this.closed = true;
    this.emit('close');
    // Customers in line leave cheerfully. Anyone already ordering stays.
    for (const p of this.line) this.leave(p, 'closed');
  }

  move(p, place) {
    p.place = place;
    p.placeTime = 0;
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
    };
  }

  // Rebuild a saved shift. Customers whose kind no longer exists come back
  // as the first kind.
  static restore(data, opts) {
    const s = new Shift(opts);
    for (const k of ['time', 'closed', 'nextArrival', 'nextOrderNumber', 'lastOrder', 'sales', 'tips', 'registerMistakes', 'rungUp']) {
      if (data[k] !== undefined) s[k] = data[k];
    }
    s.served = (data.served || []).slice();
    s.people = (data.people || []).map((p) => ({
      ...p,
      type: opts.customers.find((c) => c.id === p.type) || opts.customers[0],
    }));
    nextId = Math.max(nextId, ...s.people.map((p) => p.id + 1));
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
      served: this.served.slice(),
    };
  }
}
