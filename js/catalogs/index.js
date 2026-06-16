// Assign stable sequential IDs to every catalog item (mutates original arrays so
// ALL code that reads DEADLANDS_CATALOG_* automatically gets the id field).
(function () {
  function _addIds(items, prefix) {
    items.forEach((item, i) => {
      if (!item.id) {
        console.warn(`[catalog] ${prefix} entry at index ${i} ("${item.name}") has no id — assign one manually`);
        item.id = prefix + String(i).padStart(3, '0');
      }
    });
  }
  _addIds(window.DEADLANDS_CATALOG_HINDRANCES        || [], 'h');
  _addIds(window.DEADLANDS_CATALOG_EDGES             || [], 'e');
  _addIds(window.DEADLANDS_CATALOG_ARCHETYPE_EDGES   || [], 'ae');
  _addIds(window.DEADLANDS_CATALOG_POWERS            || [], 'p');
  _addIds(window.DEADLANDS_CATALOG_WEAPONS           || [], 'w');
  _addIds(window.DEADLANDS_CATALOG_ARMOR             || [], 'a');
  _addIds(window.DEADLANDS_CATALOG_MOUNT_GEAR        || [], 'mg');
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
  mountGear: window.DEADLANDS_CATALOG_MOUNT_GEAR || [],
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
