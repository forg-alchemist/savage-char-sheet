function buyGearCatalogItem(item) {
  const cost = parsePriceCents(item.price);

  if (cost > 0) {
    if (!spendMoney(cost)) {
      showToast("Не хватает средств!");
      return;
    }
  }

  if (!state.gear) state.gear = [];
  state.gear.push({
    id: item.id,
    _source: "catalog",
    name: item.name,
    notes: item.notes || item.description || "",
    price: item.price || "",
    weight: Number(item.weight) || 0,
  });

  updatePickerMoneyBadge();
  commitSheetUpdate({ renderGear: true });
}
