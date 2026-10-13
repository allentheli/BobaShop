// The backup panel (from Parent settings): save the shop as a file or a
// text code, and load one back. Loading always asks first.

import { backupText, backupCode, backupFileName, readBackup, backupSummary } from './backup.js';
import { h, onTap } from './ui.js';

// getSave(): the current save. onRestore(save): replace the shop with a
// loaded backup.
export function openBackup(host, { getSave, onRestore }) {
  const body = h('div', { class: 'backup-body' });
  const close = h('button', { class: 'btn settings-close' }, 'Close');
  const panel = h('div', { class: 'parent-panel backup-panel' },
    h('div', { class: 'settings-card backup-card' },
      h('div', { class: 'settings-head' }, h('h2', {}, 'Backup'), close),
      body));
  host.appendChild(panel);
  onTap(close, () => panel.remove());

  const msg = h('p', { class: 'backup-msg' });
  const say = (text, good = true) => { msg.textContent = text; msg.className = `backup-msg ${good ? 'good' : 'bad'}`; };

  function main() {
    const saveFile = h('button', { class: 'btn choice wide' }, 'Save a backup file');
    const copyCode = h('button', { class: 'btn choice wide' }, 'Copy as a text code');
    const loadFile = h('button', { class: 'btn choice wide' }, 'Load a backup file');
    const pasteCode = h('button', { class: 'btn choice wide' }, 'Paste a text code');
    const fileInput = h('input', { type: 'file', accept: '.json,application/json,text/plain', class: 'hidden' });
    body.replaceChildren(
      h('p', { class: 'settings-note' }, 'A backup keeps everything: settings, the savings jar, stars, history, decorations and the day in progress. Save it to Files or iCloud Drive, or send it to yourself. Load it on this or another iPad to bring the shop back. The app never sends it anywhere by itself.'),
      h('div', { class: 'backup-row' }, saveFile, copyCode),
      h('div', { class: 'backup-row' }, loadFile, pasteCode),
      fileInput, msg);

    onTap(saveFile, async () => {
      const name = backupFileName();
      const text = backupText(getSave());
      try {
        const file = new File([text], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Boba Shop backup' });
          say('Backup ready. Keep it somewhere safe, like Files or iCloud Drive.');
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      // Without the share sheet (for example on a computer): download it.
      const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      say(`Saved as ${name}.`);
    });

    onTap(copyCode, async () => {
      const code = backupCode(getSave());
      try {
        await navigator.clipboard.writeText(code);
        say('Copied! Paste it into a note or a message to keep it.');
      } catch (e) {
        showCode(code);
      }
    });

    onTap(loadFile, () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      check(await f.text());
      fileInput.value = '';
    });

    onTap(pasteCode, () => {
      const area = h('textarea', { class: 'backup-text scroll', placeholder: 'Paste the backup code or file text here' });
      const go = h('button', { class: 'btn choice' }, 'Load this');
      const back = h('button', { class: 'btn choice' }, 'Back');
      body.replaceChildren(area, h('div', { class: 'backup-row' }, back, go), msg);
      say('');
      onTap(go, () => check(area.value));
      onTap(back, main);
      area.focus();
    });
  }

  // Shows the code to copy by hand when copying is not allowed.
  function showCode(code) {
    const area = h('textarea', { class: 'backup-text scroll', readonly: true }, code);
    const back = h('button', { class: 'btn choice' }, 'Back');
    body.replaceChildren(h('p', { class: 'settings-note' }, 'Select all of this code and copy it:'), area, h('div', { class: 'backup-row' }, back));
    onTap(back, main);
    area.focus();
    area.select();
  }

  // Checks a backup and asks before replacing the shop.
  function check(text) {
    const r = readBackup(text);
    if (!r.ok) {
      say(r.why === 'notBackup' ? 'That is not a Boba Shop backup.' : 'That backup could not be read. Is it the whole file or code?', false);
      return;
    }
    const s = backupSummary(r.save);
    const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : 'an unknown date';
    const replace = h('button', { class: 'btn danger wide' }, 'Replace my shop with this backup');
    const cancel = h('button', { class: 'btn choice' }, 'Cancel');
    body.replaceChildren(
      h('h3', {}, 'Load this backup?'),
      h('ul', { class: 'backup-summary' },
        h('li', {}, `Saved on ${when}`),
        h('li', {}, `${s.days} days played, ${s.stars} stars`),
        h('li', {}, `${s.savings} coins in the savings jar`),
        h('li', {}, `${s.decorations} decorations`),
        s.dayInProgress ? h('li', {}, 'A day in progress (Continue picks it up)') : null),
      h('p', { class: 'settings-note' }, 'This replaces everything in the shop on this iPad now. You may want to save a backup of this iPad first.'),
      h('div', { class: 'backup-row' }, cancel, replace));
    onTap(cancel, main);
    let armed = false;
    onTap(replace, () => {
      if (!armed) { armed = true; replace.textContent = 'Tap again to replace'; replace.classList.add('armed'); return; }
      panel.remove();
      onRestore(r.save);
    });
  }

  main();
}
