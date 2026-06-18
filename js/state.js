const DEFAULT_STATE = {
  name: "",
  archetype: "",
  rank: 1,
  player: "",
  resolve: [false, false, false],
  advancesTrack: [false, false, false],
  grit: 0,
  fear: "",
  armor: 0,
  artData: "",
  wounds: [false, false, false],
  fatigue: [false, false, false],
  advances: 0,
  selectedHindrances: [],
  selectedEdges: [],
  money: "",
  moneyCents: "",
  powerCurrent: 0,
  selectedPowers: [],
  customSkills: {
    agility:  [{ name: "", die: "-" }, { name: "", die: "-" }],
    smarts:   [],
    spirit:   [],
    strength: [{ name: "", die: "-" }, { name: "", die: "-" }],
    vigor:    [{ name: "", die: "-" }, { name: "", die: "-" }],
  },
  attributes: {
    agility: "d4",
    smarts: "d4",
    spirit: "d4",
    strength: "d4",
    vigor: "d4",
  },
  skills: [],
  weapons: [],
  selectedArmor: [],
  gear: [{ name: "Шляпа", notes: "", price: "", weight: 0 }],
  dealDone: false,
  dealJoker: null,
  skillBudgetMax: 12,
  dealAssignment: null,
  hindranceSpent: 0,
  attrBonuses: { agility: 0, strength: 0, smarts: 0, spirit: 0, vigor: 0 },
  marshalMode: false,
  marshalEditTime: null,
  harrowed: false,
  extraPoints: 0,
  hindrancesDone: false,
  edgesDone: false,
  powersDone: false,
  advancePending: null,
  advanceChoices: [],
  advanceHistory: [],
  attrPoolBase: 0,
  moneyGrants: {},
  supNatAttr: null,
  horseActive: false,
  mount: null,
  selectedLoa: null,
  selectedDivineInterventions: [],
};

function makeDefaultSkills() {
  return TRAIT_GROUPS.flatMap((group) =>
    group.skills.map(([name, starred = false, description = ""]) => ({
      name,
      die: starred ? "d4" : "-",
      starred,
      description,
    })),
  );
}

const _OLD_STORAGE_KEYS = [
  "deadlands-character-sheet-v5",
  "deadlands-character-sheet-v4",
  "deadlands-character-sheet-v3",
  "deadlands-character-sheet-v2",
  "deadlands-character-sheet-v1",
  "deadlands-character-sheet",
];

function loadState() {
  try {
    let savedJson = localStorage.getItem(STORAGE_KEY);
    if (!savedJson) {
      for (const oldKey of _OLD_STORAGE_KEYS) {
        const old = localStorage.getItem(oldKey);
        if (old) { savedJson = old; break; }
      }
    }
    const saved = JSON.parse(savedJson);
    if (!saved) return structuredClone(DEFAULT_STATE);
    const s = mergeState(DEFAULT_STATE, saved);
    if (typeof s.rank === "string") {
      const idx = RANK_ORDER.indexOf(s.rank);
      s.rank = idx === -1 ? 1 : idx + 1;
    }
    if (!s.skills || s.skills.length === 0) s.skills = makeDefaultSkills();
    return s;
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return structuredClone(DEFAULT_STATE);
  }
}

function mergeState(base, saved) {
  const next = structuredClone(base);
  for (const [key, value] of Object.entries(saved)) {
    if (!(key in next)) continue;
    if (value && typeof value === "object" && !Array.isArray(value) && key in next) {
      next[key] = { ...next[key], ...value };
    } else {
      next[key] = value;
    }
  }
  return next;
}
