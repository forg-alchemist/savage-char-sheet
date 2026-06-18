// Every catalog item must have a stable manual id. Missing ids are fatal:
// index-based ids would shift when catalog order changes and break saves.
(function () {
  function _assertStableIds(items, catalogName) {
    items.forEach((item, i) => {
      if (!item || !item.id) {
        const name = item && (item.name || item.key) ? (item.name || item.key) : "(no name)";
        throw new Error(`[catalog] ${catalogName} entry at index ${i} ("${name}") has no stable id`);
      }
    });
  }
  _assertStableIds(window.DEADLANDS_CATALOG_HINDRANCES        || [], 'hindrances');
  _assertStableIds(window.DEADLANDS_CATALOG_EDGES             || [], 'edges');
  _assertStableIds(window.DEADLANDS_CATALOG_ARCHETYPE_EDGES   || [], 'archetypeEdges');
  _assertStableIds(window.DEADLANDS_CATALOG_POWERS            || [], 'powers');
  _assertStableIds(window.DEADLANDS_CATALOG_WEAPONS           || [], 'weapons');
  _assertStableIds(window.DEADLANDS_CATALOG_ARMOR             || [], 'armor');
  _assertStableIds(window.DEADLANDS_CATALOG_GEAR              || [], 'gear');
  _assertStableIds(window.DEADLANDS_CATALOG_MOUNT_GEAR        || [], 'mountGear');
  _assertStableIds(window.DEADLANDS_CATALOG_MOUNT_ARMOR       || [], 'mountArmor');
})();

// Main catalog registry (used everywhere via CATALOGS.type)
window.DEADLANDS_CATALOGS = {
  hindrances: window.DEADLANDS_CATALOG_HINDRANCES,
  edges: [
    ...(window.DEADLANDS_CATALOG_EDGES           || []),
    ...(window.DEADLANDS_CATALOG_ARCHETYPE_EDGES || []),
  ],
  powers:  window.DEADLANDS_CATALOG_POWERS,
  weapons: window.DEADLANDS_CATALOG_WEAPONS,
  armor:   window.DEADLANDS_CATALOG_ARMOR,
  gear:    window.DEADLANDS_CATALOG_GEAR || [],
  mountGear: window.DEADLANDS_CATALOG_MOUNT_GEAR || [],
  mountArmor: window.DEADLANDS_CATALOG_MOUNT_ARMOR || [],
};

// O(1) lookup by ID for each catalog type
window.CATALOG_BY_ID = {};
for (const [type, items] of Object.entries(window.DEADLANDS_CATALOGS)) {
  const map = {};
  for (const item of (items || [])) {
    if (item.id) map[item.id] = item;
  }
  window.CATALOG_BY_ID[type] = map;
}

// Hindrance name (lowercase) → array of IDs
// Needed for requirements checks: same name exists in Мелкий and Крупный degrees.
window.HINDRANCE_IDS_BY_NAME = {};
for (const h of (window.DEADLANDS_CATALOG_HINDRANCES || [])) {
  const key = h.name.toLowerCase();
  if (!window.HINDRANCE_IDS_BY_NAME[key]) window.HINDRANCE_IDS_BY_NAME[key] = [];
  window.HINDRANCE_IDS_BY_NAME[key].push(h.id);
}
