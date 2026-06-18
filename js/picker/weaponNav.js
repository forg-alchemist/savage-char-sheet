let _weaponPage = 0;

const WEAPON_GROUP_ICONS = {
  "Винтовки": "assets/Weapon/Rifle.png",
  "Карабины": "assets/Weapon/Carbine.png",
  "Ружья": "assets/Weapon/Gun.png",
  "Дерринджеры и пеппербоксы": "assets/Weapon/Derringer.png",
  "Оружие Гатлинга": "assets/Weapon/Gatling.png",
  "Прочее": "assets/Weapon/Other.png",
  "Взрывчатка": "assets/Weapon/Dynamite.png",
  "Холодное оружие": "assets/Weapon/Melee.png",
  "Боеприпасы": "assets/Weapon/Ammunition.png",
  "Револьверы ОД": "assets/Weapon/Revolver.png",
  "Револьверы ДД": "assets/Weapon/Revolver.png",
};

// Display order of weapon groups in the picker (pages + search-grouped list).
// Groups not listed here fall to the end, keeping catalog order among themselves.
const WEAPON_GROUP_ORDER = [
  "Винтовки", "Карабины", "Ружья", "Дерринджеры и пеппербоксы",
  "Револьверы ОД", "Револьверы ДД", "Оружие Гатлинга",
  "Холодное оружие", "Прочее", "Взрывчатка", "Боеприпасы",
];

function sortWeaponPickerGroups(arr) {
  return arr.sort((a, b) => {
    const ia = WEAPON_GROUP_ORDER.indexOf(a);
    const ib = WEAPON_GROUP_ORDER.indexOf(b);
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });
}

function showWeaponPickerPageNav(groups, page) {
  const nav = document.getElementById("picker-group-nav");
  if (!nav) return;
  nav.hidden = false;
  const label = document.getElementById("picker-nav-label");
  const icon = WEAPON_GROUP_ICONS[groups[page]];
  const iconL = icon ? `<img src="${icon}" class="picker-nav-icon picker-nav-icon--flip" alt="">` : "";
  const iconR = icon ? `<img src="${icon}" class="picker-nav-icon" alt="">` : "";
  label.innerHTML = `${iconL}<span class="picker-nav-text">${groups[page]}<span class="picker-nav-counter">${page + 1} / ${groups.length}</span></span>${iconR}`;
  const prev = document.getElementById("picker-nav-prev");
  const next = document.getElementById("picker-nav-next");
  prev.disabled = page === 0;
  next.disabled = page === groups.length - 1;
  prev.onclick = () => {
    _weaponPage = Math.max(0, _weaponPage - 1);
    const s = document.querySelector("#picker-modal .picker-search");
    renderPickerList("weapons", s ? s.value : "");
  };
  next.onclick = () => {
    _weaponPage = Math.min(groups.length - 1, _weaponPage + 1);
    const s = document.querySelector("#picker-modal .picker-search");
    renderPickerList("weapons", s ? s.value : "");
  };
}

function hideWeaponPickerNav() {
  const el = document.getElementById("picker-group-nav");
  if (el) el.hidden = true;
}

function prepareWeaponPickerItems(items, query) {
  if (query.trim()) {
    hideWeaponPickerNav();
    return { items, isSearch: true };
  }

  const groups = [];
  const grouped = new Map();
  for (const item of items) {
    const group = item.group ?? "Прочее";
    if (!grouped.has(group)) {
      grouped.set(group, []);
      groups.push(group);
    }
    grouped.get(group).push(item);
  }

  sortWeaponPickerGroups(groups);
  if (!groups.length) {
    hideWeaponPickerNav();
    return { items: [], isSearch: false };
  }

  _weaponPage = Math.max(0, Math.min(_weaponPage, groups.length - 1));
  showWeaponPickerPageNav(groups, _weaponPage);
  return { items: grouped.get(groups[_weaponPage]) || [], isSearch: false };
}

function appendWeaponPickerGroupedRows(list, weaponGroupRows, weaponGroupOrder) {
  sortWeaponPickerGroups(weaponGroupOrder);
  for (const group of weaponGroupOrder) {
    const header = document.createElement("div");
    header.className = "picker-group-header";
    header.textContent = group;
    list.append(header);
    for (const row of weaponGroupRows.get(group)) list.append(row);
  }
}
