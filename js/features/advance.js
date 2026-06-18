// ── Advance Modal ─────────────────────────────────────────────────────────────

let _advCurrentIndex = null;
let _advRollbackFn   = null;
let _advRollbackSnapshot = null;
let _hindranceAdvanceContext = null;

const ADVANCE_HISTORY_LIMIT = 20;
const ADVANCE_SNAPSHOT_ARRAY_KEYS = [
  "selectedHindrances",
  "selectedEdges",
  "selectedPowers",
  "skills",
  "weapons",
  "selectedArmor",
  "gear",
  "advancesTrack",
  "advanceChoices",
  "advanceHistory",
  "wounds",
  "fatigue",
  "resolve",
];

function ensureAdvanceHistory() {
  if (!Array.isArray(state.advanceHistory)) state.advanceHistory = [];
  return state.advanceHistory;
}

function createAdvanceRollbackSnapshot() {
  const snapshot = structuredClone(state);
  delete snapshot.artData; // portrait is stored separately and should not bloat rollback history
  snapshot.advancePending = null;
  return snapshot;
}

function _advanceChoiceLabel(choice) {
  return ({
    edge: "Новая черта",
    skill1: "Навык выше или равный характеристике",
    skill2: "Два навыка ниже характеристики",
    attribute: "Характеристика",
    hindrance: "Уменьшение / удаление изъяна",
  })[choice] || "Повышение";
}

function _recordAdvanceHistory(context, choice) {
  if (!context?.snapshot) return null;
  const history = ensureAdvanceHistory();
  const entry = {
    id: `adv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    choice,
    label: _advanceChoiceLabel(choice),
    index: context.index,
    snapshot: context.snapshot,
  };
  history.push(entry);
  while (history.length > ADVANCE_HISTORY_LIMIT) history.shift();
  context.historyId = entry.id;
  updateAdvanceRollbackButton();
  return entry;
}

function _discardAdvanceHistoryEntry(context) {
  if (!context?.historyId || !Array.isArray(state.advanceHistory)) return;
  state.advanceHistory = state.advanceHistory.filter(entry => entry.id !== context.historyId);
  updateAdvanceRollbackButton();
}

function _runIfFunction(name, ...args) {
  const fn = window[name] || globalThis[name];
  if (typeof fn === "function") fn(...args);
}

function _restoreAdvanceSnapshot(snapshot) {
  const currentArt = state.artData || "";
  const keepMarshalMode = !!state.marshalMode;
  const keepMarshalEditTime = state.marshalEditTime;
  const snapshotCopy = structuredClone(snapshot || {});

  state = mergeState(DEFAULT_STATE, snapshotCopy);
  for (const key of ADVANCE_SNAPSHOT_ARRAY_KEYS) {
    if (Array.isArray(snapshotCopy[key])) state[key] = structuredClone(snapshotCopy[key]);
  }
  state.artData = currentArt;
  state.marshalMode = keepMarshalMode;
  state.marshalEditTime = keepMarshalEditTime;
  state.advancePending = null;

  if (!state.skills || state.skills.length === 0) state.skills = makeDefaultSkills();
  ensureTraitModel();
  _runIfFunction("removeUnsupportedSkills");
  _runIfFunction("migrateWeapons");
  _runIfFunction("pruneNonCharacterArmor");
  _runIfFunction("reconcileSkillStartSpend");
  _runIfFunction("reconcileHarrowed");
  _runIfFunction("syncSubPowers");
  _runIfFunction("syncArcaneFreePoers");

  commitSheetUpdate({
    hydrate: true,
    renderGear: true,
    renderTracks: true,
    renderCatalogPickers: true,
    renderChoices: ["hindrances", "edges", "powers", "weapons", "armor"],
    renderArt: true,
    renderMount: true,
    updateSkillBuy: true,
    updateRank: true,
    updateDeal: true,
    updateJoker: true,
    updateMarshal: true,
    updateHarrowed: true,
    updateLocks: ["hindrances", "edges", "powers"],
  });
}

function rollbackLastAdvance() {
  if (!state.marshalMode) return;
  const history = ensureAdvanceHistory();
  const entry = history[history.length - 1];
  if (!entry?.snapshot) {
    _refundAdvancePoint(_lastRefundableAdvancePoint());
    return;
  }

  showConfirm(
    `Откатить последнее повышение: ${entry.label || "Повышение"}? Карта вернётся в состояние до него.`,
    () => {
      _restoreAdvanceSnapshot(entry.snapshot);
      showToast("Повышение откачено");
    }
  );
}

function _lastRefundableAdvancePoint() {
  const track = Array.isArray(state.advancesTrack) ? state.advancesTrack : [];
  for (let i = track.length - 1; i >= 0; i--) {
    if (track[i]) return { kind: "track", index: i };
  }

  const choices = Array.isArray(state.advanceChoices) ? state.advanceChoices : [];
  for (let i = choices.length - 1; i >= 0; i--) {
    if (choices[i]) return { kind: "choice", index: i };
  }
  return null;
}

function hasRefundableAdvancePoint() {
  return Boolean(_lastRefundableAdvancePoint());
}

function _rollbackManualHindranceProgress() {
  const hindrances = Array.isArray(state.selectedHindrances) ? state.selectedHindrances : [];
  for (let i = hindrances.length - 1; i >= 0; i--) {
    const h = hindrances[i];
    if ((h?._reduceProgress || 0) > 0) {
      delete h._reduceProgress;
      return true;
    }
  }
  return false;
}

function _refundAdvancePoint(point) {
  if (!state.marshalMode) return;
  if (!point) {
    showToast("Нет повышений, которые можно вернуть вручную");
    return;
  }

  showConfirm(
    "Вернуть очко повышения? Маршал должен заранее вручную снять с персонажа навык, характеристику или другой эффект этого повышения. Текущая стоимость навыков будет пересчитана.",
    () => {
      const choice = Array.isArray(state.advanceChoices)
        ? state.advanceChoices[point.index]
        : null;
      if (choice === "hindrance") _rollbackManualHindranceProgress();

      if (point.kind === "track") {
        state.advancesTrack[point.index] = false;
        if (Array.isArray(state.advanceChoices) && point.index < state.advanceChoices.length) {
          state.advanceChoices[point.index] = null;
        }
      } else if (Array.isArray(state.advanceChoices)) {
        state.advanceChoices.splice(point.index, 1);
      }

      if (Array.isArray(state.advanceHistory) && state.advanceHistory.length > 0) {
        state.advanceHistory.pop();
      }

      state.advancePending = null;
      cementSkillStartSpend({ refresh: true });
      commitSheetUpdate({
        renderTracks: true,
        renderTraits: true,
        renderCatalogPickers: true,
        updateMarshal: true,
      });
      showToast("Очко повышения возвращено");
    }
  );
}

function refundLastAdvancePoint() {
  _refundAdvancePoint(_lastRefundableAdvancePoint());
}

function refundAdvancePointAt(index) {
  _refundAdvancePoint({ kind: "track", index });
}

function openSkillBudgetEditModal() {
  if (!state.marshalMode) return;
  document.querySelector(".skillbudget-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "addcash-modal skillbudget-modal";
  const close = () => modal.remove();

  const backdrop = document.createElement("div");
  backdrop.className = "addcash-backdrop";
  backdrop.addEventListener("click", close);

  const dialog = document.createElement("div");
  dialog.className = "addcash-dialog paper";
  dialog.innerHTML = `
    <div class="addcash-header">
      <div class="addcash-eyebrow">Маршал</div>
      <h3 class="addcash-title">Навыки</h3>
      <button type="button" class="addcash-close">×</button>
    </div>
    <div class="addcash-fields skillbudget-fields">
      <label class="skillbudget-field">
        <span>Максимум очков навыков</span>
        <input type="number" min="0" step="1" class="skillbudget-input">
      </label>
    </div>
    <div class="addcash-actions skillbudget-actions">
      <button type="button" class="addcash-submit addcash-submit--add">Сохранить</button>
    </div>`;

  const input = dialog.querySelector(".skillbudget-input");
  input.value = String(state.skillBudgetMax ?? 12);

  const save = () => {
    const value = parseInt(input.value, 10);
    if (!Number.isFinite(value) || value < 0) {
      showToast("Введите число 0 или больше");
      return;
    }
    state.skillBudgetMax = value;
    close();
    commitSheetUpdate({ renderTraits: true, updateSkillBuy: true, updateMarshal: true });
    showToast("Максимум навыков обновлён");
  };

  dialog.querySelector(".addcash-close").addEventListener("click", close);
  dialog.querySelector(".addcash-submit--add").addEventListener("click", save);
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") close();
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
  setTimeout(() => input.focus(), 0);
}

function updateAdvanceRollbackButton() {
  const rollbackBtn = document.querySelector('[data-action="rollbackAdvance"]');
  if (rollbackBtn) {
    const history = Array.isArray(state.advanceHistory) ? state.advanceHistory : [];
    const entry = history[history.length - 1];
    const hasSnapshot = Boolean(entry?.snapshot);
    rollbackBtn.hidden = !(state.marshalMode && (hasSnapshot || hasRefundableAdvancePoint()));
    rollbackBtn.title = hasSnapshot
      ? `Откатить: ${entry.label || "Повышение"}`
      : "Старый лист без снимка: вручную убрать последнее очко повышения";
  }

  const skillBudgetBtn = document.querySelector('[data-action="editSkillBudget"]');
  if (skillBudgetBtn) skillBudgetBtn.hidden = !state.marshalMode;
}

function openAdvanceModal(index, rollbackFn, rollbackSnapshot) {
  _advRollbackFn = rollbackFn || null;
  _advRollbackSnapshot = rollbackSnapshot || null;
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
  // Прячем модалку по окончании анимации. Fallback-таймаут обязателен: если
  // transitionend не сработает (прерванный переход, reduced-motion, фон-вкладка),
  // без него #advance-modal остаётся видимым и его backdrop блокирует экран.
  let done = false;
  const hide = () => { if (done) return; done = true; modal.hidden = true; };
  dialog.addEventListener('transitionend', hide, { once: true });
  setTimeout(hide, 300);
  _advCurrentIndex = null;
  _advRollbackFn   = null;
  _advRollbackSnapshot = null;
}

function _advConfirm() {
  const modal    = document.getElementById('advance-modal');
  const selected = modal.querySelector('.adv-opt.selected');
  if (!selected) return;
  cementSkillStartSpend({ refresh: !isSkillCostCemented() });
  const context = {
    index: typeof _advCurrentIndex === 'number' ? _advCurrentIndex : null,
    rollbackFn: _advRollbackFn,
    snapshot: _advRollbackSnapshot,
  };

  if (!Array.isArray(state.advanceChoices)) state.advanceChoices = [];
  if (typeof _advCurrentIndex === 'number') {
    while (state.advanceChoices.length <= _advCurrentIndex) state.advanceChoices.push(null);
    state.advanceChoices[_advCurrentIndex] = selected.dataset.choice;
  } else {
    state.advanceChoices.unshift(selected.dataset.choice);
  }

  const choice = selected.dataset.choice;
  _recordAdvanceHistory(context, choice);
  _advClose();

  if (choice === 'edge') {
    state.advancePending = { type: 'edge' };
    commitSheetUpdate({ recalc: false });
    openPickerModal('edges');
  } else if (choice === 'skill1') {
    state.advancePending = { type: 'skill1', count: 1 };
    commitSheetUpdate({ recalc: false, renderTraits: true });
  } else if (choice === 'skill2') {
    state.advancePending = { type: 'skill2', count: 2 };
    commitSheetUpdate({ recalc: false, renderTraits: true });
  } else if (choice === 'attribute') {
    state.advancePending = { type: 'attribute', count: 1 };
    commitSheetUpdate({ recalc: false, renderTraits: true });
  } else if (choice === 'hindrance') {
    state.advancePending = { type: 'hindrance' };
    _hindranceAdvanceContext = context;
    commitSheetUpdate({ recalc: false });
    updateHindranceAdvanceBtn();
    openHindranceEditPicker();
  }
}

function _advCancel() {
  if (typeof _advCurrentIndex === 'number') {
    state.advancesTrack[_advCurrentIndex] = false;
    commitSheetUpdate({ recalc: false, renderTracks: true });
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
  _discardAdvanceHistoryEntry(context);

  if (context?.rollbackFn) {
    context.rollbackFn();
  } else if (typeof context?.index === 'number') {
    state.advancesTrack[context.index] = false;
    if (Array.isArray(state.advanceChoices)) state.advanceChoices[context.index] = null;
    commitSheetUpdate({ renderTracks: true });
  } else {
    commitSheetUpdate({ recalc: false });
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
      prog.className = 'hindrance-progress-inline-badge';
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
    commitSheetUpdate({ renderChoices: "hindrances" });
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

// Restore hindrance advance button label from saved state. app.js загружается
// последним (см. #7), поэтому advance.js исполняется ДО init() — на момент
// исполнения тела файла `state` ещё не инициализирован. Откладываем до 'load',
// когда init() уже отработал; раньше прямой вызов кидал "state is not defined"
// и срывал привязку обработчика модалки выше.
window.addEventListener('load', updateHindranceAdvanceBtn);
