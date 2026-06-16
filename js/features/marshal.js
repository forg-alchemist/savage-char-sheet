function toggleMarshalMode() {
  if (state.marshalMode) {
    state.marshalMode = false;
    state.marshalEditTime = new Date().toISOString();
  } else {
    state.marshalMode = true;
  }
  scheduleSave();
  recalculate();
  renderTraitBoard();
  renderChoiceList("hindrances");
  renderChoiceList("edges");
  renderChoiceList("powers");
  updateMarshalUI();
}

function updateMarshalUI() {
  const banner = document.getElementById("marshal-banner");
  const btn = document.querySelector('[data-action="marshalMode"]');
  const nameLabel = document.getElementById("name-label");

  if (banner) banner.classList.toggle("marshal-banner--on", !!state.marshalMode);
  document.body.classList.toggle("marshal-active", !!state.marshalMode);

  // Force loa panel to re-render so "ОТВЕРГНУТЬ ЛОА" button appears/disappears
  const loaPanel = document.getElementById("panel-loa");
  if (loaPanel && state.selectedLoa) {
    delete loaPanel.dataset.loaShown;
    renderLoaPanel();
  }

  if (btn) {
    btn.textContent = state.marshalMode ? "★ ВЫЙТИ ИЗ РЕЖИМА МАРШАЛА" : "★ РЕЖИМ МАРШАЛА";
    btn.classList.toggle("marshal-btn--active", !!state.marshalMode);
  }

  // The Harrowed button lives outside the sheet and is only reachable by the Marshal
  const harrowedBtn = document.getElementById("harrowed-btn");
  if (harrowedBtn) harrowedBtn.hidden = !state.marshalMode;

  if (nameLabel) {
    if (!state.marshalMode && state.marshalEditTime) {
      const d = new Date(state.marshalEditTime);
      const pad = (n) => String(n).padStart(2, "0");
      const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      nameLabel.textContent = `Отредактировано Маршалом ${date} ${time}`;
      nameLabel.classList.add("marshal-edited-label");
    } else {
      nameLabel.classList.remove("marshal-edited-label");
      if (!state.marshalMode) nameLabel.textContent = "НЕ ОБНОВЛЯЛОСЬ МАРШАЛОМ";
    }
  }

  updateHindranceLock();
  updateEdgeLock();
  updatePowersLock();
}
// Harrowed (Меченный) lives in js/features/harrowed.js

