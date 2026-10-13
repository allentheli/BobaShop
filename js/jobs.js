// Jobs, aprons and the daily rotation. Pure logic, covered by tests.

// Apron colors, in a fixed order. The order also decides who decorates next.
export const APRONS = [
  { id: 'pink', color: '#ff8fb1' },
  { id: 'blue', color: '#5bb8f0' },
  { id: 'yellow', color: '#ffd23f' },
  { id: 'green', color: '#5fcf7f' },
  { id: 'orange', color: '#ff9f43' },
  { id: 'purple', color: '#a983cf' },
];

// The jobs for each number of players, in rotation order.
export const JOB_SETS = {
  4: ['cashier', 'manager', 'topping', 'tea'],
  3: ['cashier', 'manager', 'maker'],
  2: ['front', 'maker'],
};

// Picture checklists for Before opening. Each item is an icon key in
// js/assets.js and a spoken line in js/strings.js (checklist.<item>).
export const CHECKLISTS = {
  cashier: ['tickets', 'register'],
  manager: ['brew', 'rail'],
  topping: ['batch'],
  tea: ['cups', 'bowls', 'lids'],
  maker: ['batch', 'cups', 'bowls', 'lids'],
  front: ['tickets', 'register', 'brew', 'rail'],
};

// Give each apron a job.
//   aprons:   apron ids playing today, in the order they were picked
//   previous: { apronId: jobId } from the last day with this many players
//   locks:    { apronId: jobId } set by a parent; these always win
// Each apron moves to the job after the one it had last time.
export function assignJobs(aprons, previous = {}, locks = {}) {
  const jobs = JOB_SETS[aprons.length];
  if (!jobs) throw new Error(`No jobs for ${aprons.length} players`);
  const n = jobs.length;
  const result = {};
  const taken = new Set();

  for (const a of aprons) {
    const j = locks[a];
    if (j && jobs.includes(j) && !taken.has(j)) { result[a] = j; taken.add(j); }
  }

  const startIndex = (a) => (previous[a] && jobs.includes(previous[a]) ? (jobs.indexOf(previous[a]) + 1) % n : null);

  // Aprons that played last time go first, so they move on fairly.
  const order = [...aprons.filter((a) => startIndex(a) !== null), ...aprons.filter((a) => startIndex(a) === null)];
  for (const a of order) {
    if (result[a]) continue;
    const start = startIndex(a) ?? 0;
    for (let k = 0; k < n; k++) {
      const j = jobs[(start + k) % n];
      if (!taken.has(j)) { result[a] = j; taken.add(j); break; }
    }
  }
  return result;
}

// The day's decorator: the next apron after the last decorator, in the
// fixed apron order, among the aprons playing today.
export function nextDecorator(aprons, last) {
  const playing = APRONS.map((x) => x.id).filter((id) => aprons.includes(id));
  if (playing.length === 0) return null;
  const all = APRONS.map((x) => x.id);
  if (!last || !all.includes(last)) return playing[0];
  const lastIdx = all.indexOf(last);
  for (let k = 1; k <= all.length; k++) {
    const id = all[(lastIdx + k) % all.length];
    if (playing.includes(id)) return id;
  }
  return playing[0];
}
