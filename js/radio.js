// The shop radio: a big picture button for each song. Tapping one plays it
// straight away, so kids choose by listening, not reading.

import { SONGS, playMusic, stopMusic, currentSong } from './music.js';
import { h, icon, onTap } from './ui.js';
import { t } from './text.js';

// host: where the picker opens. current: the chosen song id (or 'off').
// onPick(id) when a song is chosen; onClose() when the picker closes.
export function openRadio(host, { current, onPick, onClose = () => {} }) {
  const pickBtn = (id, iconKey) => {
    const b = h('button', { class: `btn song-btn ${id === current ? 'chosen' : ''}`, 'data-song': id }, icon(iconKey, 'song-icon'), h('span', { class: 'song-name' }, t(`songs.${id}`)));
    onTap(b, () => {
      current = id;
      [...grid.children].forEach((x) => x.classList.toggle('chosen', x === b));
      if (id === 'off') stopMusic(); else playMusic(id);
      onPick(id);
    }, { sound: null });
    return b;
  };
  const grid = h('div', { class: 'song-grid' },
    ...SONGS.map((s) => pickBtn(s.id, s.icon)),
    pickBtn('off', 'music.off'));
  const done = h('button', { class: 'btn round radio-done', 'aria-label': t('ui.done') }, icon('check'));
  const panel = h('div', { class: 'radio-panel' },
    h('div', { class: 'radio-card' }, icon('radio', 'radio-big'), grid, done));
  host.appendChild(panel);
  onTap(done, () => { panel.remove(); onClose(currentSong()); });
  return panel;
}
