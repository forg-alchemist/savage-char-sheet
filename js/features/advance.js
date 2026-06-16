// ── Advance Modal ─────────────────────────────────────────────────────────────

let _advCurrentIndex = null;
let _advRollbackFn   = null;
let _hindranceAdvanceContext = null;

function openAdvanceModal(index, rollbackFn) {
  _advRollbackFn = rollbackFn || null;
  _advCurrentIndex = index;

  const modal  = document.getElementById('advance-modal');
  const dialog = modal.querySelector('.adv-dialog');

  const choices       = state.advanceChoices || [];
  const usedAttribute = choices.some(c => c === 'attribute');
  const usedHindrance = choices.some(c => c === 'hindrance');

  const attrBtn  = modal.querySelector('[data-choice="attribute"]');
  const hindrBtn = modal.querySelector('[data-choice="hindrance"]');

  attrBtn.disabled  = usedAttribute;
  hindrBtn.disabled = usedHindrance;

  attrBtn.querySelector('.adv-opt-badge').textContent  = usedAttribute  ? 'Уже использовано' : '1 раз за ранг';
  hindrBtn.querySelector('.adv-opt-badge').textContent = usedHindrance ? 'Уже использовано' : '1 раз за ранг';

  modal.querySelectorAll('.adv-opt').forEach(b => b.classList.remove('selected'));
  modal.querySelector('.adv-confirm-btn').disabled = true;

  modal.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dialog.classList.add('open');
  }));
}

function _advClose() {
  const modal  = document.getElementById('advance-modal');
  const dialog = modal.querySelector('.adv-dialog');
  dialog.classList.remove('open');
  dialog.addEventListener('transitionend', () => { modal.hidden = true; }, { once: true });
  _advCurrentIndex = null;
  _advRollbackFn   = null;
}

function _advConfirm() {
  const modal    = document.getElementById('advance-modal');
  const selected = modal.querySelector('.adv-opt.selected');
  if (!selected) return;
  const context = {
    index: typeof _advCurrentIndex === 'number' ? _advCurrentIndex : null,
    rollbackFn: _advRollbackFn,
  };

  if (!Array.isArray(state.advanceChoices)) state.advanceChoices = [];
  if (typeof _advCurrentIndex === 'number') {
    while (state.advanceChoices.length <= _advCurrentIndex) state.advanceChoices.push(null);
    state.advanceChoices[_advCurrentIndex] = selected.dataset.choice;
  } else {
    state.advanceChoices.unshift(selected.dataset.choice);
  }

  const choice = selected.dataset.choice;
  _advClose();

  if (choice === 'edge') {
    state.advancePending = { type: 'edge' };
    scheduleSave();
    openPickerModal('edges');
  } else if (choice === 'skill1') {
    state.advancePending = { type: 'skill1', count: 1 };
    scheduleSave();
    renderTraitBoard();
  } else if (choice === 'skill2') {
    state.advancePending = { type: 'skill2', count: 2 };
    scheduleSave();
    renderTraitBoard();
  } else if (choice === 'attribute') {
    state.advancePending = { type: 'attribute', count: 1 };
    scheduleSave();
    renderTraitBoard();
  } else if (choice === 'hindrance') {
    state.advancePending = { type: 'hindrance' };
    _hindranceAdvanceContext = context;
    scheduleSave();
    updateHindranceAdvanceBtn();
    openHindranceEditPicker();
  }
}

function _advCancel() {
  if (typeof _advCurrentIndex === 'number') {
    state.advancesTrack[_advCurrentIndex] = false;
    renderTracks();
    scheduleSave();
  } else if (_advRollbackFn) {
    _advRollbackFn();
  }
  _advClose();
}

// ── Hindrance reduction picker ─────────────────────────────────────────────

function _cancelHindranceAdvance() {
  if (state.advancePending?.type === 'hindrance') {
    state.advancePending = null;
  }

  const context = _hindranceAdvanceContext;
  _hindranceAdvanceContext = null;

  if (context?.rollbackFn) {
    context.rollbackFn();
  } else if (typeof context?.index === 'number') {
    state.advancesTrack[context.index] = false;
    if (Array.isArray(state.advanceChoices)) state.advanceChoices[context.index] = null;
    renderTracks();
    recalculate();
    scheduleSave();
  } else {
    scheduleSave();
  }

  updateHindranceAdvanceBtn();
}

function openHindranceEditPicker() {
  const existing = document.getElementById('hindrance-edit-overlay');
  if (existing) existing.remove();

  if (!state.selectedHindrances || state.selectedHindrances.length === 0) {
    showToast('Нет изъянов для изменения');
    _cancelHindranceAdvance();
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'hindrance-edit-overlay';
  overlay.className = 'hindrance-edit-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'hindrance-edit-dialog paper';

  const header = document.createElement('div');
  header.className = 'picker-header';
  const title = document.createElement('h3');
  title.className = 'picker-title';
  title.textContent = 'ИЗМЕНИТЬ ИЗЪЯН';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'picker-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    _cancelHindranceAdvance();
  });
  header.append(title, closeBtn);

  const list = document.createElement('div');
  list.className = 'picker-list';

  let stagedIndex = null;
  let confirmBtn;

  state.selectedHindrances.forEach((h, i) => {
    if (h._auto) return;
    const row = document.createElement('div');
    row.className = 'picker-item picker-item--hindrance-edit';

    const info = document.createElement('div');
    const nameRow = document.createElement('div');
    nameRow.className = 'hindrance-name-row';
    const nameEl = document.createElement('div');
    nameEl.className = 'picker-item-name';
    nameEl.textContent = h.name;
    const degreeBadge = document.createElement('span');
    degreeBadge.className = 'degree-badge ' + (h.degree === 'Крупный' ? 'major' : 'minor');
    degreeBadge.textContent = h.degree;
    nameRow.append(nameEl, degreeBadge);
    if (h._reduceProgress) {
      const prog = document.createElement('span');
      prog.className = 'hindrance-progress-badge';
      prog.textContent = `${h._reduceProgress}/2`;
      nameRow.append(prog);
    }
    info.append(nameRow);

    let actionLabel;
    if (h.degree === 'Мелкий') {
      actionLabel = '↓ Убрать изъян';
    } else {
      // Find the minor version by hindrance name (Мелкий and Крупный share the same base name).
      // If h has an id, find the Мелкий entry with the same name via HINDRANCE_IDS_BY_NAME.
      const minorIds = h.id ? (window.HINDRANCE_IDS_BY_NAME?.[h.name.toLowerCase()] || [])
        .map(id => window.CATALOG_BY_ID?.hindrances?.[id])
        .filter(c => c && c.degree === 'Мелкий') : [];
      const hasMinor = minorIds.length > 0
        || (CATALOGS.hindrances || []).some(c => c.name === h.name && c.degree === 'Мелкий');
      if (hasMinor) {
        actionLabel = '↓ Сделать мелким';
      } else {
        actionLabel = (h._reduceProgress || 0) >= 1 ? '↓ Убрать изъян (2/2)' : '↓ Снизить (1/2)';
      }
    }

    const reduceBtn = document.createElement('button');
    reduceBtn.type = 'button';
    reduceBtn.className = 'hindrance-reduce-btn';
    reduceBtn.textContent = actionLabel;
    reduceBtn.addEventListener('click', () => {
      list.querySelectorAll('.picker-item--staged').forEach(el => el.classList.remove('picker-item--staged'));
      stagedIndex = i;
      row.classList.add('picker-item--staged');
      if (confirmBtn) confirmBtn.disabled = false;
    });

    row.append(info, reduceBtn);
    list.append(row);
  });

  const footer = document.createElement('div');
  footer.className = 'picker-footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'confirm-no-btn';
  cancelBtn.textContent = '↺ Вернуться';
  cancelBtn.style.padding = '7px 16px';
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
    _cancelHindranceAdvance();
  });

  confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'picker-finish-btn';
  confirmBtn.textContent = 'Подтвердить';
  confirmBtn.disabled = true;
  confirmBtn.addEventListener('click', () => {
    if (stagedIndex === null) return;
    const h = state.selectedHindrances[stagedIndex];

    if (h.degree === 'Мелкий') {
      state.selectedHindrances.splice(stagedIndex, 1);
    } else {
      const minorVersion = (window.HINDRANCE_IDS_BY_NAME?.[h.name.toLowerCase()] || [])
        .map(id => window.CATALOG_BY_ID?.hindrances?.[id])
        .find(c => c && c.degree === 'Мелкий')
        || (CATALOGS.hindrances || []).find(c => c.name === h.name && c.degree === 'Мелкий');
      if (minorVersion) {
        state.selectedHindrances[stagedIndex] = { ...minorVersion };
      } else if ((h._reduceProgress || 0) >= 1) {
        state.selectedHindrances.splice(stagedIndex, 1);
      } else {
        h._reduceProgress = 1;
      }
    }

    state.advancePending = null;
    _hindranceAdvanceContext = null;
    renderChoiceList('hindrances');
    recalculate();
    scheduleSave();
    updateHindranceAdvanceBtn();
    overlay.remove();
  });

  footer.append(cancelBtn, confirmBtn);
  dialog.append(header, list, footer);
  overlay.append(dialog);
  document.body.append(overlay);
}

function updateHindranceAdvanceBtn() {
  const btn = document.querySelector('[data-action="openPicker"][data-type="hindrances"]');
  if (!btn) return;
  const ap = state.advancePending;
  if (ap && ap.type === 'hindrance') {
    btn.textContent = '↓ Изменить';
    btn.classList.add('hindrance-advance-btn');
  } else {
    btn.textContent = '+ Добавить';
    btn.classList.remove('hindrance-advance-btn');
  }
}

// Restore hindrance advance button on page load (advance.js loads after init())
updateHindranceAdvanceBtn();

document.getElementById('advance-modal').addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'advConfirm') { _advConfirm(); return; }
  if (action === 'advCancel')  { _advCancel();  return; }

  const opt = e.target.closest('.adv-opt');
  if (opt && !opt.disabled) {
    document.querySelectorAll('#advance-modal .adv-opt').forEach(b => b.classList.remove('selected'));
    opt.classList.add('selected');
    document.querySelector('#advance-modal .adv-confirm-btn').disabled = false;
  }
});
