// Builds ID-keyed lookup structures from name-keyed game constants.
// Loads AFTER catalogs/index.js AND picker/constants.js + constants.js,
// so all catalog IDs and ARCANE_* constants are available here.
(function () {
  const _edges  = window.DEADLANDS_CATALOGS?.edges    || [];
  const _hinds  = window.DEADLANDS_CATALOG_HINDRANCES || [];
  const _powers = window.DEADLANDS_CATALOG_POWERS     || [];

  function _eid(name)   { return _edges.find(e => e.name === name)?.id; }
  function _hid(n, d)   { return _hinds.find(h => h.name === n && h.degree === d)?.id; }
  function _hids(name)  { return _hinds.filter(h => h.name === name).map(h => h.id); }
  function _pid(name)   { return _powers.find(p => p.name === name)?.id; }

  // ── Well-known edge IDs ─────────────────────────────────────────────────────
  window.WK_EDGES = {
    BUGAI:       _eid("Бугай"),
    BOGATSTVO:   _eid("Богатство"),
    BOGATSTVO_P: _eid("Богатство+"),
    PS:          _eid("Пункты силы"),
    SILY:        _eid("Новые силы"),
    MUZHESTVO:   _eid("Истинное мужество"),
    FASTFOOT:    _eid("Быстроногость"),
    MECHENNY:    _eid("Меченный"),
    SVERHNAT:    _eid("Сверхъестественная характеристика"),
    SHUAL:       _eid("Избранный Шуаль"),
  };

  // ── Hindrance ID sets ────────────────────────────────────────────────────────
  // HINDRANCE_ID_SETS["имя в нижнем регистре"] = Set<id> (все степени)
  window.HINDRANCE_ID_SETS = {};
  for (const [nameLow, ids] of Object.entries(window.HINDRANCE_IDS_BY_NAME || {})) {
    window.HINDRANCE_ID_SETS[nameLow] = new Set(ids);
  }

  window.WK_HINDRANCES = {
    KHROM_MINOR: _hid("Хромота", "Мелкий"),
    KHROM_MAJOR: _hid("Хромота", "Крупный"),
    POLNOTA:     new Set(_hids("Полнота")),
    KOROTYSHKA:  new Set(_hids("Коротышка")),
    SLEPOTA:     new Set(_hids("Слепота")),
  };

  // ── Well-known power IDs ─────────────────────────────────────────────────────
  window.WK_POWERS = {
    PRIZYV:   _pid("Призыв союзника"),
    SVYAZ_ML: _pid("Связь с миром духов: Призвать младшего духа"),
    SVYAZ_SR: _pid("Связь с миром духов: Призвать духа"),
  };

  // ── Arcane gift edge IDs ─────────────────────────────────────────────────────
  window.ARCANE_GIFT_IDS = new Set(
    Object.keys(ARCANE_GIFT_STATS || {}).map(_eid).filter(Boolean)
  );

  // ── ID-keyed ARCANE_GIFT_STATS ───────────────────────────────────────────────
  window.ARCANE_GIFT_STATS_BY_ID = {};
  for (const [name, stats] of Object.entries(ARCANE_GIFT_STATS || {})) {
    const id = _eid(name);
    if (id) window.ARCANE_GIFT_STATS_BY_ID[id] = stats;
  }

  // ── ID-keyed ARCANE_POWERS ───────────────────────────────────────────────────
  window.ARCANE_POWERS_BY_ID = {};
  for (const [edgeName, powerSet] of Object.entries(ARCANE_POWERS || {})) {
    const eid = _eid(edgeName);
    if (!eid) continue;
    const idSet = new Set();
    for (const pName of powerSet) {
      const pid = _pid(pName);
      if (pid) idSet.add(pid);
    }
    window.ARCANE_POWERS_BY_ID[eid] = idSet;
  }

  // ── ID-keyed ARCANE_FREE_POWERS ──────────────────────────────────────────────
  window.ARCANE_FREE_POWERS_BY_ID = {};
  for (const [edgeName, powerNames] of Object.entries(ARCANE_FREE_POWERS || {})) {
    const eid = _eid(edgeName);
    if (!eid) continue;
    window.ARCANE_FREE_POWERS_BY_ID[eid] = new Set(powerNames.map(_pid).filter(Boolean));
  }

  // ── Kung Fu upgrade map: sub-edge ID → heavenly sub-edge ID ─────────────────
  window.KUNGFU_UPGRADE_MAP = {};
  for (const e of _edges) {
    if (e.subOf !== KUNGFU_PARENT) continue;
    const suffix = e.name.slice((KUNGFU_PARENT + ': ').length);
    const hid = _eid(HEAVENLY_KUNGFU + ': ' + suffix);
    if (hid) window.KUNGFU_UPGRADE_MAP[e.id] = hid;
  }

  // ── Sub-power IDs (powers that are children of SUB_POWER_PARENTS) ────────────
  window.SUB_POWER_PARENT_IDS = new Set(
    (SUB_POWER_PARENTS || []).map(_pid).filter(Boolean)
  );
  window.SUB_POWER_IDS = new Set();
  for (const p of _powers) {
    if (p.hidden) continue;
    if ((SUB_POWER_PARENTS || []).some(parent => p.name.startsWith(parent + ': '))) {
      if (p.id) window.SUB_POWER_IDS.add(p.id);
    }
  }

  // ── Edge upgrade map: edge ID → ID of the edge it directly upgrades from ─────
  // Handles both "Edge+" (upgrades from "Edge") and "Edge++" (upgrades from "Edge+")
  window.EDGE_UPGRADES_FROM = {};
  for (const e of _edges) {
    if (!e.name.endsWith('+')) continue;
    const baseName = e.name.slice(0, -1);
    const baseEdge = _edges.find(x => x.name === baseName);
    if (baseEdge?.id) window.EDGE_UPGRADES_FROM[e.id] = baseEdge.id;
  }

  // ── Edge name (lowercase) → ID (for ID-based requirements checking) ──────────
  window.EDGE_ID_BY_NAME = {};
  for (const e of _edges) {
    window.EDGE_ID_BY_NAME[e.name.toLowerCase()] = e.id;
  }

  // ── Hindrance-blocks-edges: edgeId → Set<hindranceId> ───────────────────────
  const _BLOCK_DEF = {
    "Медлительность": ["Стремительность", "Хладнокровие"],
    "Невезение":      ["Везение"],
    "Полнота":        ["Бугай"],
    "Хромота":        ["Быстроногость"],
  };
  window.EDGE_BLOCKED_BY_HINDRANCE = {}; // edgeId → Set<hindranceId>
  for (const [hName, eNames] of Object.entries(_BLOCK_DEF)) {
    const hIdList = _hids(hName).filter(Boolean);
    for (const eName of eNames) {
      const eid = _eid(eName);
      if (!eid) continue;
      if (!window.EDGE_BLOCKED_BY_HINDRANCE[eid]) window.EDGE_BLOCKED_BY_HINDRANCE[eid] = new Set();
      for (const hid of hIdList) window.EDGE_BLOCKED_BY_HINDRANCE[eid].add(hid);
    }
  }

  // ── Spirit power IDs: name → id ─────────────────────────────────────────────
  // Spirit.js loads after this file, so we can't reference SPIRIT_SUMMON_ALL here.
  // Build the map lazily from the catalog; spirit.js will consume it.
  window.SPIRIT_POWER_ID_BY_NAME = {};
  for (const p of _powers) {
    if (p.name && p.name.startsWith("Связь с миром духов:")) {
      window.SPIRIT_POWER_ID_BY_NAME[p.name] = p.id;
    }
  }
})();
