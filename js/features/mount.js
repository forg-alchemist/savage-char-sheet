// ── Mount (Horse) ─────────────────────────────────────────────────────────────

const MOUNT_HINDRANCE_IDS = window.DEADLANDS_MOUNT_HINDRANCE_IDS || [];

const MOUNT_RUN_DICE = ["d2", "d4", "d6", "d8"];

const MOUNT_GEAR_ITEMS = window.DEADLANDS_MOUNT_GEAR_BY_KEY || {};

const MOUNT_VARIANTS = {
  regular: {
    kind: "regular",
    label: "Обычная лошадь",
    title: "Лошадь",
    icon: "assets/Horse/RegularHorse.png",
    priceCents: 15000,
    loadLimit: 90,
    summary: "Быстрая верховая лошадь для путешествий и груза.",
    lead: "Лошади быстры и могут переносить большие веса.",
    traits: "Ловкость d8, Смекалка d4 (ж), Характер d6, Сила d12, Выносливость d8",
    skills: "Атлетика d8, Внимание d6, Драка d4",
    indicators: { pace: 6, runDie: "d6", parry: 4, toughness: 8 },
    edges: "Быстроногость",
    features: [
      "<strong>Размер 2:</strong> обычная верховая лошадь весит около 500 кг.",
      "<strong>Удар копытами:</strong> по целям спереди или позади; Сила+d4.",
    ],
  },
  warhorse: {
    kind: "warhorse",
    label: "Боевой конь",
    title: "Боевой конь",
    icon: "assets/Horse/WarHorse.png",
    priceCents: 37500,
    loadLimit: 210,
    summary: "Крупный и отважный конь, не теряется в гуще сражения.",
    lead: "Боевые лошади крупны и отважны. Они не теряются в гуще сражения и всегда готовы ударить врага копытами.",
    traits: "Ловкость d6, Смекалка d4 (ж), Характер d6, Сила d12+2, Выносливость d10",
    skills: "Атлетика d6, Внимание d6, Драка d8",
    indicators: { pace: 4, runDie: "d6", parry: 6, toughness: 10 },
    edges: "Быстроногость",
    features: [
      "<strong>Размер 3:</strong> боевую подготовку проходят самые крупные и крепкие лошади.",
      "<strong>Удар копытами:</strong> по целям спереди или позади; Сила+d4.",
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

function openMountEquipmentModal() {
  if (!state.horseActive || !state.mount) {
    showToast("Сначала нужна лошадь");
    return;
  }
  document.querySelector(".mount-modal")?.remove();
  ensureMountEquipment();

  const options = getMountEquipmentPurchaseOptions();
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
      <button type="button" class="mount-dialog-close">×</button>
    </div>
    <div class="mount-options">
      ${options.map(o => `
        <button type="button" class="mount-option mount-option--${o.variant}${o.locked ? " mount-option--locked" : ""}" data-mount-equipment="${o.key}" ${o.locked ? "disabled" : ""}>
          <span class="mount-option-icon">${o.icon}</span>
          <span class="mount-option-body">
            <span class="mount-option-label">${o.label}</span>
            <span class="mount-option-note">${o.note}</span>
          </span>
          <span class="mount-option-price">${o.locked ? o.lockedLabel : formatMountPrice(o.priceCents)}</span>
        </button>`).join("")}
    </div>`;

  dialog.querySelector(".mount-dialog-close").addEventListener("click", closeMountModal);
  dialog.querySelectorAll("[data-mount-equipment]").forEach(btn => {
    btn.addEventListener("click", () => {
      const option = options.find(o => o.key === btn.dataset.mountEquipment);
      if (!option || option.locked) return;
      buyMountEquipment(option);
    });
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
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
  scheduleSave();
}

function toggleMount() {
  if (state.horseActive) {
    state.horseActive = false;
    state.mount = null;
    renderMount();
    scheduleSave();
  } else {
    openMountModal();
  }
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
  return {
    saddle: false,
    saddlebags: 0,
    rifleScabbard: false,
    bridle: false,
    stirrups: false,
    arcaneWard: false,
    ghostCoalLamp: false,
    armorId: null,
  };
}

function ensureMountEquipment() {
  if (!state.mount) return defaultMountEquipment();
  if (!state.mount.equipment || typeof state.mount.equipment !== "object") {
    state.mount.equipment = defaultMountEquipment();
  } else {
    state.mount.equipment = {
      ...defaultMountEquipment(),
      ...state.mount.equipment,
    };
  }
  state.mount.equipment.saddlebags = normalizeMountSaddlebagsCount(state.mount.equipment.saddlebags);
  return state.mount.equipment;
}

function normalizeMountSaddlebagsCount(value) {
  if (value === true) return 1;
  if (value === false || value === null || value === undefined) return 0;
  return Math.max(0, Math.min(2, parseInt(String(value), 10) || 0));
}

function getMountArmorCatalogItems() {
  const armor = CATALOGS.armor || window.DEADLANDS_CATALOG_ARMOR || [];
  return armor.filter(item => Array.isArray(item.sectors) && item.sectors.length === 0 && /лошад/i.test(item.name));
}

function mountOptionStat(text, mod = "") {
  return `<span class="mount-option-stat${mod ? ` ${mod}` : ""}">${text}</span>`;
}

function mountGearOptionNote(item, extra = "") {
  const parts = [item.note, mountOptionStat(`Вес ${formatMountNumber(item.weight)}`)];
  if (extra) parts.push(extra);
  return parts.join(" · ");
}

function mountArmorOptionNote(item, requirement) {
  return [
    mountOptionStat(`Броня +${item.bonus}`, "mount-option-stat--armor"),
    mountOptionStat(`МС ${requirement.value}`, "mount-option-stat--strength"),
    mountOptionStat(`Вес ${formatMountNumber(item.weight)}`),
  ].join(" · ");
}

function mountEquipmentStat(text, mod = "") {
  return `<span class="mount-equipment-stat${mod ? ` ${mod}` : ""}">${text}</span>`;
}

function getMountEquipmentPurchaseOptions() {
  const equipment = ensureMountEquipment();
  const armorOwned = Boolean(equipment.armorId);
  const baseOptions = [
    {
      key: "saddle",
      type: "gear",
      variant: "regular",
      icon: "▣",
      label: MOUNT_GEAR_ITEMS.saddle.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.saddle),
      priceCents: MOUNT_GEAR_ITEMS.saddle.priceCents,
      locked: equipment.saddle,
      lockedLabel: "Уже есть",
    },
    {
      key: "saddlebags",
      type: "gear",
      variant: "regular",
      icon: "▤",
      label: MOUNT_GEAR_ITEMS.saddlebags.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.saddlebags, "Можно до 2"),
      priceCents: MOUNT_GEAR_ITEMS.saddlebags.priceCents,
      locked: equipment.saddlebags >= 2,
      lockedLabel: "Максимум",
    },
    {
      key: "rifleScabbard",
      type: "gear",
      variant: "regular",
      icon: "▭",
      label: MOUNT_GEAR_ITEMS.rifleScabbard.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.rifleScabbard),
      priceCents: MOUNT_GEAR_ITEMS.rifleScabbard.priceCents,
      locked: equipment.rifleScabbard,
      lockedLabel: "Уже есть",
    },
    {
      key: "bridle",
      type: "gear",
      variant: "regular",
      icon: "▥",
      label: MOUNT_GEAR_ITEMS.bridle.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.bridle),
      priceCents: MOUNT_GEAR_ITEMS.bridle.priceCents,
      locked: equipment.bridle,
      lockedLabel: "Уже есть",
    },
    {
      key: "stirrups",
      type: "gear",
      variant: "regular",
      icon: "▧",
      label: MOUNT_GEAR_ITEMS.stirrups.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.stirrups),
      priceCents: MOUNT_GEAR_ITEMS.stirrups.priceCents,
      locked: equipment.stirrups,
      lockedLabel: "Уже есть",
    },
    {
      key: "arcaneWard",
      type: "gear",
      variant: "regular",
      icon: "✦",
      label: MOUNT_GEAR_ITEMS.arcaneWard.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.arcaneWard),
      priceCents: MOUNT_GEAR_ITEMS.arcaneWard.priceCents,
      locked: equipment.arcaneWard,
      lockedLabel: "Уже есть",
    },
    {
      key: "ghostCoalLamp",
      type: "gear",
      variant: "regular",
      icon: "◉",
      label: MOUNT_GEAR_ITEMS.ghostCoalLamp.name,
      note: mountGearOptionNote(MOUNT_GEAR_ITEMS.ghostCoalLamp),
      priceCents: MOUNT_GEAR_ITEMS.ghostCoalLamp.priceCents,
      locked: equipment.ghostCoalLamp,
      lockedLabel: "Уже есть",
    },
  ];
  const armorOptions = getMountArmorCatalogItems().map(item => {
    const requirement = getMountArmorRequirement(item, getMountDefectItems());
    return {
      key: `armor:${item.id}`,
      type: "armor",
      variant: "warhorse",
      icon: "▰",
      label: item.name,
      note: mountArmorOptionNote(item, requirement),
      priceCents: parseMountPriceCents(item.price),
      armorId: item.id,
      locked: armorOwned,
      lockedLabel: equipment.armorId === item.id ? "Уже есть" : "Броня уже есть",
    };
  });
  return [...baseOptions, ...armorOptions];
}

function buyMountEquipment(option) {
  if (!state.mount) return;
  const equipment = ensureMountEquipment();
  if (option.type === "gear" && equipment[option.key]) {
    if (option.key !== "saddlebags") {
      showToast("Уже куплено");
      return;
    }
    if (equipment.saddlebags >= 2) {
      showToast("Больше двух седельных сумок нельзя");
      return;
    }
  }
  if (option.type === "armor" && equipment.armorId) {
    showToast("У лошади уже есть броня");
    return;
  }
  if (!spendMoney(option.priceCents)) {
    showToast("Не хватает средств!");
    return;
  }
  if (option.type === "gear" && option.key === "saddlebags") equipment.saddlebags += 1;
  else if (option.type === "gear") equipment[option.key] = true;
  if (option.type === "armor") equipment.armorId = option.armorId;
  hydrateInputs();
  renderMount();
  scheduleSave();
  closeMountModal();
}

function removeMountEquipment(key) {
  if (!state.mount) return;
  const equipment = ensureMountEquipment();
  if (key === "saddle") equipment.saddle = false;
  if (key === "rifleScabbard") equipment.rifleScabbard = false;
  if (key === "bridle") equipment.bridle = false;
  if (key === "stirrups") equipment.stirrups = false;
  if (key === "arcaneWard") equipment.arcaneWard = false;
  if (key === "ghostCoalLamp") equipment.ghostCoalLamp = false;
  if (key === "saddlebags") equipment.saddlebags = Math.max(0, equipment.saddlebags - 1);
  if (key === "armor") equipment.armorId = null;
  renderMount();
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

function getMountEquipmentItems() {
  if (!state.mount) return [];
  const equipment = ensureMountEquipment();
  const items = [];
  if (equipment.saddle) items.push({ ...MOUNT_GEAR_ITEMS.saddle, key: "saddle" });
  if (equipment.rifleScabbard) items.push({ ...MOUNT_GEAR_ITEMS.rifleScabbard, key: "rifleScabbard" });
  if (equipment.bridle) items.push({ ...MOUNT_GEAR_ITEMS.bridle, key: "bridle" });
  if (equipment.stirrups) items.push({ ...MOUNT_GEAR_ITEMS.stirrups, key: "stirrups" });
  if (equipment.arcaneWard) items.push({ ...MOUNT_GEAR_ITEMS.arcaneWard, key: "arcaneWard" });
  if (equipment.ghostCoalLamp) items.push({ ...MOUNT_GEAR_ITEMS.ghostCoalLamp, key: "ghostCoalLamp" });
  if (equipment.saddlebags > 0) {
    items.push({
      ...MOUNT_GEAR_ITEMS.saddlebags,
      key: "saddlebags",
      count: equipment.saddlebags,
      weight: MOUNT_GEAR_ITEMS.saddlebags.weight * equipment.saddlebags,
      name: equipment.saddlebags > 1 ? `${MOUNT_GEAR_ITEMS.saddlebags.name} x${equipment.saddlebags}` : MOUNT_GEAR_ITEMS.saddlebags.name,
    });
  }
  if (equipment.armorId) {
    const armor = window.CATALOG_BY_ID?.armor?.[equipment.armorId]
      || (CATALOGS.armor || window.DEADLANDS_CATALOG_ARMOR || []).find(item => item.id === equipment.armorId);
    if (armor) items.push({ ...armor, kind: "armor", key: "armor", priceCents: parseMountPriceCents(armor.price) });
  }
  return items;
}

function getMountCurrentLoad() {
  return getMountEquipmentItems().reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
}

function getMountArmorRequirementStepBonus(defects) {
  return defects.some(defect => defect.name === "Полнота") ? 1 : 0;
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
  });
  const armorRequirementStepBonus = getMountArmorRequirementStepBonus(defects);
  if (armorRequirementStepBonus) {
    notes.push(`Полнота: требования брони +${armorRequirementStepBonus} ступень`);
  }
  return {
    base,
    value: base + bonus,
    notes,
    armorRequirementStepBonus,
  };
}

function getMountArmorRequirement(armor, defects) {
  const baseIdx = mountArmorDieIndex(armor?.minStr);
  const stepBonus = getMountArmorRequirementStepBonus(defects);
  if (baseIdx < 0) return { base: armor?.minStr || "—", value: armor?.minStr || "—", stepBonus };
  const idx = Math.max(0, Math.min(DICE_VALUES.length - 1, baseIdx + stepBonus));
  return {
    base: `d${DICE_VALUES[baseIdx]}`,
    value: `d${DICE_VALUES[idx]}`,
    stepBonus,
  };
}

function mountArmorDieIndex(value) {
  const match = String(value || "").match(/d(\d+)/i);
  return match ? DICE_VALUES.indexOf(Number(match[1])) : -1;
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
  });

  const armor = getMountEquipmentItems().find(item => item.kind === "armor");
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

    const main = document.createElement("div");
    main.className = "mount-equipment-main";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const meta = document.createElement("span");
    if (item.kind === "armor") {
      const requirement = getMountArmorRequirement(item, defects);
      meta.innerHTML = [
        mountEquipmentStat(`Броня +${item.bonus}`, "mount-equipment-stat--armor"),
        mountEquipmentStat(`МС ${requirement.value}`, "mount-equipment-stat--strength"),
        mountEquipmentStat(`Вес ${formatMountNumber(Number(item.weight) || 0)}`),
      ].join(" · ");
      if (requirement.stepBonus) meta.title = `База ${requirement.base}; Полнота +${requirement.stepBonus} ступень`;
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

function getMountHindrancePenalty(defect) {
  return defect.penaltyMount || defect.penalty;
}

function getMountHindranceBonus(defect) {
  return defect.bonusMount || defect.bonus;
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

  const traits = document.querySelector('[data-output="mountTraits"]');
  if (traits) traits.textContent = definition.traits;

  const skills = document.querySelector('[data-output="mountSkills"]');
  if (skills) skills.textContent = definition.skills;

  const defects = getMountDefectItems();
  renderMountIndicators(definition, defects);
  renderMountEquipment(defects);

  const edges = document.querySelector('[data-output="mountEdges"]');
  if (edges) edges.textContent = definition.edges;

  const features = document.querySelector('[data-output="mountFeatures"]');
  if (features) {
    features.replaceChildren();
    definition.features.forEach(text => {
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
}
