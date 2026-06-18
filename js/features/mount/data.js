// ── Mount (Horse) ─────────────────────────────────────────────────────────────

const MOUNT_HINDRANCE_IDS = window.DEADLANDS_MOUNT_HINDRANCE_IDS || [];

const MOUNT_RUN_DICE = ["d2", "d4", "d6", "d8"];
const MOUNT_BLINDNESS_HINDRANCE_ID = "h085";
const MOUNT_BLINDNESS_EDGE_IDS = window.DEADLANDS_MOUNT_BLINDNESS_EDGE_IDS || [];
const MOUNT_HINDRANCE_EFFECTS = window.DEADLANDS_MOUNT_HINDRANCE_EFFECTS || {};
const MOUNT_EDGE_EFFECTS = window.DEADLANDS_MOUNT_EDGE_EFFECTS || {};

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
