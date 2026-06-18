function getMountDefinition(kind) {
  return MOUNT_VARIANTS[kind] || MOUNT_VARIANTS.regular;
}

function getMountOptionPriceCents(kind, option) {
  return Math.round(getMountDefinition(kind).priceCents * option.priceFactor);
}

function formatMountPrice(cents) {
  if (!cents) return "Бесплатно";
  const dollars = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest ? `$ ${dollars}.${String(rest).padStart(2, "0")}` : `$ ${dollars}`;
}

// spendMoney / parsePriceCents / getMoneyCents живут в js/features/money.js (#10)

function activateMount(kind, option) {
  const definition = getMountDefinition(kind);
  const priceCents = getMountOptionPriceCents(definition.kind, option);
  if (!spendMoney(priceCents)) {
    showToast("Не хватает средств!");
    return;
  }
  state.horseActive = true;
  state.mount = {
    type: "horse",
    kind: definition.kind,
    source: option.source,
    defectIds: option.source === "half" ? rollMountHindranceIds() : [],
    equipment: defaultMountEquipment(),
  };
  closeMountModal();
  commitSheetUpdate({ hydrate: true, recalc: false, renderMount: true, renderChoices: "weapons" });
}

function toggleMount() {
  if (state.horseActive) {
    state.horseActive = false;
    state.mount = null;
    // Снятая лошадь возвращает все винтовки из чехлов персонажу
    let changed = false;
    (state.weapons || []).forEach(w => { if (w._stashed) { w._stashed = false; changed = true; } });
    if (changed) commitSheetUpdate();
    else commitSheetUpdate({ recalc: false, renderMount: true, renderChoices: "weapons" });
  } else {
    openMountModal();
  }
}

// ── Чехлы для винтовки: убрать/вытащить винтовку (вес переносится на лошадь) ──
// Вместимость = число купленных чехлов (по одной винтовке на чехол).
function getRifleSlotCount() {
  if (!(state.horseActive && state.mount)) return 0;
  const scabbard = MOUNT_GEAR_ITEMS["rifleScabbard"];
  return scabbard ? getMountGearOwnedCount(ensureMountEquipment(), scabbard) : 0;
}

// В чехол убираются длинноствольные: винтовки, ружья (дробовики) и карабины
const SCABBARD_WEAPON_GROUPS = new Set(["Винтовки", "Ружья", "Карабины"]);
function isRifleWeapon(weapon) {
  if (!weapon) return false;
  const def = resolveCatalogItem("weapons", weapon);
  return SCABBARD_WEAPON_GROUPS.has(def.group || weapon.group);
}

function getStashedRifles() {
  return (state.weapons || []).filter(w => w._stashed);
}

function canStashRifle() {
  return getStashedRifles().length < getRifleSlotCount();
}

function stashRifle(weapon) {
  if (!weapon || !isRifleWeapon(weapon)) return;
  if (!canStashRifle()) { showToast("Нет свободного чехла для винтовки"); return; }
  weapon._stashed = true;
  commitSheetUpdate();
}

function unstashRifle(weapon) {
  if (!weapon) return;
  weapon._stashed = false;
  commitSheetUpdate();
}

// Возвращает лишние винтовки, если чехлов стало меньше, чем убрано винтовок
function reconcileStashedRifles() {
  const cap = getRifleSlotCount();
  const stashed = getStashedRifles();
  if (stashed.length > cap) {
    stashed.slice(cap).forEach(w => { w._stashed = false; });
    return true;
  }
  return false;
}

// spendMoney перенесён в js/features/money.js (#10)
