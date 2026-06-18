function _commitList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function commitSheetUpdate(options = {}) {
  const {
    recalc = true,
    save = true,
    hydrate = false,
    renderGear = false,
    renderTracks: shouldRenderTracks = false,
    renderCatalogPickers: shouldRenderCatalogPickers = false,
    renderArt: shouldRenderArt = false,
    renderMount: shouldRenderMount = false,
    renderTraits = false,
    renderChoices = [],
    rerenderPickers = [],
    updateEdgeCost = false,
    updateSkillBuy = false,
    updateRank = false,
    updateDeal = false,
    updateJoker = false,
    updateMarshal = false,
    updateHarrowed = false,
    updateLocks = [],
  } = options;

  if (hydrate) hydrateInputs();
  if (renderGear) renderEntries("gear");
  if (shouldRenderTracks) renderTracks();
  if (shouldRenderCatalogPickers) renderCatalogPickers();
  for (const type of _commitList(renderChoices)) renderChoiceList(type);

  if (recalc) {
    recalculate();
  } else {
    if (renderTraits) renderTraitBoard();
    if (shouldRenderMount) renderMount();
  }

  if (shouldRenderArt) renderArt();
  if (updateSkillBuy) updateSkillBuyBtn();
  if (updateRank) updateRankWidget();
  if (updateDeal) updateDealButton();
  if (updateJoker) updateJokerStatus();
  if (updateMarshal) updateMarshalUI();
  if (updateHarrowed) updateHarrowedUI();
  if (updateEdgeCost) updateEdgeCostBadge();

  for (const type of _commitList(updateLocks)) {
    if (type === "hindrances") updateHindranceLock();
    if (type === "edges") updateEdgeLock();
    if (type === "powers") updatePowersLock();
  }
  for (const type of _commitList(rerenderPickers)) rerenderPickerIfOpen(type);

  if (save) scheduleSave();
}
