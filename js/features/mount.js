// ── Mount (Horse) ─────────────────────────────────────────────────────────────

const MOUNT_HINDRANCE_IDS = window.DEADLANDS_MOUNT_HINDRANCE_IDS || [];

const MOUNT_RUN_DICE = ["d2", "d4", "d6", "d8"];
const MOUNT_BLINDNESS_HINDRANCE_ID = "h085";
const MOUNT_AGING_HINDRANCE_ID = "h086";
const MOUNT_BLINDNESS_EDGE_IDS = [
  "e004", // Бдительность
  "e009", // Блок
  "e014", // Боевая закалка
  "e019", // Бугай
  "e029", // Грозный вид
  "e035", // Егерь
  "e036", // Железная воля
  "e045", // Как на собаке
  "e046", // Контратака
  "e080", // Смелость
  "e082", // Стальная челюсть
  "e089", // Тяжеловес
];

const MOUNT_GEAR_ITEMS = window.DEADLANDS_MOUNT_GEAR_BY_KEY || {};
const MOUNT_GEAR_CATALOG = window.DEADLANDS_CATALOG_MOUNT_GEAR || [];
const MOUNT_ARMOR_CATALOG = window.DEADLANDS_CATALOG_MOUNT_ARMOR || [];

const MOUNT_EQUIPMENT_GROUPS = [
  { key: "common", label: "Общие", icon: "▣" },
  { key: "armor", label: "Броня", icon: "▰" },
  { key: "mystic", label: "Мистические", icon: "✦" },
];

const MOUNT_VARIANTS = {
  regular: {
    kind: "regular",
    label: "Обычная лошадь",
    title: "Лошадь",
    icon: "assets/Horse/RegularHorse.png",
    priceCents: 15000,
    loadLimit: 90,
    summary: "Быстрая верховая лошадь для путешествий и груза",
    lead: "Лошади быстры и могут переносить большие веса",
    traits: "Ловкость d8, Смекалка d4 (ж), Характер d6, Сила d12, Выносливость d8",
    skills: "Атлетика d8, Внимание d6, Драка d4",
    indicators: { pace: 6, runDie: "d6", parry: 4, toughness: 8 },
    edges: "Быстроногость",
    features: [
      "<strong>Размер 2:</strong> обычная верховая лошадь весит около 500 кг",
      "<strong>Удар копытами:</strong> по целям спереди или позади; Сила+d4",
    ],
  },
  warhorse: {
    kind: "warhorse",
    label: "Боевой конь",
    title: "Боевой конь",
    icon: "assets/Horse/WarHorse.png",
    priceCents: 37500,
    loadLimit: 210,
    summary: "Крупный и отважный конь, не теряется в гуще сражения",
    lead: "Боевые лошади крупны и отважны. Они не теряются в гуще сражения и всегда готовы ударить врага копытами",
    traits: "Ловкость d6, Смекалка d4 (ж), Характер d6, Сила d12+2, Выносливость d10",
    skills: "Атлетика d6, Внимание d6, Драка d8",
    indicators: { pace: 4, runDie: "d6", parry: 6, toughness: 10 },
    edges: "Быстроногость",
    features: [
      "<strong>Размер 3:</strong> боевую подготовку проходят самые крупные и крепкие лошади",
      "<strong>Удар копытами:</strong> по целям спереди или позади; Сила+d4",
    ],
  },
};

const MOUNT_ACQUISITION_OPTIONS = [
  {
    source: "buy",
    label: "Купить",
    priceFactor: 1,
    note: "Полная цена, без изъянов",
    icon: "💰",
    variant: "buy",
  },
  {
    source: "half",
    label: "Купить за полцены",
    priceFactor: 0.5,
    note: "1 крупный или 2 мелких случайных изъяна",
    icon: "🎲",
    variant: "half",
  },
  {
    source: "found",
    label: "Найдена",
    priceFactor: 0,
    note: "Найдена, подарена или выиграна",
    icon: "🌾",
    variant: "found",
  },
];

function openMountModal() {
  document.querySelector(".mount-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "mount-modal";

  const backdrop = document.createElement("div");
  backdrop.className = "mount-backdrop";
  backdrop.addEventListener("click", closeMountModal);

  const dialog = document.createElement("div");
  dialog.className = "mount-dialog mount-dialog--variant paper";
  dialog.innerHTML = `
    <div class="mount-dialog-header">
      <img src="assets/Horse/Horse.png" class="mount-dialog-horse" alt="">
      <div class="mount-dialog-titles">
        <div class="mount-dialog-eyebrow">Покупка</div>
        <h3 class="mount-title">Вариант лошади</h3>
      </div>
      <span class="mount-money-badge" data-mount-money></span>
      <button type="button" class="mount-dialog-close">×</button>
    </div>
    <div class="mount-options mount-options--variants">
      ${Object.values(MOUNT_VARIANTS).map(v => `
        <button type="button" class="mount-option mount-option--variant mount-option--${v.kind}" data-mount-kind="${v.kind}">
          <span class="mount-option-icon mount-option-icon--image"><img src="${v.icon}" alt=""></span>
          <span class="mount-option-body">
            <span class="mount-option-label">${v.label}</span>
            <span class="mount-option-note">${v.summary}</span>
          </span>
          <span class="mount-option-price">${formatMountPrice(v.priceCents)}</span>
        </button>`).join("")}
    </div>`;

  dialog.querySelector(".mount-dialog-close").addEventListener("click", closeMountModal);
  updateMountMoneyBadges(dialog);
  dialog.querySelectorAll("[data-mount-kind]").forEach(btn => {
    btn.addEventListener("click", () => {
      openMountAcquisitionModal(btn.dataset.mountKind);
    });
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
}

function openMountAcquisitionModal(kind) {
  const definition = getMountDefinition(kind);
  document.querySelector(".mount-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "mount-modal";

  const backdrop = document.createElement("div");
  backdrop.className = "mount-backdrop";
  backdrop.addEventListener("click", closeMountModal);

  const dialog = document.createElement("div");
  dialog.className = "mount-dialog paper";
  dialog.innerHTML = `
    <div class="mount-dialog-header">
      <img src="assets/Horse/Horse.png" class="mount-dialog-horse" alt="">
      <div class="mount-dialog-titles">
        <div class="mount-dialog-eyebrow">Снаряжение</div>
        <h3 class="mount-title">${definition.label}</h3>
      </div>
      <span class="mount-money-badge" data-mount-money></span>
      <button type="button" class="mount-dialog-close">×</button>
    </div>
    <div class="mount-options">
      ${MOUNT_ACQUISITION_OPTIONS.map(o => `
        <button type="button" class="mount-option mount-option--${o.variant}" data-mount-source="${o.source}">
          <span class="mount-option-icon">${o.icon}</span>
          <span class="mount-option-body">
            <span class="mount-option-label">${o.label}</span>
            <span class="mount-option-note">${o.note}</span>
          </span>
          <span class="mount-option-price">${formatMountPrice(getMountOptionPriceCents(kind, o))}</span>
        </button>`).join("")}
    </div>`;

  dialog.querySelector(".mount-dialog-close").addEventListener("click", closeMountModal);
  updateMountMoneyBadges(dialog);
  dialog.querySelectorAll("[data-mount-source]").forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = MOUNT_ACQUISITION_OPTIONS.find(o => o.source === btn.dataset.mountSource);
      if (opt) activateMount(kind, opt);
    });
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
}

function closeMountModal() {
  document.querySelector(".mount-modal")?.remove();
}

function updateMountMoneyBadges(root = document) {
  root.querySelectorAll("[data-mount-money]").forEach(badge => {
    badge.textContent = `ДЕНЬГИ: ${formatMountMoney(getMountMoneyCents())}`;
  });
}

function openMountEquipmentModal() {
  if (!state.horseActive || !state.mount) {
    showToast("Сначала нужна лошадь");
    return;
  }
  document.querySelector(".mount-modal")?.remove();
  ensureMountEquipment();
  let groupIndex = 0;

  const modal = document.createElement("div");
  modal.className = "mount-modal";

  const backdrop = document.createElement("div");
  backdrop.className = "mount-backdrop";
  backdrop.addEventListener("click", closeMountModal);

  const dialog = document.createElement("div");
  dialog.className = "mount-dialog mount-dialog--equipment paper";
  dialog.innerHTML = `
    <div class="mount-dialog-header">
      <img src="assets/Horse/Horse.png" class="mount-dialog-horse" alt="">
      <div class="mount-dialog-titles">
        <div class="mount-dialog-eyebrow">Покупка</div>
        <h3 class="mount-title">Снаряжение лошади</h3>
      </div>
      <span class="mount-money-badge" data-mount-money></span>
      <button type="button" class="mount-dialog-close">×</button>
    </div>
    <div class="mount-equipment-pager">
      <button type="button" class="mount-equipment-page-btn" data-mount-equipment-page="prev" aria-label="Предыдущая категория">‹</button>
      <div class="mount-equipment-page-label" data-mount-equipment-category></div>
      <button type="button" class="mount-equipment-page-btn" data-mount-equipment-page="next" aria-label="Следующая категория">›</button>
    </div>
    <div class="mount-options mount-options--equipment" data-mount-equipment-options>
    </div>`;

  dialog.querySelector(".mount-dialog-close").addEventListener("click", closeMountModal);

  const optionsRoot = dialog.querySelector("[data-mount-equipment-options]");
  const categoryLabel = dialog.querySelector("[data-mount-equipment-category]");
  const prevBtn = dialog.querySelector('[data-mount-equipment-page="prev"]');
  const nextBtn = dialog.querySelector('[data-mount-equipment-page="next"]');

  const renderGroup = () => {
    const options = getMountEquipmentPurchaseOptions();
    const optionsByKey = new Map(options.map(option => [option.key, option]));
    const groups = MOUNT_EQUIPMENT_GROUPS.map(group => ({
      ...group,
      options: options.filter(option => option.variant === group.key),
    }));
    groupIndex = Math.max(0, Math.min(groupIndex, groups.length - 1));
    const group = groups[groupIndex];
    updateMountMoneyBadges(dialog);
    categoryLabel.className = `mount-equipment-page-label mount-equipment-page-label--${group.key}`;
    categoryLabel.innerHTML = `
      <span class="mount-equipment-page-icon mount-equipment-page-icon--${group.key}">${group.icon}</span>
      <span class="mount-equipment-page-text">${group.label}</span>`;
    prevBtn.disabled = groupIndex === 0;
    nextBtn.disabled = groupIndex === groups.length - 1;
    optionsRoot.innerHTML = group.options.length
      ? group.options.map(renderMountEquipmentPurchaseOption).join("")
      : `<div class="mount-option-empty">Нет предметов в категории</div>`;
    optionsRoot.querySelectorAll("[data-mount-equipment]").forEach(btn => {
      btn.addEventListener("click", () => {
        const option = optionsByKey.get(btn.dataset.mountEquipment);
        if (!option || option.locked) return;
        if (buyMountEquipment(option)) renderGroup();
      });
    });
  };

  prevBtn.addEventListener("click", () => {
    if (groupIndex <= 0) return;
    groupIndex -= 1;
    renderGroup();
  });
  nextBtn.addEventListener("click", () => {
    if (groupIndex >= MOUNT_EQUIPMENT_GROUPS.length - 1) return;
    groupIndex += 1;
    renderGroup();
  });

  renderGroup();

  modal.append(backdrop, dialog);
  document.body.append(modal);
}

function renderMountEquipmentPurchaseOption(o) {
  return `
    <button type="button" class="mount-option mount-option--${o.variant}${o.locked ? " mount-option--locked" : ""}" data-mount-equipment="${o.key}" ${o.locked ? "disabled" : ""}>
      <span class="mount-option-icon">${o.icon}</span>
      <span class="mount-option-body">
        <span class="mount-option-label">${o.label}</span>
        <span class="mount-option-note">${o.note}</span>
      </span>
      <span class="mount-option-price">${o.locked ? o.lockedLabel : formatMountPrice(o.priceCents)}</span>
    </button>`;
}

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

function parseMountPriceCents(priceStr) {
  if (!priceStr || priceStr === "—") return 0;
  const num = parseFloat(String(priceStr).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : Math.round(num * 100);
}

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
  hydrateInputs();
  renderMount();
  refreshMountWeaponControls();
  scheduleSave();
}

function toggleMount() {
  if (state.horseActive) {
    state.horseActive = false;
    state.mount = null;
    // Снятая лошадь возвращает все винтовки из чехлов персонажу
    let changed = false;
    (state.weapons || []).forEach(w => { if (w._stashed) { w._stashed = false; changed = true; } });
    renderMount();
    if (changed) recalculate();
    else refreshMountWeaponControls();
    scheduleSave();
  } else {
    openMountModal();
  }
}

// ── Седельные сумки: убрать/вытащить винтовку (вес переносится на лошадь) ──
function getRifleSlotCount() {
  if (!(state.horseActive && state.mount)) return 0;
  const equipment = ensureMountEquipment();
  const saddlebags = MOUNT_GEAR_ITEMS["saddlebags"];
  const legacyScabbard = MOUNT_GEAR_ITEMS["rifleScabbard"];
  const saddlebagSlots = saddlebags ? getMountGearOwnedCount(equipment, saddlebags) : 0;
  const legacySlots = legacyScabbard ? getMountGearOwnedCount(equipment, legacyScabbard) : 0;
  return saddlebagSlots || legacySlots;
}

function getScabbardCount() {
  return getRifleSlotCount();
}

// В чехол убираются длинноствольные: винтовки, ружья (дробовики) и карабины
const SCABBARD_WEAPON_GROUPS = new Set(["Винтовки", "Ружья", "Карабины"]);
function isRifleWeapon(weapon) {
  if (!weapon) return false;
  const def = (weapon.id && window.CATALOG_BY_ID?.weapons?.[weapon.id]) || weapon;
  return SCABBARD_WEAPON_GROUPS.has(def.group || weapon.group);
}

function getStashedRifles() {
  return (state.weapons || []).filter(w => w._stashed);
}

function canStashRifle() {
  return getStashedRifles().length < getRifleSlotCount();
}

function refreshMountWeaponControls() {
  if (typeof renderChoiceList === "function") renderChoiceList("weapons");
}

function stashRifle(weapon) {
  if (!weapon || !isRifleWeapon(weapon)) return;
  if (!canStashRifle()) { showToast("Нет свободной седельной сумки для винтовки"); return; }
  weapon._stashed = true;
  renderChoiceList("weapons");
  renderMount();
  recalculate();
  scheduleSave();
}

function unstashRifle(weapon) {
  if (!weapon) return;
  weapon._stashed = false;
  renderChoiceList("weapons");
  renderMount();
  recalculate();
  scheduleSave();
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

function spendMoney(amountCents) {
  const dollars = parseInt(String(state.money || ""), 10) || 0;
  const cents   = parseInt(String(state.moneyCents || ""), 10) || 0;
  const total   = dollars * 100 + cents;
  if (total < amountCents) return false;
  const remaining    = total - amountCents;
  state.money        = String(Math.floor(remaining / 100));
  state.moneyCents   = String(remaining % 100);
  const mEl = document.querySelector('[data-bind="money"]');
  const cEl = document.querySelector('[data-bind="moneyCents"]');
  if (mEl) mEl.value = state.money;
  if (cEl) cEl.value = state.moneyCents;
  return true;
}

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

function getMountMoneyCents() {
  const dollars = parseInt(String(state.money || ""), 10) || 0;
  const cents   = parseInt(String(state.moneyCents || ""), 10) || 0;
  return dollars * 100 + cents;
}

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
      priceCents: parseMountPriceCents(item.price),
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
  hydrateInputs();
  renderMount();
  refreshMountWeaponControls();
  scheduleSave();
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
    renderChoiceList("weapons");
    renderMount();
    recalculate();
    scheduleSave();
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
  renderMount();
  if (popped) recalculate();
  else refreshMountWeaponControls();
  scheduleSave();
}

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
  return defects.some(defect => defect.id === MOUNT_BLINDNESS_HINDRANCE_ID || defect.name === "Слепота");
}

function hasMountAging(defects = getMountDefectItems()) {
  return defects.some(defect => defect.id === MOUNT_AGING_HINDRANCE_ID || defect.name === "Старость");
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
    if (prevKey !== "[]" && typeof scheduleSave === "function") scheduleSave();
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
  if (prevKey !== JSON.stringify(ids) && typeof scheduleSave === "function") scheduleSave();
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
    if (armor) items.push({ ...armor, kind: "armor", group: "armor", key: "armor", priceCents: parseMountPriceCents(armor.price) });
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

function getMountLoadStats(definition, defects) {
  const base = definition.loadLimit || MOUNT_VARIANTS.regular.loadLimit;
  const notes = [];
  let bonus = 0;
  defects.forEach(defect => {
    if (defect.name === "Полнота") {
      bonus += 60;
      notes.push("Полнота: Комфортная нагрузка +60");
    }
    if (defect.name === "Коротышка") {
      bonus -= 60;
      notes.push("Коротышка: Комфортная нагрузка -60");
    }
  });
  if (hasMountEdge("e019", defects)) {
    bonus += 60;
    notes.push("Бугай: Комфортная нагрузка +60");
  }
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
    if (defect.name === "Хромота") {
      const pacePenalty = defect.degree === "Крупный" ? 2 : 1;
      add("pace", -pacePenalty, `Хромота: Шаг -${pacePenalty}`);
      add("runDie", -1, "Хромота: Бег -1 ступень");
    }
    if (defect.name === "Копуша") {
      add("pace", -1, "Копуша: Шаг -1");
    }
    if (defect.name === "Полнота") {
      add("pace", -1, "Полнота: Шаг -1");
      add("runDie", -1, "Полнота: Бег -1 ступень");
      add("toughness", 1, "Полнота: Стойкость +1");
    }
    if (defect.name === "Коротышка") {
      add("toughness", -1, "Коротышка: Стойкость -1");
    }
    if (defect.name === "Старость") {
      add("pace", -1, "Старость: Шаг -1");
    }
  });
  const mountEdges = getMountEdgeItems(defects);
  if (mountEdges.some(edge => edge.id === "e009")) {
    add("parry", 1, "Блок: Защита +1");
  }
  if (mountEdges.some(edge => edge.id === "e089")) {
    add("toughness", 1, "Тяжеловес: Стойкость +1");
  }

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

function renderMountIndicators(definition, defects) {
  const calculated = getMountIndicators(definition, defects);
  const labels = {
    pace: "Шаг",
    runDie: "Бег",
    parry: "Защита",
    toughness: "Стойкость",
  };
  const outputs = {
    pace: "mountPace",
    runDie: "mountRunDie",
    parry: "mountParry",
    toughness: "mountToughness",
  };

  Object.keys(labels).forEach(key => {
    const tile = document.querySelector(`[data-mount-indicator="${key}"]`);
    const output = document.querySelector(`[data-output="${outputs[key]}"]`);
    const value = calculated.values[key];
    const base = calculated.base[key];
    const modified = value !== base;
    if (output) output.textContent = value;
    if (tile) {
      tile.classList.toggle("horse-indicator--modified", modified);
      const suffix = calculated.notes[key].length
        ? ` Модификаторы: ${calculated.notes[key].join("; ")}.`
        : " Модификаторов нет.";
      tile.dataset.tooltip = `${labels[key]}: ${value}. База: ${base}.${suffix}`;
    }
  });
}

function renderMountEquipment(defects) {
  const root = document.querySelector('[data-output="mountEquipmentList"]');
  if (!root) return;
  root.replaceChildren();
  const items = getMountEquipmentItems();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "mount-equipment-empty";
    empty.textContent = "Нет снаряжения";
    root.append(empty);
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "mount-equipment-row";
    row.classList.add(`mount-equipment-row--${getMountEquipmentGroup(item)}`);

    const main = document.createElement("div");
    main.className = "mount-equipment-main";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const meta = document.createElement("span");
    if (item.kind === "armor") {
      meta.innerHTML = mountArmorEquipmentNote(item);
    } else {
      meta.innerHTML = mountEquipmentStat(`Вес ${formatMountNumber(Number(item.weight) || 0)}`);
    }
    main.append(name, meta);

    const note = item.note || item.notes;
    if (note && note !== "—") {
      const desc = document.createElement("p");
      desc.className = "mount-equipment-desc";
      desc.textContent = note;
      main.append(desc);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => removeMountEquipment(item.key));

    row.append(main, remove);
    root.append(row);
  });
}

function formatMountNumber(value) {
  return typeof trimNumber === "function" ? trimNumber(value) : String(Math.round(Number(value || 0) * 10) / 10);
}

function getMountFeatureTexts(definition, defects = getMountDefectItems()) {
  const features = [...(definition.features || [])];
  if (!(state.horseActive && state.mount)) return features;
  const spurs = MOUNT_GEAR_ITEMS["horseSpurs"];
  const hasSpurs = spurs && getMountGearOwnedCount(ensureMountEquipment(), spurs) > 0;
  const hasHeavyweight = hasMountEdge("e089", defects);
  const hoofDie = hasHeavyweight ? (hasSpurs ? "d8" : "d6") : (hasSpurs ? "d6" : "d4");
  return features.map(text => String(text).replace(/Сила\+d[468]/g, `Сила+${hoofDie}`));
}

function getMountTraitText(definition, defects) {
  let text = definition.traits || "";
  if (!hasMountAging(defects)) return text;
  if (definition.kind === "warhorse") {
    return text
      .replace("Сила d12+2", "Сила d12+1")
      .replace("Выносливость d10", "Выносливость d8");
  }
  return text
    .replace("Сила d12", "Сила d12-1")
    .replace("Выносливость d8", "Выносливость d8-1");
}

function getMountHindrancePenalty(defect) {
  return defect.penaltyMount || defect.penalty;
}

function getMountHindranceBonus(defect) {
  return defect.bonusMount || defect.bonus;
}

function getMountEdgeText(definition, defects) {
  const edgeNames = getMountEdgeItems(defects).map(edge => edge.name);
  return [definition.edges, ...edgeNames].filter(Boolean).join(", ");
}

function getMountHindranceDescription(defect) {
  return defect.descriptionMount || defect.description || "";
}

function _pickRandomUnique(items, count) {
  const pool = [...items];
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

function renderMount() {
  if (state.horseActive && !state.mount) {
    state.mount = { type: "horse", kind: "regular", source: "found", defectIds: [] };
  } else if (state.mount && !state.mount.kind) {
    state.mount.kind = "regular";
  }

  const active = !!state.horseActive;
  const definition = getMountDefinition(state.mount?.kind);
  document.querySelectorAll(".horse-token").forEach(token => {
    token.classList.toggle("active", active);
  });

  const panel = document.querySelector(".horse-panel");
  panel?.classList.toggle("horse-panel--active", active);
  panel?.classList.toggle("horse-panel--inactive", !active);

  const actionLabel = document.querySelector('[data-output="mountActionLabel"]');
  if (actionLabel) actionLabel.textContent = active ? "Убрать лошадь" : "Купить лошадь";

  const mountTitle = document.querySelector('[data-output="mountTitle"]');
  if (mountTitle) mountTitle.textContent = active ? definition.title : MOUNT_VARIANTS.regular.title;

  const lead = document.querySelector('[data-output="mountLead"]');
  if (lead) lead.textContent = active ? definition.lead : MOUNT_VARIANTS.regular.lead;

  const defects = getMountDefectItems();

  const traits = document.querySelector('[data-output="mountTraits"]');
  if (traits) traits.textContent = getMountTraitText(definition, defects);

  const skills = document.querySelector('[data-output="mountSkills"]');
  if (skills) skills.textContent = definition.skills;

  renderMountIndicators(definition, defects);
  renderMountEquipment(defects);

  const edges = document.querySelector('[data-output="mountEdges"]');
  if (edges) edges.textContent = getMountEdgeText(definition, defects);

  const features = document.querySelector('[data-output="mountFeatures"]');
  if (features) {
    features.replaceChildren();
    getMountFeatureTexts(definition, defects).forEach(text => {
      const li = document.createElement("li");
      li.innerHTML = text;
      features.append(li);
    });
  }

  const stateLabel = document.querySelector('[data-output="mountState"]');
  if (stateLabel) {
    const sourceLabels = {
      buy: "Куплена",
      half: "Куплена за полцены",
      found: "Найдена",
    };
    stateLabel.textContent = active ? (sourceLabels[state.mount?.source] || "Лошадь есть") : "Нет лошади";
  }

  const loadStats = getMountLoadStats(definition, defects);
  const currentLoad = getMountCurrentLoad();
  const weightTotalEl = document.querySelector('[data-output="mountWeightTotal"]');
  if (weightTotalEl) {
    renderLoadMeter(weightTotalEl, currentLoad, loadStats.value);
    weightTotalEl.dataset.tooltip = loadStats.notes.length
      ? `${weightTotalEl.dataset.tooltip} База: ${formatMountNumber(loadStats.base)}. ${loadStats.notes.join("; ")}.`
      : `${weightTotalEl.dataset.tooltip} Модификаторов комфортной нагрузки нет.`;
  }

  const card = document.querySelector('[data-output="mountStatus"]');
  if (!card) return;

  card.hidden = !active || defects.length === 0;
  card.replaceChildren();
  if (card.hidden) return;

  const title = document.createElement("div");
  title.className = "mount-card-title";
  title.textContent = "Изъяны";

  const list = document.createElement("div");
  list.className = "mount-hindrance-list";
  defects.forEach(defect => {
    const item = document.createElement("article");
    item.className = "choice-card mount-hindrance-card";

    const row = document.createElement("div");
    row.className = "hindrance-name-row";
    const name = document.createElement("strong");
    name.textContent = defect.name;
    const badge = document.createElement("span");
    badge.className = "degree-badge " + (defect.degree === "Крупный" ? "major" : "minor");
    badge.textContent = defect.degree;
    row.append(name, badge);
    item.append(row);

    const penalty = getMountHindrancePenalty(defect);
    if (penalty && penalty !== "-") {
      const penaltyEl = document.createElement("div");
      penaltyEl.className = "picker-item-penalty";
      penaltyEl.textContent = `Штраф: ${penalty}`;
      item.append(penaltyEl);
    }
    const bonus = getMountHindranceBonus(defect);
    if (bonus && bonus !== "-") {
      const bonusEl = document.createElement("div");
      bonusEl.className = "picker-item-bonus";
      bonusEl.textContent = `Бонус: ${bonus}`;
      item.append(bonusEl);
    }

    const description = document.createElement("p");
    description.innerHTML = getMountHindranceDescription(defect);
    item.append(description);
    list.append(item);
  });
  card.append(title, list);

  const bonusEdges = hasMountBlindness(defects) ? getMountEdgeItems(defects) : [];
  if (bonusEdges.length > 0) {
    const edgeTitle = document.createElement("div");
    edgeTitle.className = "mount-card-title";
    edgeTitle.textContent = "Черта";

    const edgeList = document.createElement("div");
    edgeList.className = "mount-hindrance-list";
    bonusEdges.forEach(edge => {
      const item = document.createElement("article");
      item.className = "choice-card mount-edge-card";

      const row = document.createElement("div");
      row.className = "hindrance-name-row";
      const name = document.createElement("strong");
      name.textContent = edge.name;
      const badge = document.createElement("span");
      badge.className = "edge-rank-badge";
      badge.textContent = edge.rank || "Черта";
      row.append(name, badge);
      item.append(row);

      const description = document.createElement("p");
      description.innerHTML = edge.effect || "";
      item.append(description);
      edgeList.append(item);
    });

    card.append(edgeTitle, edgeList);
  }
}
