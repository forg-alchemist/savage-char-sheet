function renderTracks() {
  renderTrack("wounds", ["-1", "-2", "-3"]);
  renderTrack("fatigue", ["-1", "-2", "К.О."]);
  renderAdvanceTrack();
}

function renderTrack(key, labels) {
  const root = document.querySelector(`[data-track="${key}"]`);
  if (!root) return;

  if (!Array.isArray(state[key])) {
    const count = Math.max(0, Math.min(labels.length, Number(state[key]) || 0));
    state[key] = labels.map((_, i) => i < count);
  }
  state[key] = normalizeTrackSeverity(state[key], labels.length);

  root.replaceChildren();
  labels.forEach((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.classList.toggle("active", Boolean(state[key][index]));
    button.addEventListener("click", () => {
      const targetCount = index + 1;
      const currentCount = getTrackSeverity(state[key]);
      const nextCount = currentCount === targetCount ? index : targetCount;
      state[key] = labels.map((_, i) => i < nextCount);
      commitSheetUpdate({ renderTracks: true });
    });
    root.append(button);
  });
}

function getTrackSeverity(track) {
  return Math.max(0, track.reduce((highest, active, index) => active ? index + 1 : highest, 0));
}

function normalizeTrackSeverity(track, count) {
  const severity = Math.min(count, getTrackSeverity(track));
  return Array.from({ length: count }, (_, index) => index < severity);
}

function renderAdvanceTrack() {
  const root = document.querySelector('[data-track="advance"]');
  if (!root) return;

  const count = 3;

  if (!Array.isArray(state.advancesTrack)) {
    state.advancesTrack = Array(count).fill(false);
  }
  while (state.advancesTrack.length < count) state.advancesTrack.push(false);

  root.replaceChildren();

  for (let index = 0; index < count; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Повышение ${index + 1}`);
    button.classList.toggle("active", Boolean(state.advancesTrack[index]));
    button.addEventListener("click", () => {
      if (state.advancesTrack[index]) {
        if (state.marshalMode) {
          const history = Array.isArray(state.advanceHistory) ? state.advanceHistory : [];
          const canRollbackSnapshot = Boolean(history[history.length - 1]?.snapshot);
          if (canRollbackSnapshot) rollbackLastAdvance();
          else refundAdvancePointAt(index);
        }
        return;
      }
      const rollbackSnapshot = createAdvanceRollbackSnapshot();
      cementSkillStartSpend({ refresh: !isSkillCostCemented() });
      state.advancesTrack[index] = true;
      renderTracks();
      openAdvanceModal(index, null, rollbackSnapshot);
      commitSheetUpdate({ recalc: false });
    });
    root.append(button);
  }
}
