function reduceProgressSvg(current, max = 2) {
  const r = 8, cx = 10, cy = 10;
  const circ = 2 * Math.PI * r;
  const dash = ((current / max) * circ).toFixed(2);
  const gap = (circ - dash).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="4" opacity="0.22"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="4"
      stroke-dasharray="${dash} ${gap}" stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"/>
  </svg>`;
}

function isSubPower(item) {
  if (!item) return false;
  if (item.hidden) return false;
  if (item.id) return window.SUB_POWER_IDS?.has(item.id) ?? false;
  return SUB_POWER_PARENTS.some(p => item.name.startsWith(p + ': '));
}

const SPIRIT_SUMMON_MINOR_PARENT_NAME = "Связь с миром духов: Призвать младшего духа";
const SPIRIT_SUMMON_CHILD_PREFIX = "Связь с миром духов: Призвать ";
const SPIRIT_SUMMON_MINOR_CHILD_NAMES = new Set([
  "Связь с миром духов: Призвать духа предка",
  "Связь с миром духов: Призвать духа природы (волк)",
  "Связь с миром духов: Призвать духа природы (малый народец)",
  "Связь с миром духов: Призвать духа природы (орёл)",
  "Связь с миром духов: Призвать духа природы (медведь)",
  "Связь с миром духов: Призвать духа природы (паук)",
  "Связь с миром духов: Призвать духа природы (буйвол)",
]);

function isMinorSpiritSummonParent(item) {
  return !!item && (
    (item.id && item.id === window.WK_POWERS?.SVYAZ_ML)
    || item.name === SPIRIT_SUMMON_MINOR_PARENT_NAME
  );
}

function isSpiritSummonChildPower(item) {
  return !!item?.hidden
    && typeof item.name === "string"
    && SPIRIT_SUMMON_MINOR_CHILD_NAMES.has(item.name);
}

function isPowerLimitFree(item) {
  return isSubPower(item) || !!item?._arcaneGift || isSpiritSummonChildPower(item);
}

function selectedPrimataSubEdge() {
  return (state.selectedEdges || []).find(e => e.requirements === PRIMETA_NAME);
}

function selectedKungfuSubEdges(parentName) {
  return (state.selectedEdges || []).filter(e => e.subOf === parentName);
}

function availableKungfuSubStyles(parentName) {
  const taken = new Set(selectedKungfuSubEdges(parentName).map(e => e.name));
  return (CATALOGS.edges || []).filter(e => e.subOf === parentName && !taken.has(e.name));
}

function upgradeKungfuToHeavenly() {
  const byId = window.CATALOG_BY_ID?.edges || {};
  (state.selectedEdges || []).forEach((e, idx) => {
    if (e.subOf !== KUNGFU_PARENT) return;
    const heavenlyId = e.id && window.KUNGFU_UPGRADE_MAP?.[e.id];
    if (heavenlyId) {
      const cat = byId[heavenlyId];
      if (cat) state.selectedEdges[idx] = { ...cat };
    } else {
      // Fallback for unmigrated items without id
      const suffix = e.name.slice((KUNGFU_PARENT + ': ').length);
      const cat = (CATALOGS.edges || []).find(c => c.name === HEAVENLY_KUNGFU + ': ' + suffix);
      if (cat) state.selectedEdges[idx] = { ...cat };
    }
  });
}

const _ARCHETYPE_AUTO_HINDRANCES = {
  "Просветлённый": {
    name: "Чаша переполняется",
    degree: "Крупный",
    description: "Твоя сила Ци столь велика, что способна посеять хаос в окружающей действительности. Когда твой герой совершает проверку Драки, атакуя голыми руками, ногами или с использованием Ци, его внутренняя сила спонтанно прорывается в мир, вызывая непредвиденные эффекты. Обычные люди, видя это, решат что перед ними чудовище — и разбегутся, а потом вернутся с факелами и вилами. Более осведомлённые посчитают тебя особо опасным противником. Куда бы герой ни отправился, его будут разыскивать другие мастера, страстно желающие помериться силой.",
    penalty: "-",
    bonus: "-",
    _auto: true,
  },
};

function syncArchetypeHindrances() {
  if (!state.selectedHindrances) state.selectedHindrances = [];
  const activeArchetypes = new Set(computeArchetypes());

  // Remove auto-hindrances whose archetype is no longer active
  state.selectedHindrances = state.selectedHindrances.filter(h => {
    if (!h._auto) return true;
    return Object.entries(_ARCHETYPE_AUTO_HINDRANCES).some(
      ([arch, def]) => def.name === h.name && activeArchetypes.has(arch)
    );
  });

  // Add auto-hindrances for active archetypes that aren't yet present
  const existingAutoNames = new Set(
    state.selectedHindrances.filter(h => h._auto).map(h => h.name)
  );
  for (const [arch, def] of Object.entries(_ARCHETYPE_AUTO_HINDRANCES)) {
    if (activeArchetypes.has(arch) && !existingAutoNames.has(def.name)) {
      state.selectedHindrances.push({ ...def });
    }
  }
}

function syncArcaneFreePoers() {
  if (!state.selectedPowers) state.selectedPowers = [];
  const selectedEdgeIds = new Set((state.selectedEdges || []).map(e => e.id).filter(Boolean));

  state.selectedPowers = state.selectedPowers.filter(p => {
    if (!p._arcaneGift) return true;
    // _arcaneGift stores edge ID (new) or edge name (legacy localStorage)
    if (window.CATALOG_BY_ID?.edges?.[p._arcaneGift]) return selectedEdgeIds.has(p._arcaneGift);
    return (state.selectedEdges || []).some(e => e.name === p._arcaneGift); // legacy fallback
  });

  const existingIds = new Set(state.selectedPowers.map(p => p.id).filter(Boolean));
  const byId = window.CATALOG_BY_ID?.powers || {};
  for (const [edgeId, powerIds] of Object.entries(window.ARCANE_FREE_POWERS_BY_ID || {})) {
    if (!selectedEdgeIds.has(edgeId)) continue;
    for (const powerId of powerIds) {
      if (existingIds.has(powerId)) continue;
      const cat = byId[powerId];
      if (cat) {
        state.selectedPowers.push({ ...cat, _arcaneGift: edgeId });
        existingIds.add(powerId);
      }
    }
  }
}

function syncSubPowers() {
  if (!state.selectedPowers) return;
  const currentRank = state.rank;
  const selectedIds  = new Set(state.selectedPowers.map(p => p.id).filter(Boolean));
  const byId = window.CATALOG_BY_ID?.powers || {};
  for (const parentId of (window.SUB_POWER_PARENT_IDS || [])) {
    if (!selectedIds.has(parentId)) continue;
    const parent = byId[parentId];
    if (!parent) continue;
    const subPowers = (window.DEADLANDS_CATALOG_POWERS || []).filter(p =>
      p.name.startsWith(parent.name + ': ') && rankValue(p.rank) <= currentRank && !p.hidden
    );
    for (const sub of subPowers) {
      if (sub.id && !selectedIds.has(sub.id)) {
        state.selectedPowers.push({ ...sub });
        selectedIds.add(sub.id);
      }
    }
  }
}

function getDieNum(str) {
  if (!str || str === "-") return 0;
  const m = str.match(/d(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function checkSingleEdgeRequirementPart(part) {
  if (/мистический\s+дар\s+\(любой\)/i.test(part)) return true;

  const m = part.match(/^(.+?)\s+d(\d+)\+?$/i);
  if (m) {
    const reqName = m[1].trim().toLowerCase();
    const reqDie = parseInt(m[2]);

    if (reqName === "мистический навык") {
      const allArcane = new Set(Object.values(ARCANE_SKILLS).flat().map(n => n.toLowerCase()));
      let found = false;
      for (const group of Object.values(state.customSkills || {})) {
        for (const cs of (group || [])) {
          if (cs.name && allArcane.has(cs.name.toLowerCase()) && getDieNum(cs.die) >= reqDie) {
            found = true; break;
          }
        }
        if (found) break;
      }
      if (!found) {
        const s = (state.skills || []).find(sk => allArcane.has(sk.name.toLowerCase()) && getDieNum(sk.die) >= reqDie);
        if (s) found = true;
      }
      return found;
    }

    const attrKey = ATTR_MAP_RU[reqName];
    if (attrKey) return getDieNum(state.attributes[attrKey]) >= reqDie;

    let skillDie = 0;
    const skill = (state.skills || []).find(s => s.name.toLowerCase() === reqName);
    if (skill) {
      skillDie = getDieNum(skill.die);
    } else {
      for (const group of Object.values(state.customSkills || {})) {
        const cs = (group || []).find(s => s.name?.toLowerCase() === reqName);
        if (cs) { skillDie = getDieNum(cs.die); break; }
      }
    }
    return skillDie >= reqDie;
  }

  const norm = part.toLowerCase();
  if (ARCHETYPE_NAMES.has(part)) return computeArchetypes().includes(part);

  const reqEdgeId = window.EDGE_ID_BY_NAME?.[norm];
  if (reqEdgeId) return (state.selectedEdges || []).some(e => e.id === reqEdgeId);
  return (state.selectedEdges || []).some(e => e.name.toLowerCase() === norm);
}

function checkEdgeRequirements(item) {
  // ++ / + edges: check prerequisite by ID
  const upgradeFromId = item.id && window.EDGE_UPGRADES_FROM?.[item.id];
  if (upgradeFromId) {
    if (!(state.selectedEdges || []).some(e => e.id === upgradeFromId)) return false;
  } else if (item.name.endsWith("++")) {
    const plusName = item.name.slice(0, -1);
    if (!(state.selectedEdges || []).some(e => e.name === plusName)) return false;
  } else if (item.name.endsWith("+")) {
    const baseName = item.name.slice(0, -1);
    if (!(state.selectedEdges || []).some(e => e.name === baseName)) return false;
  }
  if (!item.requirements || item.requirements === "-" || item.requirements === "—") return true;

  const reqStr = item.requirements.trim();

  const reqLow = reqStr.toLowerCase();
  const anyHindranceIdx = reqLow.indexOf("любой из изъянов");
  if (anyHindranceIdx !== -1) {
    const colonIdx = reqLow.indexOf(":", anyHindranceIdx);
    const afterColon = colonIdx !== -1 ? reqLow.substring(colonIdx + 1) : reqLow.substring(anyHindranceIdx + "любой из изъянов".length);
    const names = afterColon.split(",").map(s => s.trim()).filter(Boolean);
    const selectedIds = new Set((state.selectedHindrances || []).map(h => h.id).filter(Boolean));
    return names.some(n => {
      const ids = window.HINDRANCE_IDS_BY_NAME?.[n] || [];
      if (ids.some(id => selectedIds.has(id))) return true;
      // Fallback: name check for items lacking id
      return (state.selectedHindrances || []).some(h => h.name.toLowerCase() === n);
    });
  }

  const parts = reqStr.split(",").map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const alternatives = part.split(/\s+или\s+/i).map(s => s.trim()).filter(Boolean);
    const satisfied = alternatives.length > 1
      ? alternatives.some(checkSingleEdgeRequirementPart)
      : checkSingleEdgeRequirementPart(part);
    if (!satisfied) return false;
  }
  return true;
}

function catalogKey(item, type) {
  if (item.id) return item.id;
  // Fallback for items lacking an id (should not happen after migration)
  if (type === "edges") return `${item.name}|${item.rank}|${item.category}`;
  if (type === "powers") return `${item.name}|${item.rank}`;
  if (type === "weapons") return `${item.name}|${item.__index ?? ""}`;
  if (type === "armor") return `${item.name}|${item.category}|${item.__index ?? ""}`;
  return `${item.name}|${item.degree}`;
}

function getCatalogStateKey(type) {
  if (type === "edges") return "selectedEdges";
  if (type === "powers") return "selectedPowers";
  if (type === "weapons") return "weapons";
  if (type === "armor") return "selectedArmor";
  if (type === "gear") return "gear";
  return "selectedHindrances";
}

function getCatalogMeta(item, type) {
  if (type === "edges") {
    if (item.archetype) return "Черта архетипа";
    return item.category;
  }
  if (type === "powers") {
    const parts = getPowerDisplayParts(item);
    return `${item.rank} · ${item.points} ПС · ${parts.range} · ${item.duration}`;
  }
  if (type === "gear") {
    const parts = [];
    if (item.price) parts.push(`Цена: ${item.price}`);
    if (item.weight !== undefined && item.weight !== null) parts.push(`Вес: ${item.weight}`);
    return parts.join(" · ");
  }
  return `${item.degree}${item.penalty && item.penalty !== "-" ? ` · ${item.penalty}` : ""}`;
}

function getPowerPoints(item) {
  if (!item.pointsByRank) return String(item.points).toUpperCase();
  const idx = Math.min(Math.max(state.rank - 1, 0), item.pointsByRank.length - 1);
  return String(item.pointsByRank[idx]);
}

function isCharacterArmor(item) {
  const def = resolveCatalogItem("armor", item);
  return Array.isArray(def?.sectors) && def.sectors.length > 0;
}

const ARMOR_SECTOR_LABELS = {
  head: "Голова",
  torso: "Торс",
  arms: "Руки",
  legs: "Ноги",
};

function formatArmorSectors(item) {
  const def = resolveCatalogItem("armor", item);
  const sectors = Array.isArray(def?.sectors) ? def.sectors : [];
  return sectors.length
    ? sectors.map(sector => ARMOR_SECTOR_LABELS[sector] || sector).join(", ")
    : "—";
}

function pruneNonCharacterArmor() {
  state.selectedArmor = (state.selectedArmor || []).filter(isCharacterArmor);
}

function computeMaxPS() {
  let max = 0;
  (state.selectedEdges || []).forEach(e => {
    const s = (e.id && window.ARCANE_GIFT_STATS_BY_ID?.[e.id]) ?? ARCANE_GIFT_STATS?.[e.name];
    if (s) max += s.ps;
    if (e.id === window.WK_EDGES?.PS || e.name === "Пункты силы") max += 5 * (e.count || 1);
  });
  return max;
}

function computeMaxSily() {
  let max = 0;
  (state.selectedEdges || []).forEach(e => {
    const s = (e.id && window.ARCANE_GIFT_STATS_BY_ID?.[e.id]) ?? ARCANE_GIFT_STATS?.[e.name];
    if (s) max += s.sily;
    if (e.id === window.WK_EDGES?.SILY || e.name === "Новые силы") max += 2 * (e.count || 1);
  });
  return max;
}

function computeCurrentSily() {
  return (state.selectedPowers || []).filter(p => !isPowerLimitFree(p)).length;
}

function isPowersAtMax() {
  return computeCurrentSily() >= computeMaxSily();
}

function arePowersLocked() {
  return state.powersDone && !state.marshalMode && computeCurrentSily() === computeMaxSily();
}

function hasContent(val) {
  if (!val) return false;
  const s = String(val).trim();
  return s !== "" && s !== "-" && s !== "—" && s !== "–";
}

function getPowerCatalogDefinition(item) {
  if (!item) return item;
  // fallback=null, чтобы при промахе по id продолжить поиск по .find ниже
  return resolveCatalogItem("powers", item, null)
    || (CATALOGS.powers || []).find(power => power.id && power.id === item.id)
    || (CATALOGS.powers || []).find(power => power.name === item.name)
    || item;
}

function getCurrentArchetypeNames() {
  return computeArchetypes();
}

const POWER_ARCHETYPE_DESCRIPTION_FIELDS = [
  { archetype: "Картёжник", effect: "effectCardsharp", modifiers: "modifiersCardsharp", range: "rangeCardsharp" },
  { archetype: "Рунный стрелок", effect: "effectRuneShooter", modifiers: "modifiersRuneShooter", range: "rangeRuneShooter" },
  { archetype: "Безумный учёный", effect: "effectMadScientist", modifiers: "modifiersMadScientist", range: "rangeMadScientist" },
  { archetype: "Чудотворец", effect: "effectMiracleWorker", modifiers: "modifiersMiracleWorker", range: "rangeMiracleWorker" },
  { archetype: "Вудуист", effect: "effectVoodooist", modifiers: "modifiersVoodooist", range: "rangeVoodooist" },
  { archetype: "Шаман", effect: "effectShaman", modifiers: "modifiersShaman", range: "rangeShaman" },
  { archetype: "Просветлённый", effect: "effectEnlightened", modifiers: "modifiersEnlightened", range: "rangeEnlightened" },
];

function getPowerDisplayParts(item) {
  const definition = getPowerCatalogDefinition(item);
  const activeArchetypes = getCurrentArchetypeNames();
  const fields = POWER_ARCHETYPE_DESCRIPTION_FIELDS.find(entry =>
    activeArchetypes.includes(entry.archetype)
    && (Object.prototype.hasOwnProperty.call(definition || {}, entry.effect)
      || Object.prototype.hasOwnProperty.call(definition || {}, entry.modifiers)
      || Object.prototype.hasOwnProperty.call(definition || {}, entry.range))
  );
  return {
    effect: fields && Object.prototype.hasOwnProperty.call(definition || {}, fields.effect)
      ? definition[fields.effect]
      : (definition?.effect ?? item.effect),
    modifiers: fields && Object.prototype.hasOwnProperty.call(definition || {}, fields.modifiers)
      ? definition[fields.modifiers]
      : (definition?.modifiers ?? item.modifiers),
    range: fields && Object.prototype.hasOwnProperty.call(definition || {}, fields.range)
      ? definition[fields.range]
      : (definition?.range ?? item.range),
  };
}

function getCatalogDescription(item, type) {
  if (type === "edges") return item.effect;
  if (type === "powers") {
    const parts = getPowerDisplayParts(item);
    return hasContent(parts.modifiers) ? `${parts.effect} Усиления: ${parts.modifiers}` : parts.effect;
  }
  if (type === "gear") return item.notes || item.description || "";
  // Альтернативное описание для Меченного, если задано в сущности айтема
  if (state.harrowed && item.descriptionHarrowed) return item.descriptionHarrowed;
  return item.description;
}

function isCatalogArchetypeAvailable(item, activeArchetypes) {
  if (!item.archetype) return true;
  if (activeArchetypes.has(item.archetype)) return true;
  return item.archetype === "Чудотворец" && activeArchetypes.has("Вудуист");
}

function getAvailableCatalogItems(type) {
  const source = CATALOGS[type] || [];
  if (type === "hindrances" || type === "weapons" || type === "armor") {
    let items = source.map((item, index) => ({ ...item, __index: index }));
    if (type === "armor") {
      items = items.filter(isCharacterArmor);
    }
    if (type === "hindrances") {
      if (state.harrowed) {
        items = items.filter(item => !HARROWED_BLOCKED_HINDRANCE_IDS.has(item.id));
        items = sortHarrowedHindrancesFirst(items);
      } else {
        items = items.filter(item => !item.harrowedOnly);
      }
    }
    return items;
  }
  const currentRank = state.rank;
  const mapped = source.map((item, index) => ({ ...item, __index: index }));
  if (type === "edges") {
    // Фильтр по архетипу: ВСЕ черты этого архетипа — независимо от того, выбран
    // ли он, и независимо от текущего ранга.
    if (_edgeFilterMode.startsWith("archetype:")) {
      const targetArchetype = _edgeFilterMode.slice("archetype:".length);
      return mapped.filter(item => item.archetype === targetArchetype);
    }
    if (_edgeFilterMode === "all") return mapped;
    const activeArchetypes = new Set(computeArchetypes());
    const visibleItems = mapped.filter(item => isCatalogArchetypeAvailable(item, activeArchetypes));
    if (_edgeFilterMode.startsWith("rank:")) {
      const targetRank = _edgeFilterMode.slice(5);
      return visibleItems.filter(item => item.rank === targetRank);
    }
    return visibleItems.filter(item => rankValue(item.rank) <= currentRank);
  }
  if (type === "powers") return mapped;
  return mapped.filter(item => rankValue(item.rank) <= currentRank);
}

function checkArmorStrength(armor, hasBugai, hasPolnota = false) {
  const ms = armor.minStr;
  if (!ms || ms === "—" || ms === "-") return true;
  const msMatch = String(ms).match(/^d(\d+)$/);
  if (!msMatch) return true;
  let reqIdx = DICE_VALUES.indexOf(parseInt(msMatch[1]));
  if (reqIdx === -1) return true;
  if (hasBugai) reqIdx -= 1;
  if (hasPolnota) reqIdx += 1;
  reqIdx = Math.max(0, Math.min(DICE_VALUES.length - 1, reqIdx));
  return parseTrait(state.attributes?.strength || "d4").die >= DICE_VALUES[reqIdx];
}

function checkWeaponStrength(weapon, hasBugai, hasPolnota = false) {
  const mc = weapon.mc;
  if (!mc || mc === "—" || mc === "-") return true;
  const mcMatch = String(mc).match(/^d(\d+)$/);
  if (!mcMatch) return true;
  let reqIdx = DICE_VALUES.indexOf(parseInt(mcMatch[1]));
  if (reqIdx === -1) return true;
  if (hasBugai) reqIdx -= 1;
  if (hasPolnota) reqIdx += 1;
  reqIdx = Math.max(0, Math.min(DICE_VALUES.length - 1, reqIdx));
  return parseTrait(state.attributes?.strength || "d4").die >= DICE_VALUES[reqIdx];
}

function pruneInvalidEdges() {
  if (state.marshalMode) return;
  const currentRank = state.rank;
  state.selectedEdges = (state.selectedEdges || []).filter((edge) => rankValue(edge.rank) <= currentRank);
}

function pruneInvalidPowers() {
  if (state.marshalMode) return;
  const currentRank = state.rank;
  state.selectedPowers = (state.selectedPowers || []).filter((power) => rankValue(power.rank) <= currentRank);
}

function updateEdgeCostBadge() {
  const badge = document.getElementById("picker-cost-badge");
  if (!badge) return;
  if (state.advancePending?.type === "edge") {
    badge.textContent = "ЧЕРТА ЗА ПОВЫШЕНИЕ";
    return;
  }
  const totalCount = (state.selectedEdges || []).reduce((s, e) => s + (e.count || 1), 0);
  badge.textContent = totalCount === 0 ? "Бесплатная черта" : "Черта за 2 доп. очка";
}

function renderCatalogPickers() {
  renderChoiceList("hindrances");
  renderChoiceList("edges");
  renderChoiceList("powers");
  renderChoiceList("weapons");
  renderChoiceList("armor");
}

function addCatalogChoice(type) {
  const picker = document.querySelector(`[data-picker="${type}"]`);
  if (!picker || picker.value === "") return;

  const item = CATALOGS[type]?.[Number(picker.value)];
  if (!item) return;

  const targetKey = getCatalogStateKey(type);
  const exists = state[targetKey].some((selected) => catalogKey(selected, type) === catalogKey(item, type));
  if (exists) return;

  if (type === "powers" && !state.marshalMode && !isPowerLimitFree(item)) {
    if (isPowersAtMax()) {
      showToast("ДОСТИГНУТ ЛИМИТ СИЛ");
      return;
    }
  }

  state[targetKey].push(item);
  if (type === "edges") pruneInvalidEdges();
  if (type === "powers") pruneInvalidPowers();
  commitSheetUpdate({ recalc: false, renderChoices: type });
}
