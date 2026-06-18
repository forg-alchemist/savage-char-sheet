function rollMountHindranceIds() {
  const useMajor = Math.random() < 0.5;
  const pool = getMountHindrancePool(useMajor ? "крупный" : "мелкий");
  return _pickRandomUnique(pool, useMajor ? 1 : 2).map(h => h.id);
}

function getMountHindrancePool(degree) {
  const target = normalizeMountDegree(degree);
  const seen = new Set();
  return MOUNT_HINDRANCE_IDS
    .map(resolveMountHindranceRef)
    .filter(h => h && h.id && normalizeMountDegree(h.degree) === target && !seen.has(h.id) && seen.add(h.id));
}

function normalizeMountDegree(degree) {
  return String(degree || "").trim().toLowerCase();
}

function isMountIdRef(value) {
  return typeof value === "string" && /^h\d{2,3}$/.test(value);
}

function resolveMountHindranceRef(ref) {
  const catalog = CATALOGS.hindrances || window.DEADLANDS_CATALOG_HINDRANCES || [];
  if (!ref) return null;
  if (typeof ref === "string") {
    if (isMountIdRef(ref)) return window.CATALOG_BY_ID?.hindrances?.[ref] || catalog.find(h => h.id === ref) || null;
    return catalog.find(h => h.name === ref) || null;
  }
  if (ref.id) return window.CATALOG_BY_ID?.hindrances?.[ref.id] || catalog.find(h => h.id === ref.id) || null;
  const degree = normalizeMountDegree(ref.degree);
  return catalog.find(h => h.name === ref.name && normalizeMountDegree(h.degree) === degree)
    || catalog.find(h => h.name === ref.name)
    || null;
}

function normalizeMountDefectIds() {
  const mount = state.mount || {};
  const refs = Array.isArray(mount.defectIds)
    ? mount.defectIds
    : (Array.isArray(mount.defects) ? mount.defects : []);
  const ids = refs
    .map(ref => resolveMountHindranceRef(ref)?.id || (isMountIdRef(ref) ? ref : null))
    .filter(Boolean);

  if (state.mount) {
    state.mount.defectIds = ids;
    delete state.mount.defects;
  }
  return ids;
}

function getMountDefectItems() {
  return normalizeMountDefectIds()
    .map(id => resolveMountHindranceRef(id))
    .filter(Boolean);
}

function hasMountBlindness(defects = getMountDefectItems()) {
  return defects.some(defect => defect.id === MOUNT_BLINDNESS_HINDRANCE_ID);
}

function resolveMountEdgeRef(ref) {
  const catalog = CATALOGS.edges || window.DEADLANDS_CATALOGS?.edges || [];
  if (!ref) return null;
  if (typeof ref === "string") {
    return window.CATALOG_BY_ID?.edges?.[ref] || catalog.find(edge => edge.id === ref || edge.name === ref) || null;
  }
  if (ref.id) return window.CATALOG_BY_ID?.edges?.[ref.id] || catalog.find(edge => edge.id === ref.id) || null;
  return catalog.find(edge => edge.name === ref.name) || null;
}

function rollMountBlindnessEdgeId() {
  const pool = MOUNT_BLINDNESS_EDGE_IDS
    .map(id => resolveMountEdgeRef(id))
    .filter(Boolean);
  return _pickRandomUnique(pool, 1)[0]?.id || null;
}

function normalizeMountEdgeIds(defects = getMountDefectItems()) {
  if (!state.mount) return [];
  const prevKey = JSON.stringify(state.mount.edgeIds || []);
  if (!hasMountBlindness(defects)) {
    state.mount.edgeIds = [];
    delete state.mount.edges;
    if (prevKey !== "[]") scheduleSave();
    return [];
  }

  const refs = Array.isArray(state.mount.edgeIds)
    ? state.mount.edgeIds
    : (Array.isArray(state.mount.edges) ? state.mount.edges : []);
  let ids = refs
    .map(ref => resolveMountEdgeRef(ref)?.id || null)
    .filter(id => MOUNT_BLINDNESS_EDGE_IDS.includes(id));

  if (ids.length === 0) {
    const rolled = rollMountBlindnessEdgeId();
    if (rolled) ids = [rolled];
  } else {
    ids = [ids[0]];
  }

  state.mount.edgeIds = ids;
  delete state.mount.edges;
  if (prevKey !== JSON.stringify(ids)) scheduleSave();
  return ids;
}

function getMountEdgeItems(defects = getMountDefectItems()) {
  return normalizeMountEdgeIds(defects)
    .map(id => resolveMountEdgeRef(id))
    .filter(Boolean);
}

function hasMountEdge(id, defects) {
  return getMountEdgeItems(defects).some(edge => edge.id === id);
}

function getMountEquipmentItems() {
  if (!state.mount) return [];
  const equipment = ensureMountEquipment();
  const items = [];
  getMountGearCatalogItems().forEach(item => {
    const count = getMountGearOwnedCount(equipment, item);
    if (count <= 0) return;
    const entry = { ...item, key: item.key };
    if (isMountGearCounted(item)) {
      entry.count = count;
      entry.weight = (Number(item.weight) || 0) * count;
      entry.name = count > 1 ? `${item.name} x${count}` : item.name;
    }
    items.push(entry);
  });
  if (equipment.armorId) {
    const armor = resolveMountArmorById(equipment.armorId);
    if (armor) items.push({ ...armor, kind: "armor", group: "armor", key: "armor", priceCents: parsePriceCents(armor.price) ?? 0 });
  }
  // Винтовки, убранные в чехлы — их вес считается за лошадью
  getStashedRifles().forEach(w => {
    items.push({
      name: w.name,
      weight: Number(w.weight) || 0,
      note: "Винтовка в чехле",
      icon: "👜",
      kind: "stash",
      group: "common",
      key: `stash:${state.weapons.indexOf(w)}`,
    });
  });
  return items;
}

function getMountCurrentLoad() {
  return getMountEquipmentItems().reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
}

function getMountHindranceEffect(defect) {
  return (defect && defect.id && MOUNT_HINDRANCE_EFFECTS[defect.id]) || null;
}

function getMountEdgeEffect(edge) {
  return (edge && edge.id && MOUNT_EDGE_EFFECTS[edge.id]) || null;
}

function applyMountIndicatorEffect(effect, add) {
  if (!effect?.indicators) return;
  Object.entries(effect.indicators).forEach(([key, amount]) => {
    add(key, amount, effect.notes?.[key] || "");
  });
}

function getMountLoadStats(definition, defects) {
  const base = definition.loadLimit || MOUNT_VARIANTS.regular.loadLimit;
  const notes = [];
  let bonus = 0;
  defects.forEach(defect => {
    const effect = getMountHindranceEffect(defect);
    if (!effect?.load) return;
    bonus += effect.load;
    if (effect.loadNote) notes.push(effect.loadNote);
  });
  getMountEdgeItems(defects).forEach(edge => {
    const effect = getMountEdgeEffect(edge);
    if (!effect?.load) return;
    bonus += effect.load;
    if (effect.loadNote) notes.push(effect.loadNote);
  });
  return {
    base,
    value: base + bonus,
    notes,
  };
}

function getMountIndicators(definition, defects) {
  const base = definition.indicators || MOUNT_VARIANTS.regular.indicators;
  const mods = { pace: 0, runDie: 0, parry: 0, toughness: 0 };
  const notes = { pace: [], runDie: [], parry: [], toughness: [] };
  const add = (key, amount, note) => {
    mods[key] += amount;
    notes[key].push(note);
  };

  defects.forEach(defect => {
    applyMountIndicatorEffect(getMountHindranceEffect(defect), add);
  });
  getMountEdgeItems(defects).forEach(edge => {
    applyMountIndicatorEffect(getMountEdgeEffect(edge), add);
  });

  const loadStats = getMountLoadStats(definition, defects);
  const currentLoad = getMountCurrentLoad();
  if (isLoadOverLimit(currentLoad, loadStats.value)) {
    add("pace", -1, "Перегруз: Шаг -1");
    add("runDie", -1, "Перегруз: Бег -1 ступень");
  }

  const equipmentItems = getMountEquipmentItems();
  if (equipmentItems.some(item => item.key === "windAmulet")) {
    add("pace", 1, "Амулет Ветра: Шаг +1");
    add("runDie", 1, "Амулет Ветра: Бег +1 ступень");
  }

  const armor = equipmentItems.find(item => item.kind === "armor");
  if (armor) {
    add("toughness", Number(armor.bonus) || 0, `${armor.name}: Стойкость +${Number(armor.bonus) || 0}`);
  }

  const runBaseIdx = Math.max(0, MOUNT_RUN_DICE.indexOf(base.runDie));
  const runDieIdx = Math.max(0, Math.min(MOUNT_RUN_DICE.length - 1, runBaseIdx + mods.runDie));
  return {
    base,
    values: {
      pace: Math.max(1, base.pace + mods.pace),
      runDie: MOUNT_RUN_DICE[runDieIdx],
      parry: Math.max(0, base.parry + mods.parry),
      toughness: Math.max(0, base.toughness + mods.toughness),
    },
    notes,
  };
}
