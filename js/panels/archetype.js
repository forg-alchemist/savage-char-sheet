const ARCHETYPE_PANEL_CONFIG = [
  {
    panelId:  "panel-loa",
    btnId:    "btn-loa",
    color:    ARCHETYPE_COLORS["Вудуист"].accent,
    isActive: () => (state.selectedEdges || []).some(e => window.WK_EDGES?.SHUAL ? e.id === window.WK_EDGES.SHUAL : e.name === "Избранный Шуаль"),
  },
  {
    panelId:  "panel-bv",
    btnId:    "btn-bv",
    color:    ARCHETYPE_COLORS["Чудотворец"].accent,
    isActive: () => computeArchetypes().includes("Чудотворец"),
  },
];

function updateArchetypePanels() {
  ARCHETYPE_PANEL_CONFIG.forEach(({ panelId, btnId, color, isActive }) => {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const active = isActive();
    panel.hidden = !active;

    // Кнопка может отсутствовать (выбран лоа, переключён режим) — это нормально
    if (active) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.style.background = color;
        btn.style.boxShadow  = "inset 0 -2px 0 rgba(0,0,0,0.2)";
      }
    }
  });

  renderLoaPanel();
  renderDivinePanel();
}
