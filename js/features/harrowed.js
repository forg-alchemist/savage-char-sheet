// =============================================================
//  HARROWED (Меченный) MODE
//  Single source of truth for every rule that differs from a
//  normal character. The Marshal-only button toggles state.harrowed;
//  applyHarrowed() makes the whole sheet reflect it in real time.
// =============================================================

// Изъяны, недоступные Меченному (по id, все степени)
const HARROWED_BLOCKED_HINDRANCE_IDS = new Set([
  "h003",            // Болезненность
  "h011", "h012",    // Дурная привычка
  "h063",            // Однорукий бандит
  "h064",            // Отсутствие глаза
  "h070", "h071",    // Плохое зрение
  "h078",            // Проклятье
  "h085",            // Слепота
  "h086",            // Старость
  "h099", "h100",    // Хромота
  "h103",            // Юность
]);

// Черта, которой отмечается Меченный (съедает бесплатную черту)
const HARROWED_EDGE_ID = "e116"; // Меченный

// Характер Меченного не ниже d6
const HARROWED_MIN_SPIRIT_NUM = 6;

// Изъяны Меченного — всегда вверху списка, по своему алфавиту (затем степень),
// остальные сохраняют исходный порядок каталога
function sortHarrowedHindrancesFirst(items) {
  const degreeRank = (d) => (d === "Крупный" ? 1 : 0);
  return items.slice().sort((a, b) => {
    const ah = a.harrowedOnly ? 0 : 1;
    const bh = b.harrowedOnly ? 0 : 1;
    if (ah !== bh) return ah - bh;
    if (ah === 0) {
      const byName = a.name.localeCompare(b.name, "ru");
      return byName !== 0 ? byName : degreeRank(a.degree) - degreeRank(b.degree);
    }
    return (a.__index ?? 0) - (b.__index ?? 0);
  });
}

// Черта «Меченный» (e116) — механическое воплощение метки: флаг harrowed и
// наличие черты считаются одним и тем же фактом. harrowed → черта есть (бесплатно,
// первой); не harrowed → черты нет. Удаление по id (не по _harrowedAuto), чтобы
// корректно сниматься и после импорта, где признак автодобавления теряется.
function syncHarrowedEdge() {
  if (!state.selectedEdges) state.selectedEdges = [];
  const present = state.selectedEdges.some(e => e.id === HARROWED_EDGE_ID);

  if (state.harrowed) {
    if (!present) {
      const cat = window.CATALOG_BY_ID?.edges?.[HARROWED_EDGE_ID];
      if (cat) state.selectedEdges.unshift({ ...cat, _harrowedAuto: true });
    }
  } else {
    state.selectedEdges = state.selectedEdges.filter(e => e.id !== HARROWED_EDGE_ID);
  }
}

// Характер сразу поднимается до d6 (карты позже переназначат его, не ниже d6)
function enforceHarrowedSpirit() {
  if (!state.harrowed) return;
  const cur = parseTrait(state.attributes.spirit || "d4").die;
  if (cur < HARROWED_MIN_SPIRIT_NUM) state.attributes.spirit = `d${HARROWED_MIN_SPIRIT_NUM}`;
}

// Приводит состояние Меченного к согласованному виду (вызывается при загрузке).
// Чинит рассинхрон: черта без флага, отсутствие черты при флаге, Характер < d6.
function reconcileHarrowed() {
  if (!state.selectedEdges) state.selectedEdges = [];
  const hasEdge = state.selectedEdges.some(e => e.id === HARROWED_EDGE_ID);
  // Наличие черты Меченный означает, что персонаж меченный
  if (hasEdge) state.harrowed = true;
  if (state.harrowed) {
    syncHarrowedEdge();       // гарантирует наличие черты (источник бонусов в recalculate)
    enforceHarrowedSpirit();  // Характер не ниже d6 и в состоянии, не только визуально
  }
}

// Подхватывает ручной выбор/снятие черты «Меченный» в пикере: приводит флаг
// harrowed к наличию черты прямо в текущей сессии (вызывается из recalculate).
// Лёгкая версия applyHarrowed без повторного recalculate — защищена от рекурсии.
let _harrowedSyncing = false;
function syncHarrowedFromEdges() {
  if (_harrowedSyncing) return;
  const hasEdge = (state.selectedEdges || []).some(e => e.id === HARROWED_EDGE_ID);
  if (hasEdge === !!state.harrowed) return; // уже согласовано
  _harrowedSyncing = true;
  state.harrowed = hasEdge;
  enforceHarrowedSpirit();
  updateHarrowedUI();
  renderTraitBoard();
  renderChoiceList("hindrances");
  rerenderPickerIfOpen("hindrances");
  _harrowedSyncing = false;
}

function toggleHarrowed() {
  state.harrowed = !state.harrowed;
  applyHarrowed();
}

// Применяет всё, что зависит от флага harrowed, и перерисовывает интерфейс
function applyHarrowed() {
  syncHarrowedEdge();
  enforceHarrowedSpirit();
  updateHarrowedUI();

  commitSheetUpdate({
    renderChoices: ["hindrances", "edges"],
    updateEdgeCost: true,
    rerenderPickers: ["hindrances", "edges"],
  });
}

function updateHarrowedUI() {
  document.body.classList.toggle("harrowed", !!state.harrowed);
  const btn = document.getElementById("harrowed-btn");
  if (btn) btn.classList.toggle("harrowed-btn--active", !!state.harrowed);
}

document.getElementById("harrowed-btn")?.addEventListener("click", toggleHarrowed);
