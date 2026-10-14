// The backup panel (from Parent settings): save the shop as a file or a
// text code, and load one back. Loading always asks first.

import { backupText, backupCode, backupFileName, readBackup, backupSummary } from './backup.js';
import { h, onTap } from './ui.js';
import { t } from './text.js';

// getSave(): the current save. onRestore(save): replace the shop with a
// loaded backup.
export function openBackup(host, { getSave, onRestore }) {
  const body = h('div', { class: 'backup-body' });
  const close = h('button', { class: 'btn settings-close' }, t('backupUi.close'));
  const panel = h('div', { class: 'parent-panel backup-panel' },
    h('div', { class: 'settings-card backup-card' },
      h('div', { class: 'settings-head' }, h('h2', {}, t('backupUi.title')), close),
      body));
  host.appendChild(panel);
  onTap(close, () => panel.remove());

  const msg = h('p', { class: 'backup-msg' });
  const say = (text, good = true) => { msg.textContent = text; msg.className = `backup-msg ${good ? 'good' : 'bad'}`; };

  function main() {
    const saveFile = h('button', { class: 'btn choice wide' }, t('backupUi.saveFile'));
    const copyCode = h('button', { class: 'btn choice wide' }, t('backupUi.copyCode'));
    const loadFile = h('button', { class: 'btn choice wide' }, t('backupUi.loadFile'));
    const pasteCode = h('button', { class: 'btn choice wide' }, t('backupUi.pasteCode'));
    const fileInput = h('input', { type: 'file', accept: '.json,application/json,text/plain', class: 'hidden' });
    body.replaceChildren(
      h('p', { class: 'settings-note' }, t('backupUi.intro')),
      h('div', { class: 'backup-row' }, saveFile, copyCode),
      h('div', { class: 'backup-row' }, loadFile, pasteCode),
      fileInput, msg);

    onTap(saveFile, async () => {
      const name = backupFileName();
      const text = backupText(getSave());
      try {
        const file = new File([text], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: t('backupUi.shareTitle') });
          say(t('backupUi.ready'));
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
      say(t('backupUi.savedAs', { name }));
    });

    onTap(copyCode, async () => {
      const code = backupCode(getSave());
      try {
        await navigator.clipboard.writeText(code);
        say(t('backupUi.copied'));
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
      const area = h('textarea', { class: 'backup-text scroll', placeholder: t('backupUi.pastePlaceholder') });
      const go = h('button', { class: 'btn choice' }, t('backupUi.loadThis'));
      const back = h('button', { class: 'btn choice' }, t('backupUi.back'));
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
    const back = h('button', { class: 'btn choice' }, t('backupUi.back'));
    body.replaceChildren(h('p', { class: 'settings-note' }, t('backupUi.selectAll')), area, h('div', { class: 'backup-row' }, back));
    onTap(back, main);
    area.focus();
    area.select();
  }

  // Checks a backup and asks before replacing the shop.
  function check(text) {
    const r = readBackup(text);
    if (!r.ok) {
      const why = { notBackup: 'backupUi.notBackup', newer: 'backupUi.newer' };
      say(t(why[r.why] || 'backupUi.unreadable'), false);
      return;
    }
    const s = backupSummary(r.save);
    const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : t('backupUi.unknownDate');
    const replace = h('button', { class: 'btn danger wide' }, t('backupUi.replace'));
    const cancel = h('button', { class: 'btn choice' }, t('backupUi.cancel'));
    body.replaceChildren(
      h('h3', {}, t('backupUi.askTitle')),
      h('ul', { class: 'backup-summary' },
        h('li', {}, t('backupUi.savedOn', { when })),
        h('li', {}, t('backupUi.daysStars', { days: s.days, stars: s.stars })),
        h('li', {}, t('backupUi.jarCoins', { n: s.savings })),
        h('li', {}, t('backupUi.decorations', { n: s.decorations })),
        s.dayInProgress ? h('li', {}, t('backupUi.dayInProgress')) : null),
      h('p', { class: 'settings-note' }, t('backupUi.replaceNote')),
      h('div', { class: 'backup-row' }, cancel, replace));
    onTap(cancel, main);
    let armed = false;
    onTap(replace, () => {
      if (!armed) { armed = true; replace.textContent = t('backupUi.tapAgainReplace'); replace.classList.add('armed'); return; }
      panel.remove();
      onRestore(r.save);
    });
  }

  main();
}
