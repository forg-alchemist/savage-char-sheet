function defaultMountEquipment() {
  const equipment = { armorId: null };
  getMountGearCatalogItems().forEach(item => {
    equipment[item.key] = isMountGearCounted(item) ? 0 : false;
  });
  return equipment;
}

function ensureMountEquipment() {
  if (!state.mount) return defaultMountEquipment();
  if (!state.mount.equipment || typeof state.mount.equipment !== "object") {
    state.mount.equipment = defaultMountEquipment();
  }
  // ВАЖНО: мутируем существующий объект на месте (не переприсваиваем новый),
  // иначе ссылки, взятые ранее в этом же кадре, отвяжутся от state.mount.equipment.
  const eq = state.mount.equipment;
  if (eq.armorId === undefined) eq.armorId = null;
  // Миграция: конская броня переехала с a010/a015 на ma001/ma002 (устранение дубля id)
  if (eq.armorId === "a010") eq.armorId = "ma001";
  else if (eq.armorId === "a015") eq.armorId = "ma002";
  getMountGearCatalogItems().forEach(item => {
    if (isMountGearCounted(item)) {
      eq[item.key] = normalizeMountGearCount(eq[item.key], getMountGearMaxCount(item));
    } else {
      eq[item.key] = Boolean(eq[item.key]);
    }
  });
  return eq;
}

function getMountGearCatalogItems() {
  return MOUNT_GEAR_CATALOG.filter(item => item && item.key);
}

function getMountGearMaxCount(item) {
  return Math.max(1, parseInt(String(item?.maxCount || 1), 10) || 1);
}

function isMountGearCounted(item) {
  return getMountGearMaxCount(item) > 1;
}

function normalizeMountGearCount(value, maxCount = 1) {
  if (value === true) return 1;
  if (value === false || value === null || value === undefined) return 0;
  return Math.max(0, Math.min(maxCount, parseInt(String(value), 10) || 0));
}

function getMountGearOwnedCount(equipment, item) {
  if (isMountGearCounted(item)) {
    return normalizeMountGearCount(equipment[item.key], getMountGearMaxCount(item));
  }
  return equipment[item.key] ? 1 : 0;
}

function getMountArmorCatalogItems() {
  const mountArmor = (CATALOGS.mountArmor && CATALOGS.mountArmor.length ? CATALOGS.mountArmor : MOUNT_ARMOR_CATALOG) || [];
  if (mountArmor.length) return mountArmor;
  const legacyArmor = CATALOGS.armor || window.DEADLANDS_CATALOG_ARMOR || [];
  return legacyArmor.filter(item => Array.isArray(item.sectors) && item.sectors.length === 0 && /лошад/i.test(item.name));
}

function resolveMountArmorById(id) {
  if (!id) return null;
  return window.CATALOG_BY_ID?.mountArmor?.[id]
    || getMountArmorCatalogItems().find(item => item.id === id)
    || window.CATALOG_BY_ID?.armor?.[id]
    || (CATALOGS.armor || window.DEADLANDS_CATALOG_ARMOR || []).find(item => item.id === id)
    || null;
}

function mountOptionStat(text, mod = "") {
  return `<span class="mount-option-stat${mod ? ` ${mod}` : ""}">${text}</span>`;
}

function mountGearOptionNote(item, extra = "") {
  const parts = [item.note, mountOptionStat(`Вес ${formatMountNumber(item.weight)}`)];
  if (extra) parts.push(extra);
  return parts.join(" · ");
}

function mountArmorOptionNote(item) {
  return [
    mountOptionStat(`Броня +${item.bonus}`, "mount-option-stat--armor"),
    mountOptionStat(`Вес ${formatMountNumber(item.weight)}`),
    item.note ? item.note : "",
  ].filter(Boolean).join(" · ");
}

function mountArmorEquipmentNote(item) {
  return [
    mountEquipmentStat(`Броня +${item.bonus}`, "mount-equipment-stat--armor"),
    mountEquipmentStat(`Вес ${formatMountNumber(Number(item.weight) || 0)}`),
  ].join(" · ");
}

function mountEquipmentStat(text, mod = "") {
  return `<span class="mount-equipment-stat${mod ? ` ${mod}` : ""}">${text}</span>`;
}

function getMountEquipmentGroup(item) {
  if (item?.group) return item.group;
  if (item?.kind === "armor") return "armor";
  return "common";
}

// Возвращает уже купленный предмет из той же взаимоисключающей группы (кроме самого item)
function getMountExclusiveOwner(group, exceptKey) {
  if (!group) return null;
  const eq = ensureMountEquipment();
  return getMountGearCatalogItems().find(it =>
    it.exclusiveGroup === group && it.key !== exceptKey && getMountGearOwnedCount(eq, it) > 0
  ) || null;
}

// Лимит-группы: суммарное число предметов группы ограничено (напр. оберегов не более 2)
const MOUNT_GEAR_LIMIT_GROUPS = { wards: 2 };

function getMountLimitGroupMax(group) {
  return MOUNT_GEAR_LIMIT_GROUPS[group] ?? Infinity;
}

function getMountLimitGroupCount(group) {
  if (!group) return 0;
  const eq = ensureMountEquipment();
  return getMountGearCatalogItems().reduce(
    (sum, it) => it.limitGroup === group ? sum + getMountGearOwnedCount(eq, it) : sum, 0
  );
}

function getMountLimitGroupText(group) {
  if (!group) return "";
  const max = getMountLimitGroupMax(group);
  if (!isFinite(max)) return "";
  return `${getMountLimitGroupCount(group)}/${max}`;
}

// getMountMoneyCents удалён — используем getMoneyCents из money.js (#10)

function formatMountMoney(cents) {
  const dollars = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest ? `$ ${dollars}.${String(rest).padStart(2, "0")}` : `$ ${dollars}`;
}

function getMountEquipmentPurchaseOptions() {
  const equipment = ensureMountEquipment();
  const armorOwned = Boolean(equipment.armorId);
  const baseOptions = getMountGearCatalogItems().map(item => {
    const ownedCount = getMountGearOwnedCount(equipment, item);
    const maxCount = getMountGearMaxCount(item);
    const counted = isMountGearCounted(item);
    const ownedFull = ownedCount >= maxCount;
    const exclusiveOwner = !ownedFull && item.exclusiveGroup ? getMountExclusiveOwner(item.exclusiveGroup, item.key) : null;
    const limitFull = !ownedFull && !exclusiveOwner && item.limitGroup && ownedCount <= 0 &&
      getMountLimitGroupCount(item.limitGroup) >= getMountLimitGroupMax(item.limitGroup);
    const limitText = getMountLimitGroupText(item.limitGroup);
    const noteExtra = [
      counted ? `Можно до ${maxCount}` : "",
      limitText ? `Лимит ${limitText}` : "",
    ].filter(Boolean).join(" · ");
    let lockedLabel = counted ? "Максимум" : "Уже есть";
    if (ownedFull && limitText) lockedLabel = `Уже есть · Лимит ${limitText}`;
    if (exclusiveOwner) lockedLabel = "Занято";
    if (limitFull) lockedLabel = `Лимит ${limitText}`;
    return {
      key: item.key,
      type: "gear",
      variant: getMountEquipmentGroup(item),
      icon: item.icon || "▣",
      label: item.name,
      note: mountGearOptionNote(item, noteExtra),
      priceCents: item.priceCents,
      locked: ownedFull || Boolean(exclusiveOwner) || limitFull,
      lockedLabel,
    };
  });
  const armorOptions = getMountArmorCatalogItems().map(item => {
    return {
      key: `armor:${item.id}`,
      type: "armor",
      variant: "armor",
      icon: item.icon || "▰",
      label: item.name,
      note: mountArmorOptionNote(item),
      priceCents: parsePriceCents(item.price) ?? 0,
      armorId: item.id,
      locked: armorOwned,
      lockedLabel: equipment.armorId === item.id ? "Уже есть" : "Броня уже есть",
    };
  });
  return [...baseOptions, ...armorOptions];
}

function buyMountEquipment(option) {
  if (!state.mount) return false;
  const equipment = ensureMountEquipment();
  const gearItem = option.type === "gear" ? MOUNT_GEAR_ITEMS[option.key] : null;
  if (option.type === "gear" && !gearItem) {
    showToast("Предмет не найден");
    return false;
  }
  if (option.type === "gear") {
    const ownedCount = getMountGearOwnedCount(equipment, gearItem);
    const maxCount = getMountGearMaxCount(gearItem);
    if (ownedCount >= maxCount) {
      showToast(isMountGearCounted(gearItem) ? "Достигнут максимум" : "Уже куплено");
      return false;
    }
    // Предмет может требовать наличия другого (напр. тайник требует седло)
    if (gearItem.requires) {
      const reqItem = MOUNT_GEAR_ITEMS[gearItem.requires];
      if (reqItem && getMountGearOwnedCount(equipment, reqItem) <= 0) {
        showToast(`Не куплено ${(reqItem.name || "").toLowerCase()}!`);
        return false;
      }
    }
    // Взаимоисключающая группа: можно держать только один предмет из группы
    if (gearItem.exclusiveGroup) {
      const owner = getMountExclusiveOwner(gearItem.exclusiveGroup, gearItem.key);
      if (owner) {
        showToast(`Уже выбрано: ${owner.name}`);
        return false;
      }
    }
  }
  if (option.type === "armor" && equipment.armorId) {
    showToast("У лошади уже есть броня");
    return false;
  }
  if (!spendMoney(option.priceCents)) {
    showToast("Не хватает средств!");
    return false;
  }
  if (option.type === "gear" && isMountGearCounted(gearItem)) {
    equipment[option.key] = getMountGearOwnedCount(equipment, gearItem) + 1;
  } else if (option.type === "gear") {
    equipment[option.key] = true;
  }
  if (option.type === "armor") equipment.armorId = option.armorId;
  commitSheetUpdate({ hydrate: true, recalc: false, renderMount: true, renderChoices: "weapons" });
  updateMountMoneyBadges();
  return true;
}

function removeMountEquipment(key) {
  if (!state.mount) return;
  // Вытащить винтовку из чехла (вернуть персонажу)
  if (typeof key === "string" && key.startsWith("stash:")) {
    const idx = parseInt(key.slice(6), 10);
    const w = (state.weapons || [])[idx];
    if (w) w._stashed = false;
    commitSheetUpdate();
    return;
  }
  const equipment = ensureMountEquipment();
  if (key === "armor") equipment.armorId = null;
  else {
    const item = MOUNT_GEAR_ITEMS[key];
    if (item && isMountGearCounted(item)) {
      equipment[key] = Math.max(0, getMountGearOwnedCount(equipment, item) - 1);
    } else if (item) {
      equipment[key] = false;
    }
  }
  // Если чехлов стало меньше — лишние винтовки возвращаются персонажу
  const popped = reconcileStashedRifles();
  if (popped) commitSheetUpdate();
  else commitSheetUpdate({ recalc: false, renderMount: true, renderChoices: "weapons" });
}
