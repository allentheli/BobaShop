// The pause button and its menu.

import { h, onTap } from './ui.js';
import { t } from './text.js';
import { stopSpeaking } from './audio.js';

// Adds a pause button to `host`.
//   onPause()/onResume()  freeze and unfreeze the game
//   options: { onHome, onEndShift, onSettings, getSoundOn, onToggleSound }
export function addPauseButton(host, { onPause = () => {}, onResume = () => {}, onHome, onEndShift = null, onSettings, getSoundOn, onToggleSound }) {
  const btn = h('button', { class: 'btn pause-btn', 'aria-label': t('ui.pause') }, h('span', { class: 'pause-bars' }));
  host.appendChild(btn);
  let menu = null;

  function open() {
    if (menu) return;
    onPause();
    stopSpeaking();
    const resume = h('button', { class: 'btn big pause-resume' }, h('span', { class: 'play-tri' }), h('span', { class: 'label' }, t('ui.resume')));
    const home = h('button', { class: 'btn pause-opt' }, h('span', { class: 'opt-icon house' }), h('span', {}, t('ui.home')));
    const sound = h('button', { class: 'btn pause-opt' }, h('span', { class: 'opt-icon speaker-icon' }), h('span', { class: 'sound-label' }));
    const settings = h('button', { class: 'btn pause-opt' }, h('span', { class: 'opt-icon gear' }), h('span', {}, t('ui.settings')));
    const end = onEndShift ? h('button', { class: 'btn pause-opt' }, h('span', { class: 'opt-icon moon-small' }), h('span', { class: 'end-label' }, t('ui.endShift'))) : null;
    const drawSound = () => { sound.querySelector('.sound-label').textContent = getSoundOn() ? t('ui.soundOn') : t('ui.soundOff'); sound.classList.toggle('off', !getSoundOn()); };
    drawSound();
    menu = h('div', { class: 'pause-menu' },
      h('div', { class: 'pause-card' },
        h('div', { class: 'pause-title' }, t('ui.paused')),
        resume,
        h('div', { class: 'pause-grid' }, home, sound, settings, end)));
    host.appendChild(menu);
    onTap(resume, close);
    onTap(home, () => { remove(); onHome(); });
    onTap(sound, () => { onToggleSound(); drawSound(); });
    onTap(settings, () => onSettings(menu));
    if (end) {
      // A second tap is needed, so the shift is not ended by accident.
      let armed = false;
      onTap(end, () => {
        if (!armed) {
          armed = true;
          end.classList.add('armed');
          end.querySelector('.end-label').textContent = t('ui.endShiftSure');
          setTimeout(() => { armed = false; end.classList.remove('armed'); end.querySelector('.end-label').textContent = t('ui.endShift'); }, 3000);
          return;
        }
        remove();
        onEndShift();
      });
    }
  }

  function remove() { if (menu) { menu.remove(); menu = null; } }
  function close() { remove(); onResume(); }

  onTap(btn, open);
  return { open, close, button: btn };
}

// A "Skip" button that jumps ahead, for example straight to the shop.
export function addSkipButton(host, onSkip) {
  const btn = h('button', { class: 'btn skip-btn', 'aria-label': t('ui.skip') }, h('span', { class: 'skip-arrows' }), h('span', { class: 'skip-label' }, t('ui.skip')));
  host.appendChild(btn);
  onTap(btn, () => { stopSpeaking(); onSkip(); });
  return btn;
}
