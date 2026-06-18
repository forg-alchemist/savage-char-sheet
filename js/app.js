// ── Bootstrap ────────────────────────────────────────────────────────────────
const ART_KEY = STORAGE_KEY + "-art";

let state = loadState();
// Migrate artData: old saves stored it in the main key; new saves keep it in ART_KEY only
const _legacyArt = state.artData;
try {
  const _savedArt = localStorage.getItem(ART_KEY);
  state.artData = _savedArt || _legacyArt || "";
  if (_legacyArt && !_savedArt) {
    try { localStorage.setItem(ART_KEY, _legacyArt); } catch {}
  }
} catch {}
let saveTimer;
let suppressSaveOnImport = false;

const app = document.querySelector(".sheet");
const byBind = [...document.querySelectorAll("[data-bind]")];
// ── Init ─────────────────────────────────────────────────────────────────────

// Adds catalog IDs to state items that were saved before the ID refactor.
function _migrateItemIds() {
  const CATS = window.DEADLANDS_CATALOGS;
  if (!CATS) return;

  function addIds(items, type, matchFn) {
    if (!Array.isArray(items)) return items;
    const catalog = CATS[type] || [];
    return items.map(item => {
      if (item.id) return item;
      const found = catalog.find(c => matchFn(c, item));
      return found ? { ...item, id: found.id } : item;
    });
  }

  state.selectedHindrances = addIds(state.selectedHindrances, 'hindrances',
    (c, i) => c.name === i.name && c.degree === i.degree);
  state.selectedEdges  = addIds(state.selectedEdges,  'edges',   (c, i) => c.name === i.name);
  state.selectedPowers = addIds(state.selectedPowers, 'powers',  (c, i) => c.name === i.name);
  state.weapons        = addIds(state.weapons,        'weapons',  (c, i) => c.name === i.name);
  state.selectedArmor  = addIds(state.selectedArmor,  'armor',
    (c, i) => c.name === i.name && c.category === i.category && (c.bonus ?? 0) === (i.bonus ?? 0));
  pruneNonCharacterArmor();

  // Migrate _arcaneGift from edge name to edge ID
  if (Array.isArray(state.selectedPowers)) {
    const edgeCat = CATS.edges || [];
    state.selectedPowers = state.selectedPowers.map(p => {
      if (!p._arcaneGift || typeof p._arcaneGift !== 'string') return p;
      if (window.CATALOG_BY_ID?.edges?.[p._arcaneGift]) return p; // already an ID
      const edge = edgeCat.find(e => e.name === p._arcaneGift);
      return edge?.id ? { ...p, _arcaneGift: edge.id } : p;
    });
  }
}

function init() {
  window.DEADLANDS_BOOT.assertFunctions("app init", [
    "removeUnsupportedSkills",
    "migrateWeapons",
    "ensureTraitModel",
    "migrateLegacySkillSpend",
    "reconcileHarrowed",
    "renderTraitBoard",
    "renderTracks",
    "renderCatalogPickers",
    "syncSubPowers",
    "syncArcaneFreePoers",
    "renderChoiceList",
    "recalculate",
    "updateHindranceCounter",
    "updateHindranceLock",
    "updateEdgeLock",
    "updatePowersLock",
    "updateSkillBuyBtn",
    "renderMount",
    "updateDealButton",
    "updateJokerStatus",
    "updateMarshalUI",
    "updateHarrowedUI",
    "importChar",
    "exportChar",
    "openAdvanceModal",
    "commitSheetUpdate",
  ]);
  state.marshalMode = false;
  // APP_VERSION — единый источник версии: футер и заголовок вкладки
  const versionEl = document.getElementById("app-version");
  if (versionEl) versionEl.textContent = `ВЕРСИЯ КАРТЫ: ${APP_VERSION}`;
  document.title = `Deadlands: Лист персонажа (v${APP_VERSION})`;
  setupGlobalTooltips();
  _migrateItemIds();
  removeUnsupportedSkills();
  migrateWeapons();
  ensureTraitModel();
  migrateLegacySkillSpend();
  reconcileHarrowed();
  // Трейт-борд рисуется один раз ниже — после recalculate() и сброса extraPoints,
  // чтобы сразу отразить корректные бюджет/локи (см. техдолг #9).
  renderEntries("gear");
  renderTracks();
  renderCatalogPickers();
  syncSubPowers();
  syncArcaneFreePoers();
  renderChoiceList("powers");
  renderChoiceList("armor");
  renderArt();
  bindStaticControls();
  hydrateInputs();
  recalculate();
  updateHindranceCounter();
  updateHindranceLock();
  updateEdgeLock();
  updatePowersLock();
  if (!state.hindrancesDone) state.extraPoints = 0;
  setOutput("extraPoints", state.extraPoints || 0);
  updateSkillBuyBtn();
  renderTraitBoard();
  updateRankWidget();
  renderMount();
  updateDealButton();
  updateJokerStatus();
  updateMarshalUI();
  updateHarrowedUI();
  scheduleSave();
}

function setupGlobalTooltips() {
  if (document.querySelector(".global-tooltip")) return;

  document.body.classList.add("tooltip-portal-enabled");

  const tooltip = document.createElement("div");
  tooltip.className = "global-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.append(tooltip);

  let activeTarget = null;
  let lastPoint = null;
  const margin = 12;
  const offset = 14;

  function getTooltipText(target) {
    return target?.dataset?.tooltip?.trim() || "";
  }

  function place(point = lastPoint) {
    if (!activeTarget) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const targetRect = activeTarget.getBoundingClientRect();
    const baseX = point ? point.clientX : targetRect.left + Math.min(targetRect.width / 2, 32);
    const baseY = point ? point.clientY : targetRect.bottom;
    let left = baseX + offset;
    let top = baseY + offset;

    if (left + tooltipRect.width + margin > window.innerWidth) {
      left = Math.max(margin, window.innerWidth - tooltipRect.width - margin);
    }

    if (top + tooltipRect.height + margin > window.innerHeight) {
      top = (point ? point.clientY : targetRect.top) - tooltipRect.height - offset;
    }

    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function show(target, point = null) {
    const text = getTooltipText(target);
    if (!text) return;

    activeTarget = target;
    lastPoint = point;
    tooltip.textContent = text;
    tooltip.classList.add("is-visible");
    place(point);
  }

  function hide(target = activeTarget) {
    if (target && activeTarget && target !== activeTarget) return;
    activeTarget = null;
    lastPoint = null;
    tooltip.classList.remove("is-visible");
  }

  function handleTooltipEnter(event) {
    const target = event.target.closest("[data-tooltip]");
    if (!target || !document.body.contains(target)) return;
    show(target, { clientX: event.clientX, clientY: event.clientY });
  }

  function handleTooltipMove(event) {
    if (!activeTarget) return;
    lastPoint = { clientX: event.clientX, clientY: event.clientY };
    place(lastPoint);
  }

  function handleTooltipLeave(event) {
    const target = event.target.closest("[data-tooltip]");
    if (!target || target !== activeTarget) return;
    if (event.relatedTarget && target.contains(event.relatedTarget)) return;
    hide(target);
  }

  document.addEventListener("pointerover", handleTooltipEnter);
  document.addEventListener("pointermove", handleTooltipMove);
  document.addEventListener("pointerout", handleTooltipLeave);
  document.addEventListener("mouseover", handleTooltipEnter);
  document.addEventListener("mousemove", handleTooltipMove);
  document.addEventListener("mouseout", handleTooltipLeave);

  document.addEventListener("focusin", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) show(target);
  });

  document.addEventListener("focusout", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (target) hide(target);
  });

  window.addEventListener("scroll", () => place(), true);
  window.addEventListener("resize", () => place());
}

function migrateWeapons() {
  if (Array.isArray(state.weapons) && state.weapons.length > 0 && "rof" in state.weapons[0]) {
    state.weapons = [];
  }
}

function removeUnsupportedSkills() {
  state.skills = (state.skills || []).filter((skill) => !REMOVED_DEADLANDS_SKILLS.has(normalizeName(skill.name)));
}

// Промежуточные сохранения хранили замороженную стоимость в _spent.
// Переносим её в _startSpend, чтобы заморозка не сбрасывалась при загрузке.
function migrateLegacySkillSpend() {
  const carry = (s) => { if (s && s._startSpend == null && s._spent != null) s._startSpend = s._spent; };
  (state.skills || []).forEach(carry);
  Object.values(state.customSkills || {}).forEach(slots => (slots || []).forEach(carry));
}

function ensureTraitModel() {
  for (const key of Object.keys(DEFAULT_STATE.attributes)) {
    if (!state.attributes[key] || state.attributes[key] === "-") state.attributes[key] = "d4";
  }

  const byName = new Map((state.skills || []).map((skill) => [normalizeName(skill.name), skill]));
  state.skills = makeDefaultSkills().map((defaultSkill) => {
    const saved = byName.get(normalizeName(defaultSkill.name));
    const skill = saved ? { ...defaultSkill, ...saved } : { ...defaultSkill };
    skill.starred = defaultSkill.starred || FREE_STARTING_SKILLS.has(normalizeName(skill.name));
    skill.description = defaultSkill.description || skill.description || "";
    if (skill.starred && (!skill.die || skill.die === "-")) skill.die = "d4";
    return skill;
  });
}

// ── Input binding ─────────────────────────────────────────────────────────────

function bindStaticControls() {
  byBind.forEach((element) => {
    element.addEventListener("input", () => {
      setBoundValue(element.dataset.bind, element);
      syncBoundInputs(element.dataset.bind, element);
      commitSheetUpdate();
    });
  });

  document.querySelector('[data-action="uploadArt"]').addEventListener("change", uploadArt);

  app.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === "addGear") addEntry("gear");
    if (action === "editMoney") openMoneyModal();
    if (action === "changelog") openChangelogModal();
    if (action === "openPicker") {
      const type = event.target.closest("[data-action]").dataset.type;
      if (type === "hindrances" && state.advancePending?.type === "hindrance") {
        openHindranceEditPicker();
        return;
      }
      if (type === "hindrances" && state.hindrancesDone && !state.marshalMode) return;
      if (type === "edges" && state.edgesDone && !state.marshalMode && state.advancePending?.type !== "edge") return;
      if (type === "powers" && arePowersLocked()) return;
      openPickerModal(type);
    }
    if (action === "unlockSection") {
      unlockSection(event.target.closest("[data-action]").dataset.type);
    }
    if (action === "closePicker") closePickerModal();
    if (action === "print") window.print();
    if (action === "importChar") importChar();
    if (action === "exportChar") exportChar();
    if (action === "clear") clearSheet();
    if (action === "dealCards") openDealModal();
    if (action === "toggleHorse") toggleMount();
    if (action === "openMountEquipment") openMountEquipmentModal();
    if (action === "rankUp") {
      if (state.rank < RANK_ORDER.length) {
        const prevRank          = state.rank;
        const prevAdvancesTrack = [...state.advancesTrack];
        const prevAdvanceChoices = [...(state.advanceChoices || [])];

        state.rank = state.rank + 1;
        state.advancesTrack  = [false, false, false];
        state.advanceChoices = [];
        pruneInvalidEdges();
        pruneInvalidPowers();
        syncSubPowers();
        commitSheetUpdate({ renderCatalogPickers: true, renderTracks: true });

        openAdvanceModal('rankup', () => {
          state.rank           = prevRank;
          state.advancesTrack  = prevAdvancesTrack;
          state.advanceChoices = prevAdvanceChoices;
          pruneInvalidEdges();
          pruneInvalidPowers();
          syncSubPowers();
          commitSheetUpdate({ renderCatalogPickers: true, renderTracks: true });
        });
      }
      return;
    }
    if (action === "marshalMode") toggleMarshalMode();
    if (action === "buySkillPoint") {
      state.skillBudgetMax = (state.skillBudgetMax || 12) + 1;
      state.extraPoints = Math.max(0, (state.extraPoints || 0) - 1);
      setOutput("extraPoints", state.extraPoints);
      updateSkillBuyBtn();
      commitSheetUpdate();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePickerModal();
  });

  document.getElementById("picker-modal").addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "closePicker") { closePickerModal(); return; }
    if (action === "finishHindrances") {
      showConfirm(
        "Осторожно! Подтверждение выбора закроет возможность редактировать изъяны! Вы уверены в выборе? Если нет, закройте через ✕",
        () => {
          if (state.hindrancesDone) return;
          const slepotaIds = window.WK_HINDRANCES?.SLEPOTA;
          const slepotaCount = (state.selectedHindrances || []).filter(
            h => slepotaIds?.size ? slepotaIds.has(h.id) : h.name === "Слепота"
          ).length;
          state.extraPoints = (state.extraPoints || 0) + getHindrancePoints() + slepotaCount * 2;
          state.hindrancesDone = true;
          setOutput("extraPoints", state.extraPoints);
          updateSkillBuyBtn();
          closePickerModal();
          commitSheetUpdate({
            recalc: false,
            renderTraits: true,
            renderChoices: "hindrances",
            updateLocks: "hindrances",
          });
        }
      );
      return;
    }
    if (action === "finishEdges") {
      showConfirm(
        "Осторожно! Подтверждение выбора закроет возможность редактировать черты! Вы уверены в выборе? Если нет, закройте через ✕",
        () => {
          state.edgesDone = true;
          closePickerModal();
          commitSheetUpdate({ recalc: false, renderChoices: "edges", updateLocks: "edges" });
        }
      );
      return;
    }
    if (action === "finishPowers") {
      showConfirm(
        "Осторожно! Подтверждение выбора закроет возможность редактировать силы! Вы уверены в выборе? Если нет, закройте через ✕",
        () => {
          state.powersDone = true;
          closePickerModal();
          commitSheetUpdate({ recalc: false, renderChoices: "powers", updateLocks: "powers" });
        }
      );
      return;
    }
  });
}

function hydrateInputs() {
  byBind.forEach((element) => {
    const key = element.dataset.bind;
    let val = state[key] ?? "";
    if (key === "money") val = String(val).replace(/\$/g, "").trim();
    if (key === "moneyCents") val = String(val).replace(/¢/g, "").trim();
    element.value = val;
  });
}

function setBoundValue(key, element) {
  if (element.type === "number") {
    state[key] = Number(element.value) || 0;
    if (key === "powerCurrent" && !state.marshalMode) {
      const psMax = computeMaxPS();
      if (state.powerCurrent > psMax) {
        state.powerCurrent = psMax;
        element.value = psMax;
      }
    }
  } else if (key === "money") {
    state[key] = element.value.replace(/\$/g, "").trim();
    element.value = state[key];
  } else if (key === "moneyCents") {
    state[key] = element.value.replace(/¢/g, "").trim();
    element.value = state[key];
  } else {
    state[key] = element.value;
  }
}

function syncBoundInputs(key, source) {
  byBind.forEach((element) => {
    if (element === source || element.dataset.bind !== key) return;
    element.value = state[key] ?? "";
  });
}

// ── Persistence ───────────────────────────────────────────────────────────────

function _serializeState() {
  const { artData, ...rest } = state;
  return JSON.stringify(rest);
}

function scheduleSave() {
  setOutput("saveState", "Сохраняю...");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (suppressSaveOnImport) return;
    try {
      localStorage.setItem(STORAGE_KEY, _serializeState());
      setOutput("saveState", "Сохранено");
    } catch {
      setOutput("saveState", "Ошибка сохранения");
    }
  }, 180);
}

window.addEventListener("beforeunload", () => {
  if (suppressSaveOnImport) return;
  try { localStorage.setItem(STORAGE_KEY, _serializeState()); } catch {}
});

// ── Archetype ─────────────────────────────────────────────────────────────────

const _ARCHETYPE_EDGE_MAP = {
  "Меченный":                         "Меченный",
  "Мистический дар (искусство ЦИ)":  "Просветлённый",
  "Мистический дар (чудеса)":         "Чудотворец",
  "Мистический дар (безумная наука)": "Безумный учёный",
  "Мистический дар (руны)":           "Рунный стрелок",
  "Мистический дар (вуду)":           "Вудуист",
  "Мистический дар (шаманизм)":       "Шаман",
  "Мистический дар (магия)":          "Картёжник",
  "Мастер боевых искусств":            "Мастер боевых искусств",
  "Мастер боевых искусств+":          "Мастер боевых искусств",
  "Мастер боевых искусств++":         "Мастер боевых искусств",
  "Берсерк":                          "Громила",
  "Бугай":                            "Громила",
  "Круговой удар":                    "Громила",
  "Могучий удар":                     "Громила",
  "Сила десяти тигров":               "Громила",
  "Стальная челюсть":                 "Громила",
  "Тяжеловес":                        "Громила",
  "Финт":                             "Громила",
};

function computeArchetypes() {
  const result = [];
  const seen = new Set();
  for (const edge of (state.selectedEdges || [])) {
    const arch = _ARCHETYPE_EDGE_MAP[edge.name];
    if (arch && !seen.has(arch)) { seen.add(arch); result.push(arch); }
  }
  if (seen.has("Меченный")) {
    const idx = result.indexOf("Меченный");
    if (idx > 0) { result.splice(idx, 1); result.unshift("Меченный"); }
  }
  if (seen.has("Громила") && result.length > 1) {
    const idx = result.indexOf("Громила");
    result.splice(idx, 1);
    result.push("Громила");
  }
  // «Мастер боевых искусств» — боевая под-ветка, уступает первенство любому
  // другому архетипу (в т.ч. Просветлённому): уводим в конец.
  if (seen.has("Мастер боевых искусств") && result.length > 1) {
    const idx = result.indexOf("Мастер боевых искусств");
    result.splice(idx, 1);
    result.push("Мастер боевых искусств");
  }
  return result.length > 0 ? result : ["Стрелок"];
}

function computeArchetype() {
  return computeArchetypes()[0];
}

// ── Recalculate ───────────────────────────────────────────────────────────────

// Складывает показатели брони на одной зоне по правилу ношения слоями:
// наибольший доспех считается полностью, каждый следующий — половина
// (с округлением вниз). Например, латы (4) поверх кольчуги (3) → 4 + 1 = 5.
function layeredArmorValue(bonuses) {
  if (!bonuses.length) return 0;
  const sorted = [...bonuses].sort((a, b) => b - a);
  return sorted.reduce((sum, b, i) => sum + (i === 0 ? b : Math.floor(b / 2)), 0);
}

const ARMOR_SECTORS = ["head", "torso", "arms", "legs"];
const ARMOR_SECTOR_NAMES = { head: "Голова", torso: "Торс", arms: "Руки", legs: "Ноги" };
const ARMOR_MAX_LAYERS = 2; // не более 2 слоёв брони на одну зону

// Зоны, которые закрывает доспех — из поля sectors каталога (по id),
// а не из названия. Уберут подсказки «(торс, руки)» — расчёт не сломается.
function armorSectorsOf(item) {
  const byId = window.CATALOG_BY_ID?.armor || {};
  const def = (item.id && byId[item.id]) || item;
  return def.sectors || [];
}

// Считается только НАДЕТАЯ броня (_equipped). Купленная, но не надетая — не защищает.
function computeArmorSectors() {
  const buckets = { head: [], torso: [], arms: [], legs: [] };
  for (const armor of (state.selectedArmor || [])) {
    if (!armor._equipped) continue;
    for (const sector of armorSectorsOf(armor)) {
      if (sector in buckets) buckets[sector].push(armor.bonus || 0);
    }
  }
  const out = {};
  for (const s of ARMOR_SECTORS) out[s] = layeredArmorValue(buckets[s]);
  return out;
}

// Сколько слоёв надетой брони уже на каждой зоне (можно исключить предмет по индексу)
function wornArmorLayers(exceptIndex = -1) {
  const counts = { head: 0, torso: 0, arms: 0, legs: 0 };
  (state.selectedArmor || []).forEach((armor, i) => {
    if (i === exceptIndex || !armor._equipped) return;
    for (const sector of armorSectorsOf(armor)) {
      if (sector in counts) counts[sector]++;
    }
  });
  return counts;
}

function _armorDieIdx(d) {
  const m = String(d || "").match(/d(\d+)/);
  return m ? DICE_VALUES.indexOf(parseInt(m[1])) : -1;
}

// Хватает ли силы НАДЕТЬ доспех. Учитывает Бугай (−1 ступень), Полноту (+1),
// и правило слоёв: вторая броня на зоне поднимает требование на 1 ступень,
// считая от наибольшей мин. силы среди пересекающихся надетых доспехов.
// Проверка действует при надевании, а не при покупке.
function armorEquipStrengthOk(item, index) {
  if (state.marshalMode) return true;
  const itemZones = new Set(armorSectorsOf(item));
  let reqIdx = _armorDieIdx(item.minStr);
  let layering = false;
  (state.selectedArmor || []).forEach((a, i) => {
    if (i === index || !a._equipped) return;
    if (armorSectorsOf(a).some(s => itemZones.has(s))) {
      layering = true;
      reqIdx = Math.max(reqIdx, _armorDieIdx(a.minStr));
    }
  });
  if (reqIdx < 0 && !layering) return true; // нет требования и не слой
  if (reqIdx < 0) reqIdx = 0;
  if (layering) reqIdx += 1;

  const hasBugai   = (state.selectedEdges || []).some(e => window.WK_EDGES?.BUGAI ? e.id === window.WK_EDGES.BUGAI : e.name === "Бугай");
  const hasPolnota = (state.selectedHindrances || []).some(h => window.WK_HINDRANCES?.POLNOTA?.size ? window.WK_HINDRANCES.POLNOTA.has(h.id) : h.name === "Полнота");
  if (hasBugai) reqIdx -= 1;
  if (hasPolnota) reqIdx += 1;
  reqIdx = Math.max(0, Math.min(DICE_VALUES.length - 1, reqIdx));
  return parseTrait(state.attributes?.strength || "d4").die >= DICE_VALUES[reqIdx];
}

// Надеть броню по индексу. Возвращает текст ошибки при отказе (лимит слоёв или
// нехватка силы), либо null при успехе.
function equipArmor(index) {
  const item = (state.selectedArmor || [])[index];
  if (!item) return "Ошибка";
  const layers = wornArmorLayers(index);
  // Собираем ВСЕ зоны предмета, на которых уже максимум слоёв
  const full = armorSectorsOf(item)
    .filter(s => (layers[s] || 0) >= ARMOR_MAX_LAYERS)
    .map(s => ARMOR_SECTOR_NAMES[s] || s);
  if (full.length) {
    const many = full.length > 1;
    const zones = full.map(n => `<span class="toast-zone">${n}</span>`).join(", ");
    return `${many ? "Зоны" : "Зона"}: ${zones} — ${many ? "надеты" : "надета"} полностью!`;
  }
  if (!armorEquipStrengthOk(item, index)) return "Недостаточно силы, чтобы надеть!";
  item._equipped = true;
  return null;
}

function updateArmorSectorOutputs() {
  const sectors = computeArmorSectors();
  setOutput("armorHead",  sectors.head  ? `+${sectors.head}`  : "0");
  setOutput("armorTorso", sectors.torso ? `+${sectors.torso}` : "0");
  setOutput("armorArms",  sectors.arms  ? `+${sectors.arms}`  : "0");
  setOutput("armorLegs",  sectors.legs  ? `+${sectors.legs}`  : "0");
}

function hasParryBonusSpear() {
  return (state.weapons || []).some(weapon => {
    const def = resolveCatalogItem("weapons", weapon, weapon);
    return def?.id === "w060" || def?.name === "Копьё";
  });
}

function recalculate() {
  syncHarrowedFromEdges();
  syncArchetypeHindrances();
  const fighting = getSkillDie("Драка");
  const vigor = parseTrait(state.attributes.vigor).die;
  const strength = parseTrait(state.attributes.strength).die;
  const parryBase = fighting ? Math.floor(fighting / 2) + 2 : 2;
  const parry = parryBase + (hasParryBonusSpear() ? 1 : 0);
  const WKE = window.WK_EDGES || {};
  const WKH = window.WK_HINDRANCES || {};
  const _hasEdge = (id, name) => (state.selectedEdges || []).some(e => id ? e.id === id : e.name === name);
  const _hasHind = (idSet, name) => (state.selectedHindrances || []).some(
    h => idSet?.size ? idSet.has(h.id) : h.name === name
  );
  const isHarrowed = _hasEdge(WKE.MECHENNY,  "Меченный");
  const isShort    = _hasHind(WKH.KOROTYSHKA,"Коротышка");
  const isPolnota  = _hasHind(WKH.POLNOTA,   "Полнота");
  const hasBugai   = _hasEdge(WKE.BUGAI,     "Бугай");
  const toughness = Math.floor(vigor / 2) + 2
    + (isHarrowed ? 2 : 0) - (isShort ? 1 : 0) + (isPolnota ? 1 : 0);
  const weaponWeight = (state.weapons || []).reduce((sum, w) => sum + (w._stashed ? 0 : (Number(w.weight) || 0)), 0);
  const armorWeight = (state.selectedArmor || []).reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
  const weight = state.gear.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) + weaponWeight + armorWeight;
  const strengthIdx = DICE_VALUES.indexOf(strength);
  const loadStrengthIdx = Math.max(0, Math.min(DICE_VALUES.length - 1, strengthIdx + (hasBugai ? 1 : 0)));
  const sizeLoadModifier = (isPolnota ? 1 : 0) - (isShort ? 1 : 0);
  const loadLimit = DICE_VALUES[loadStrengthIdx] * 5 * Math.pow(2, sizeLoadModifier);
  const isOverloaded = isLoadOverLimit(weight, loadLimit);

  const total = getTotalSkillSpend();
  const budget = state.skillBudgetMax ?? 12;
  const budgetEl = document.querySelector('[data-output="skillBudget"]');
  if (budgetEl) {
    budgetEl.textContent = `${total} / ${budget}`;
    budgetEl.classList.toggle("over-budget", total > budget);
    budgetEl.classList.toggle("at-budget", total === budget);
  }

  const attrPoolEl = document.querySelector('[data-output="attrPool"]');
  if (attrPoolEl) {
    if (!state.dealDone || !state.attrPoolBase) {
      attrPoolEl.textContent = '—';
    } else {
      const advAttrCount = (state.advanceChoices || []).filter(c => c === 'attribute').length;
      const poolMax = (state.attrPoolBase || 0) + advAttrCount;
      const poolCurrent = Object.values(state.attributes).reduce((sum, die) => {
        const idx = DICE_VALUES.indexOf(parseTrait(die).die);
        return sum + (idx >= 0 ? idx : 0);
      }, 0);
      attrPoolEl.textContent = `${poolCurrent} / ${poolMax}`;
    }
  }

  const archetype = computeArchetype();
  state.archetype = archetype;
  setOutput("archetype", archetype);

  const RUN_DICE = ["d2", "d4", "d6", "d8"];
  const hromoaMinor  = WKH.KHROM_MINOR
    ? (state.selectedHindrances || []).some(h => h.id === WKH.KHROM_MINOR)
    : (state.selectedHindrances || []).some(h => h.name === "Хромота" && h.degree === "Мелкий");
  const hromotaMajor = WKH.KHROM_MAJOR
    ? (state.selectedHindrances || []).some(h => h.id === WKH.KHROM_MAJOR)
    : (state.selectedHindrances || []).some(h => h.name === "Хромота" && h.degree === "Крупный");
  const hasFastfoot  = _hasEdge(WKE.FASTFOOT, "Быстроногость");
  const paceBonus   = hasFastfoot ? 1 : 0;
  const pacePenalty = (isPolnota ? 1 : 0) + (hromoaMinor ? 1 : 0) + (hromotaMajor ? 2 : 0) + (isOverloaded ? 1 : 0);
  const runPenalty  = ((isPolnota || hromoaMinor || hromotaMajor) ? 1 : 0) + (isOverloaded ? 1 : 0);
  const runBase = RUN_DICE.indexOf("d4"); // = 1
  const runDieIdx = Math.max(0, Math.min(RUN_DICE.length - 1, runBase + paceBonus - runPenalty));
  setOutput("pace", Math.max(1, 3 + paceBonus - pacePenalty));
  setOutput("runDie", RUN_DICE[runDieIdx]);

  const hasIstinnoeMushestvo = _hasEdge(WKE.MUZHESTVO, "Истинное мужество");
  const resolveNum = state.rank + (isHarrowed ? 1 : 0) + (hasIstinnoeMushestvo ? 1 : 0);
  const resolveEl = document.querySelector('[data-output="resolveValue"]');
  if (resolveEl) {
    resolveEl.innerHTML = Array.from({ length: resolveNum }, () =>
      `<img src="assets/Bravery.png" class="bravery-icon" alt="★">`
    ).join('');
  }

  let psMax = 0, silyMax = 0;
  (state.selectedEdges || []).forEach(e => {
    const stats = (e.id && window.ARCANE_GIFT_STATS_BY_ID?.[e.id]) ?? ARCANE_GIFT_STATS?.[e.name];
    if (stats) { psMax += stats.ps; silyMax += stats.sily; }
    if (e.id === WKE.PS   || e.name === "Пункты силы") psMax   += 5 * (e.count || 1);
    if (e.id === WKE.SILY || e.name === "Новые силы")  silyMax += 2 * (e.count || 1);
  });
  setOutput("powerMax", psMax);
  setOutput("silyMax", silyMax);
  setOutput("silyCurrent", (state.selectedPowers || []).filter(p => !isSubPower(p) && !p._arcaneGift).length);


  setOutput("parry", parry);
  setOutput("toughness", toughness);
  updateArmorSectorOutputs();
  renderLoadMeter(document.querySelector('[data-output="weightTotal"]'), weight, loadLimit);

  renderChoiceList("weapons");
  renderChoiceList("armor");
  updateArchetypePanels();
  updateRankWidget();
  syncMoneyGrants();
  renderTraitBoard();
  renderMount();
  updatePowersLock();
}

// ── Money grants ──────────────────────────────────────────────────────────────

function syncMoneyGrants() {
  if (!state.moneyGrants) state.moneyGrants = {};
  const grants = [
    { key: "deal",       amount: 250, active: !!state.dealDone },
    { key: "богатство",  amount: 250, active: (state.selectedEdges || []).some(e => window.WK_EDGES?.BOGATSTVO   ? e.id === window.WK_EDGES.BOGATSTVO   : e.name === "Богатство") },
    { key: "богатство+", amount: 250, active: (state.selectedEdges || []).some(e => window.WK_EDGES?.BOGATSTVO_P ? e.id === window.WK_EDGES.BOGATSTVO_P : e.name === "Богатство+") },
  ];
  let delta = 0;
  for (const g of grants) {
    const was = !!state.moneyGrants[g.key];
    if (g.active && !was)  { state.moneyGrants[g.key] = true;  delta += g.amount; }
    if (!g.active && was)  { state.moneyGrants[g.key] = false; delta -= g.amount; }
  }
  if (delta !== 0) {
    const current = parseInt(String(state.money || ""), 10) || 0;
    state.money = String(Math.max(0, current + delta));
    hydrateInputs();
    scheduleSave();
  }
}

// ── Hindrance counter ─────────────────────────────────────────────────────────

function updateHindranceCounter() {
  const earned = getHindrancePoints();
  const el = document.querySelector('[data-output="hindrancePoints"]');
  if (!el) return;
  el.textContent = `${earned} / 4`;
  el.classList.toggle("full", earned >= 4);
  renderTraitBoard();
}

function showConfirm(message, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  modal.querySelector(".confirm-message").textContent = message;
  modal.hidden = false;

  const close = () => { modal.hidden = true; };

  document.getElementById("confirm-yes").onclick = () => { close(); onConfirm(); };
  document.getElementById("confirm-no").onclick = () => { close(); };
}

function updateRankWidget() {
  const display = document.querySelector('[data-output="rankDisplay"]');
  if (display) {
    display.textContent = rankName(state.rank);
    const RANK_CLASSES = ['rank-новичок', 'rank-закалённый', 'rank-ветеран', 'rank-герой', 'rank-легенда'];
    display.classList.remove(...RANK_CLASSES);
    const classMap = { 'Новичок': 'rank-новичок', 'Закалённый': 'rank-закалённый', 'Ветеран': 'rank-ветеран', 'Герой': 'rank-герой', 'Легенда': 'rank-легенда' };
    const rn = rankName(state.rank);
    if (classMap[rn]) display.classList.add(classMap[rn]);
  }
  const btn = document.getElementById("rank-up-btn");
  if (btn) {
    btn.hidden = state.rank >= RANK_ORDER.length;
  }
}

function updateHindranceLock() {
  const addBtn = document.querySelector('[data-action="openPicker"][data-type="hindrances"]');
  if (!addBtn) return;
  const locked = state.hindrancesDone && !state.marshalMode;
  addBtn.textContent = locked ? "Изъяны зафиксированы" : "+ Добавить";
  addBtn.disabled = locked;
  addBtn.classList.toggle("locked-btn", locked);
  updateSectionUnlockBtn("hindrances", state.hindrancesDone);
}

// Кнопка «Разблокировать» видна только Маршалу и только если раздел
// зафиксирован для игрока (соответствующий *Done === true).
function updateSectionUnlockBtn(type, isDone) {
  const btn = document.querySelector(`[data-action="unlockSection"][data-type="${type}"]`);
  if (btn) btn.hidden = !(state.marshalMode && isDone);
}

function updateSkillBuyBtn() {
  const btn = document.querySelector('[data-action="buySkillPoint"]');
  if (!btn) return;
  btn.hidden = (state.extraPoints || 0) < 1;
}

function updateEdgeLock() {
  const addBtn = document.querySelector('[data-action="openPicker"][data-type="edges"]');
  if (!addBtn) return;
  const locked = state.edgesDone && !state.marshalMode;
  addBtn.textContent = locked ? "Черты зафиксированы" : "+ Добавить";
  addBtn.disabled = locked;
  addBtn.classList.toggle("locked-btn", locked);
  updateSectionUnlockBtn("edges", state.edgesDone);
}

function updatePowersLock() {
  const addBtn = document.querySelector('[data-action="openPicker"][data-type="powers"]');
  if (!addBtn) return;
  const locked = arePowersLocked();
  addBtn.textContent = locked ? "Силы зафиксированы" : "+ Добавить";
  addBtn.disabled = locked;
  addBtn.classList.toggle("locked-btn", locked);
  updateSectionUnlockBtn("powers", state.powersDone);
}


// ── Art ───────────────────────────────────────────────────────────────────────

function uploadArt(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 360, MAX_H = 480;
      let { width, height } = img;
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      state.artData = canvas.toDataURL("image/jpeg", 0.82);
      try {
        localStorage.setItem(ART_KEY, state.artData);
      } catch {
        showToast("Не удалось сохранить портрет — слишком большой файл");
      }
      commitSheetUpdate({ recalc: false, renderArt: true });
    };
    img.src = String(reader.result || "");
  });
  reader.readAsDataURL(file);
  event.target.value = "";
}

function renderArt() {
  const portrait = document.querySelector(".portrait-frame");
  const placeholder = document.querySelector(".portrait-placeholder");
  if (!portrait || !placeholder) return;

  portrait.style.backgroundImage = state.artData ? `url("${state.artData}")` : "";
  placeholder.hidden = Boolean(state.artData);
}

// ── Gear entries ──────────────────────────────────────────────────────────────

function isCatalogGearEntry(entry) {
  return !!entry && (entry._source === "catalog" || !!resolveCatalogItem("gear", entry, null));
}

function getGearEntryDisplay(entry) {
  const def = resolveCatalogItem("gear", entry, {});
  return {
    name: entry.name || def.name || "",
    notes: entry.notes || def.notes || def.description || "",
    price: entry.price || def.price || "",
    weight: entry.weight ?? def.weight ?? 0,
  };
}

function renderCatalogGearEntry(entry, index) {
  const data = getGearEntryDisplay(entry);
  const card = document.createElement("article");
  card.className = "gear-catalog-card";

  const main = document.createElement("div");
  main.className = "gear-catalog-main";

  const title = document.createElement("strong");
  title.className = "gear-catalog-title";
  title.textContent = data.name;
  main.append(title);

  const meta = document.createElement("div");
  meta.className = "gear-catalog-meta";
  if (data.price) {
    const price = document.createElement("span");
    price.className = "gear-catalog-price";
    price.textContent = `Цена ${data.price}`;
    meta.append(price);
  }
  if (data.weight !== undefined && data.weight !== null && data.weight !== "") {
    const weight = document.createElement("span");
    weight.className = "gear-catalog-weight";
    weight.textContent = `Вес ${data.weight}`;
    meta.append(weight);
  }
  if (meta.childElementCount) main.append(meta);

  if (data.notes) {
    const notes = document.createElement("p");
    notes.className = "gear-catalog-notes";
    notes.textContent = data.notes;
    main.append(notes);
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "×";
  remove.addEventListener("click", () => {
    state.gear.splice(index, 1);
    commitSheetUpdate({ renderGear: true });
  });

  card.append(main, remove);
  return card;
}

function renderEntries(type) {
  const root = document.querySelector(`[data-list="${type}"]`);
  const template = document.querySelector(`#${type === "weapons" ? "weapon" : "gear"}-template`);
  root.replaceChildren();

  state[type].forEach((entry, index) => {
    if (type === "gear" && isCatalogGearEntry(entry)) {
      root.append(renderCatalogGearEntry(entry, index));
      return;
    }

    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelectorAll("[data-field]").forEach((input) => {
      const field = input.dataset.field;
      input.value = entry[field] ?? "";
      input.addEventListener("input", () => {
        entry[field] = input.type === "number" ? Number(input.value) || 0 : input.value;
        commitSheetUpdate();
      });
    });

    node.querySelector('[data-entry-action="remove"]').addEventListener("click", () => {
      state[type].splice(index, 1);
      commitSheetUpdate({ renderGear: type === "gear" });
    });

    root.append(node);
  });
}

function addEntry(type) {
  const empty = type === "weapons"
    ? { name: "", range: "", damage: "", ap: "", rof: "", ammo: "" }
    : { name: "", notes: "", price: "", weight: 0 };
  state[type].push(empty);
  commitSheetUpdate({ recalc: false, renderGear: type === "gear" });
}

// ── Export / Clear ────────────────────────────────────────────────────────────

function clearSheet() {
  if (!confirm("Очистить лист персонажа?")) return;
  state = structuredClone(DEFAULT_STATE);
  state.marshalMode = false;
  state.skills = makeDefaultSkills();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ART_KEY);
  ensureTraitModel();
  renderTraitBoard();
  renderEntries("gear");
  renderTracks();
  renderCatalogPickers();
  renderArt();
  hydrateInputs();
  recalculate();
  updateHindranceCounter();
  updateHindranceLock();
  updateEdgeLock();
  updatePowersLock();
  state.extraPoints = 0;
  setOutput("extraPoints", 0);
  updateSkillBuyBtn();
  updateRankWidget();
  updateDealButton();
  updateJokerStatus();
  updateMarshalUI();
  updateHarrowedUI();
  setOutput("saveState", "Очищено");
}

// ── Export/Import bridge (window-bound so exportImport.js can reliably reach them) ──
window._charExport = () => ({
  state: JSON.parse(_serializeState()),
  artData: state.artData || "",
});
window._charImport = (stateObj, artData) => {
  suppressSaveOnImport = true;
  clearTimeout(saveTimer);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
  if (artData) localStorage.setItem(ART_KEY, artData);
  else localStorage.removeItem(ART_KEY);
};

init();
