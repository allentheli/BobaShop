// A character on screen: a body picture with eyes and a mouth drawn on top.
// The same code will draw faces on kids' drawings in milestone 4, so the
// body is always a plain picture and the face is always drawn by the app.
//
// Expressions: waiting, happy, impatient, unsure, silly.

const EYES = {
  open: `
    <g class="eyes">
      <ellipse cx="-27" cy="-10" rx="8" ry="10" fill="#241a1a"/>
      <ellipse cx="27" cy="-10" rx="8" ry="10" fill="#241a1a"/>
      <circle cx="-24" cy="-14" r="3" fill="#fff"/>
      <circle cx="30" cy="-14" r="3" fill="#fff"/>
    </g>`,
  happy: `
    <g class="eyes" fill="none" stroke="#241a1a" stroke-width="5" stroke-linecap="round">
      <path d="M-36 -6 Q-27 -20 -18 -6"/>
      <path d="M18 -6 Q27 -20 36 -6"/>
    </g>`,
  impatient: `
    <g class="eyes">
      <path d="M-36 -10 H-18 A9 9 0 0 1 -36 -10 Z" fill="#241a1a"/>
      <path d="M18 -10 H36 A9 9 0 0 1 18 -10 Z" fill="#241a1a"/>
      <path d="M-38 -22 L-18 -20 M38 -22 L18 -20" stroke="#241a1a" stroke-width="4" stroke-linecap="round"/>
    </g>`,
  unsure: `
    <g class="eyes">
      <ellipse cx="-27" cy="-10" rx="8" ry="10" fill="#241a1a"/>
      <ellipse cx="27" cy="-10" rx="8" ry="10" fill="#241a1a"/>
      <circle cx="-25" cy="-16" r="3" fill="#fff"/>
      <circle cx="29" cy="-16" r="3" fill="#fff"/>
      <path d="M-36 -28 Q-27 -34 -18 -28 M18 -26 Q27 -32 36 -24" fill="none" stroke="#241a1a" stroke-width="4" stroke-linecap="round"/>
    </g>`,
};

EYES.silly = `
    <g class="eyes">
      <circle cx="-27" cy="-10" r="11" fill="#fff" stroke="#241a1a" stroke-width="3"/>
      <circle cx="-23" cy="-6" r="5" fill="#241a1a"/>
      <path d="M18 -10 L36 -4 M18 -10 L36 -16" stroke="#241a1a" stroke-width="4" stroke-linecap="round"/>
    </g>`;

const MOUTH_OPEN = '<ellipse class="m-open" cx="0" cy="26" rx="9" ry="8" fill="#5b1f2a" stroke="#241a1a" stroke-width="3"/>';

const MOUTHS = {
  waiting: '<path class="m-closed" d="M-13 22 Q0 32 13 22" fill="none" stroke="#241a1a" stroke-width="4" stroke-linecap="round"/>',
  happy: '<path class="m-closed" d="M-18 18 Q0 42 18 18 Z" fill="#5b1f2a" stroke="#241a1a" stroke-width="3.5" stroke-linejoin="round"/><path class="m-closed" d="M-8 29 Q0 24 8 29 Q0 35 -8 29 Z" fill="#ff8fa3"/>',
  impatient: '<path class="m-closed" d="M-13 28 Q-6 23 0 28 Q6 33 13 28" fill="none" stroke="#241a1a" stroke-width="4" stroke-linecap="round"/>',
  silly: '<path class="m-closed" d="M-16 20 Q0 32 16 20" fill="none" stroke="#241a1a" stroke-width="4" stroke-linecap="round"/><path class="m-closed" d="M-2 26 Q6 44 14 26 Z" fill="#ff8fa3" stroke="#241a1a" stroke-width="3" stroke-linejoin="round"/>',
  unsure: '<ellipse class="m-closed" cx="3" cy="27" rx="5" ry="6" fill="#5b1f2a" stroke="#241a1a" stroke-width="3"/>',
};

const BLUSH = '<g class="blush" fill="#ff8fa3" opacity=".55"><ellipse cx="-38" cy="12" rx="9" ry="5"/><ellipse cx="38" cy="12" rx="9" ry="5"/></g>';

function faceSvg(expression) {
  const eyes = EYES[expression === 'waiting' ? 'open' : expression] || EYES.open;
  const mouth = MOUTHS[expression] || MOUTHS.waiting;
  return `<svg class="face" viewBox="-50 -50 100 100" aria-hidden="true">
    ${expression === 'happy' ? BLUSH : ''}${eyes}${mouth}${MOUTH_OPEN}</svg>`;
}

export function createCharacter(rec, { expression = 'waiting' } = {}) {
  const el = document.createElement('div');
  el.className = 'char';
  el.dataset.who = rec.id;
  el.innerHTML = `
    <div class="char-body">
      <img class="char-img" src="${rec.body}" alt="" draggable="false">
      <div class="face-slot" style="left:${rec.face.x * 100}%;top:${rec.face.y * 100}%;width:${rec.face.w * 100}%"></div>
    </div>`;
  // Blink at a random rhythm so a line of customers does not blink together.
  el.style.setProperty('--blink-delay', `${(Math.random() * 4).toFixed(2)}s`);
  setExpression(el, expression);
  return el;
}

export function setExpression(el, expression) {
  if (el.dataset.expr === expression) return;
  el.dataset.expr = expression;
  el.querySelector('.face-slot').innerHTML = faceSvg(expression);
}

export function setTalking(el, on) {
  el.classList.toggle('talking', !!on);
}

// One-shot body movement: 'hop' (happy, with stars), 'wobble' (unsure),
// 'wave' (goodbye). Restarts cleanly if called again.
export function act(el, move) {
  const body = el.querySelector('.char-body');
  body.classList.remove('hop', 'wobble', 'wave');
  void body.offsetWidth;
  body.classList.add(move);
  if (move === 'hop') sparkle(el);
  setTimeout(() => body.classList.remove(move), 1200);
}

function sparkle(el) {
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.setProperty('--dx', `${(i - 2) * 28}px`);
    s.style.setProperty('--delay', `${i * 60}ms`);
    el.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}
