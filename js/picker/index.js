function openPickerModal(type) {
  const modal = document.getElementById("picker-modal");
  const titles = { hindrances: "Изъяны", edges: "Черты и повышения", powers: "Силы", weapons: "Оружие", armor: "Броня", gear: "Снаряжение" };
  modal.querySelector(".picker-title").textContent = titles[type] || type;

  const footer = document.getElementById("picker-footer");
  const finishBtn = footer?.querySelector(".picker-finish-btn");
  if (footer && finishBtn) {
    const hasFinish = type === "hindrances" || type === "edges" || type === "powers";
    footer.hidden = !hasFinish;
    if (hasFinish) {
      if (type === "hindrances") finishBtn.dataset.action = "finishHindrances";
      else if (type === "edges") finishBtn.dataset.action = "finishEdges";
      else finishBtn.dataset.action = "finishPowers";
    }
  }

  const badge = document.getElementById("picker-cost-badge");
  if (badge) {
    badge.hidden = type !== "edges";
    if (type === "edges") updateEdgeCostBadge();
  }

  const moneyBadge = document.getElementById("picker-money-badge");
  if (moneyBadge) {
    const hasMoneyBadge = type === "weapons" || type === "armor" || type === "gear";
    moneyBadge.hidden = !hasMoneyBadge;
    if (hasMoneyBadge) updatePickerMoneyBadge();
  }

  const search = modal.querySelector(".picker-search");
  search.value = "";
  search.oninput = () => renderPickerList(type, search.value);

  const filterBtn = document.getElementById("picker-filter-btn");
  if (filterBtn) {
    filterBtn.hidden = type !== "edges" && type !== "powers";
    if (type === "edges") {
      _edgeFilterMode = "normal";
      updateFilterBtnLabel();
      filterBtn.onclick = (e) => { e.stopPropagation(); openEdgeFilterPopup(filterBtn); };
    } else if (type === "powers") {
      _powerFilterMode = "normal";
      updatePowerFilterBtnLabel();
      filterBtn.onclick = (e) => { e.stopPropagation(); openPowerFilterPopup(filterBtn); };
    } else {
      filterBtn.onclick = null;
    }
  }

  if (type === "weapons") _weaponPage = 0;
  renderPickerList(type, "");
  modal.hidden = false;
  search.focus();
}

function closePickerModal() {
  document.getElementById("picker-modal").hidden = true;
}

function rerenderPickerIfOpen(type) {
  const modal = document.getElementById("picker-modal");
  if (!modal || modal.hidden) return;
  const search = modal.querySelector(".picker-search");
  renderPickerList(type, search ? search.value : "");
}
