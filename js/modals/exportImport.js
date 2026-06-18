// ── Export / Import ───────────────────────────────────────────────────────────

// Fields that are exported directly (not computed, not session-only)
const _EXPORT_SCALAR_FIELDS = [
  'name', 'player',
  'rank', 'advances', 'advancesTrack', 'advanceChoices', 'advanceHistory',
  'attributes', 'attrBonuses', 'attrPoolBase',
  'skills', 'customSkills', 'skillBudgetMax',
  'extraPoints', 'hindranceSpent',
  'money', 'moneyCents', 'moneyGrants',
  'wounds', 'fatigue', 'resolve',
  'hindrancesDone', 'edgesDone', 'powersDone',
  'dealDone', 'dealJoker', 'dealAssignment',
  'powerCurrent',
  'gear',
  'horseActive', 'mount',
  'harrowed',
  'selectedLoa',
  'selectedDivineInterventions',
  'supNatAttr',
];

// ── v2 compact format (ID-based) ──────────────────────────────────────────────

function _buildCompactV2(raw, artData) {
  const compact = { format: 'dlnds', version: 1 };

  for (const key of _EXPORT_SCALAR_FIELDS) {
    if (key in raw) compact[key] = raw[key];
  }

  // Skills: die + starred + замороженная уплаченная стоимость (_startSpend) для повышений
  if (Array.isArray(compact.skills)) {
    compact.skills = compact.skills.map(({ name, die, starred, _startSpend }) => {
      const out = { name, die, starred };
      if (_startSpend != null) out._startSpend = _startSpend;
      return out;
    });
  }
  // Custom skills: strip description, keep _startSpend
  if (compact.customSkills && typeof compact.customSkills === 'object') {
    for (const attr of Object.keys(compact.customSkills)) {
      if (Array.isArray(compact.customSkills[attr])) {
        compact.customSkills[attr] = compact.customSkills[attr].map(({ name, die, _startSpend }) => {
          const out = { name, die };
          if (_startSpend != null) out._startSpend = _startSpend;
          return out;
        });
      }
    }
  }

  // Catalog refs: ID-keyed, skip auto-managed entries. Флаги — через _encodeRef.
  compact.hindranceIds = (raw.selectedHindrances || [])
    .filter(h => !h._auto && h.id)
    .map(h => _encodeRef(h.id, h, 'hindrances'));

  compact.edgeIds = (raw.selectedEdges || [])
    .filter(e => e.id)
    .map(e => _encodeRef(e.id, e, 'edges')); // multi-pick edges keep count

  // _arcaneGift powers are auto-added from edges on load — skip them
  compact.powerIds  = (raw.selectedPowers || []).filter(p => !p._arcaneGift && p.id).map(p => p.id);
  compact.weaponIds = (raw.weapons || []).filter(w => w.id).map(w => _encodeRef(w.id, w, 'weapons'));
  compact.armorIds  = (raw.selectedArmor  || []).filter(a => a.id && isCharacterArmor(a)).map(a => _encodeRef(a.id, a, 'armor'));
  if (compact.mount) compact.mount = _compactMountForExport(compact.mount);
  compact.art       = artData || "";

  return compact;
}

function _compactMountForExport(mount) {
  if (!mount || typeof mount !== 'object') return mount;
  const copy = { ...mount };
  const refs = Array.isArray(copy.defectIds) ? copy.defectIds : (Array.isArray(copy.defects) ? copy.defects : []);
  copy.defectIds = refs.map(_resolveMountDefectIdForExport).filter(Boolean);
  delete copy.defects;
  return copy;
}

function _resolveMountDefectIdForExport(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') return _isIdRef(ref) ? ref : null;
  if (ref.id && _isIdRef(ref.id)) return ref.id;
  const name = ref.name;
  const degree = String(ref.degree || '').trim().toLowerCase();
  const catalog = window.DEADLANDS_CATALOG_HINDRANCES || [];
  const found = catalog.find(h => h.name === name && String(h.degree || '').trim().toLowerCase() === degree)
    || catalog.find(h => h.name === name);
  return found?.id || null;
}

// Detects if a ref string is a catalog ID vs a legacy name string ("Бугай").
// Prefixes: ae (archetypeEdges), ma (mountArmor), mg (mountGear), then single
// h/e/p/w/a (hindrance/edge/power/weapon/armor) и g (gear).
function _isIdRef(str) {
  return typeof str === 'string' && /^(ae|ma|mg|[ehpwag])\d{2,3}$/.test(str);
}

// ── Единый список «флагов» предметов по типу (#13) ────────────────────────────
// Раньше каждый флаг (_worn/_stashed/_equipped/count/_ammo/...) дублировался в
// кодере и в двух ветках декодера. Теперь — один источник: enc(value) решает,
// что писать в ссылку (undefined → не писать), dec(value) — что положить в
// восстановленный предмет (по умолчанию — значение как есть).
const _REF_FLAG_SPECS = {
  hindrances: [{ key: '_reduceProgress' }],
  edges:      [{ key: 'count', enc: c => (c > 1 ? c : undefined) }],
  weapons: [
    { key: '_worn' },
    { key: '_stashed' },
    { key: '_bundleKey' },
    { key: '_ammo',
      enc: a => (Array.isArray(a) && a.some(v => v === false || v === 0) ? a.map(Boolean) : undefined),
      dec: a => (Array.isArray(a) ? a.map(Boolean) : undefined) },
  ],
  armor:      [{ key: '_equipped' }],
};

// Кодирование ссылки: голый id, если значимых флагов нет; иначе { id, ...флаги }.
function _encodeRef(id, item, type) {
  const flags = {};
  for (const spec of (_REF_FLAG_SPECS[type] || [])) {
    const v = spec.enc ? spec.enc(item[spec.key]) : item[spec.key];
    if (v !== undefined && v !== null && v !== false) flags[spec.key] = v;
  }
  return Object.keys(flags).length ? { id, ...flags } : id;
}

// Перенос сохранённых флагов из ссылки в восстановленный предмет.
function _applyRefFlags(target, ref, type) {
  if (!target || typeof ref !== 'object' || !ref) return target;
  for (const spec of (_REF_FLAG_SPECS[type] || [])) {
    if (!(spec.key in ref)) continue;
    const v = spec.dec ? spec.dec(ref[spec.key]) : ref[spec.key];
    if (v !== undefined && v !== null && v !== false) target[spec.key] = v;
  }
  return target;
}

// Декодирование ссылки: id → resolveById, иначе legacy-имя → resolveLegacy,
// затем перенос флагов. Возвращает копию каталожного предмета или null.
function _decodeRef(ref, type, resolveById, resolveLegacy) {
  const id = typeof ref === 'string' ? ref : ref?.id;
  const base = _isIdRef(id) ? resolveById(id) : resolveLegacy(ref);
  if (!base) return null;
  return _applyRefFlags({ ...base }, ref, type);
}

function _reconstructV2(compact) {
  const byId  = window.CATALOG_BY_ID || {};
  const CAT_H = window.DEADLANDS_CATALOG_HINDRANCES        || [];
  const CAT_E = window.DEADLANDS_CATALOGS?.edges           || [];
  const CAT_P = window.DEADLANDS_CATALOG_POWERS            || [];
  const CAT_W = window.DEADLANDS_CATALOG_WEAPONS           || [];
  const CAT_A = window.DEADLANDS_CATALOG_ARMOR             || [];

  const state = {};
  for (const key of _EXPORT_SCALAR_FIELDS) {
    if (key in compact) state[key] = compact[key];
  }

  // Support old wrapper format where catalog items were stored as full objects
  // under selectedHindrances/selectedEdges etc. (pre-compact format).
  // Convert them to name-based refs so the legacy path in _reconstructV2 handles them.
  const hindranceRefs = compact.hindranceIds
    ?? (compact.selectedHindrances || []).map(h => ({
      name: h.name, degree: h.degree,
      ...(h._reduceProgress ? { _reduceProgress: h._reduceProgress } : {}),
    }));
  const edgeRefs = compact.edgeIds
    ?? (compact.selectedEdges || []).map(e =>
      e.count && e.count > 1 ? { name: e.name, count: e.count } : e.name
    );
  const powerRefs = compact.powerIds
    ?? (compact.selectedPowers || []).filter(p => !p._arcaneGift).map(p => p.name);
  const weaponRefs = compact.weaponIds
    ?? (compact.weapons || []).map(w => typeof w === 'string' ? w : ({
      name: w.name,
      ...(w._worn ? { _worn: true } : {}),
      ...(w._stashed ? { _stashed: true } : {}),
      ...(w._bundleKey ? { _bundleKey: w._bundleKey } : {}),
      ...(Array.isArray(w._ammo) ? { _ammo: w._ammo.map(Boolean) } : {}),
    }));
  const armorRefs = compact.armorIds
    ?? (compact.selectedArmor || []).map(a => ({ name: a.name, bonus: a.bonus ?? 0 }));

  state.selectedHindrances = hindranceRefs.map(ref => _decodeRef(
    ref, 'hindrances',
    id => byId.hindrances?.[id],
    r => {
      const name = typeof r === 'object' ? r.name : r;
      const deg  = typeof r === 'object' ? r.degree : null;
      return (deg ? CAT_H.find(h => h.name === name && h.degree === deg) : null)
          || CAT_H.find(h => h.name === name);
    }
  )).filter(Boolean);

  state.selectedEdges = edgeRefs.map(ref => _decodeRef(
    ref, 'edges',
    id => byId.edges?.[id],
    r => CAT_E.find(e => e.name === (typeof r === 'object' ? r.name : r))
  )).filter(Boolean);

  state.selectedPowers = powerRefs.map(ref => _decodeRef(
    ref, 'powers',
    id => byId.powers?.[id],
    r => CAT_P.find(p => p.name === (typeof r === 'object' ? r.name : r))
  )).filter(Boolean);

  state.weapons = weaponRefs.map(ref => _decodeRef(
    ref, 'weapons',
    id => byId.weapons?.[id],
    r => CAT_W.find(w => w.name === (typeof r === 'object' ? r.name : r))
  )).filter(Boolean);

  state.selectedArmor = armorRefs.map(ref => _decodeRef(
    ref, 'armor',
    id => byId.armor?.[id],
    r => {
      const name  = typeof r === 'string' ? r : r.name;
      const bonus = typeof r === 'object' ? (r.bonus ?? null) : null;
      return bonus !== null
        ? CAT_A.find(a => a.name === name && (a.bonus ?? 0) === bonus)
        : CAT_A.find(a => a.name === name);
    }
  )).filter(Boolean).filter(isCharacterArmor);

  // Never restore a pending advance UI state — after import the modal is gone
  state.advancePending = null;

  return state;
}

// ── Sanitize imported strings against XSS ────────────────────────────────────

function _sanitize(val) {
  if (typeof val === 'string') {
    const d = document.createElement('div');
    d.textContent = val;
    return d.innerHTML;
  }
  if (Array.isArray(val)) return val.map(_sanitize);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = _sanitize(val[k]);
    return out;
  }
  return val;
}

// ── Packed save text ──────────────────────────────────────────────────────────
// This is not password cryptography; it only keeps casual Notepad edits away.
const _PACKED_SAVE_PREFIX = 'DLNDS-SAVE-v1:';
const _PACKED_SAVE_KEY = 'Deadlands-Weird-West-Character-Sheet';

function _utf8Encode(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  const bin = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function _utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return decodeURIComponent(escape(bin));
}

function _bytesToBase64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function _base64ToBytes(base64) {
  const bin = atob(base64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function _saveChecksum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function _scrambleBytes(bytes) {
  const key = _utf8Encode(_PACKED_SAVE_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const src = bytes[bytes.length - 1 - i];
    out[i] = src ^ key[i % key.length] ^ ((i * 31 + 17) & 255);
  }
  return out;
}

function _unscrambleBytes(bytes) {
  const key = _utf8Encode(_PACKED_SAVE_KEY);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const plain = bytes[i] ^ key[i % key.length] ^ ((i * 31 + 17) & 255);
    out[bytes.length - 1 - i] = plain;
  }
  return out;
}

function _packSaveText(json) {
  const envelope = JSON.stringify({ c: _saveChecksum(json), p: json });
  return _PACKED_SAVE_PREFIX + _bytesToBase64(_scrambleBytes(_utf8Encode(envelope)));
}

function _parseSaveText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith(_PACKED_SAVE_PREFIX)) {
    return JSON.parse(trimmed); // legacy plain JSON export
  }

  try {
    const packed = trimmed.slice(_PACKED_SAVE_PREFIX.length);
    const envelope = JSON.parse(_utf8Decode(_unscrambleBytes(_base64ToBytes(packed))));
    if (!envelope || typeof envelope.p !== 'string' || envelope.c !== _saveChecksum(envelope.p)) {
      throw new Error('SAVE_CHECKSUM_MISMATCH');
    }
    return JSON.parse(envelope.p);
  } catch {
    throw new Error('SAVE_CHECKSUM_MISMATCH');
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

function exportChar() {
  let raw, artData;
  try {
    ({ state: raw, artData } = window._charExport());
  } catch (e) {
    showToast('Ошибка экспорта: ' + e.message);
    return;
  }

  const compact  = _buildCompactV2(raw, artData);
  const json     = JSON.stringify(compact);
  const saveText = _packSaveText(json);
  const charName = (raw.name || 'персонаж').trim().replace(/[\\/:*?"<>|]/g, '_') || 'персонаж';

  if (window.showSaveFilePicker) {
    _exportViaFilePicker(saveText, charName);
  } else {
    _exportViaDownload(saveText, charName);
  }
}

async function _exportViaFilePicker(saveText, charName) {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: `${charName}.dlnds`,
      types: [{ description: 'Deadlands Character', accept: { 'application/octet-stream': ['.dlnds'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(saveText);
    await writable.close();
  } catch (e) {
    if (e.name !== 'AbortError') showToast('Ошибка сохранения файла');
  }
}

function _exportViaDownload(saveText, charName) {
  const blob = new Blob([saveText], { type: 'application/octet-stream' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${charName}.dlnds`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Import ────────────────────────────────────────────────────────────────────

function importChar() {
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = '.dlnds,.json,application/json,application/octet-stream';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const payload = _parseSaveText(reader.result);
        if (payload.format !== 'dlnds') {
          showToast('Неверный формат файла');
          return;
        }
        // Detect old wrapper format: { format, state: {...rawState}, artData: '...' }
        let compact = payload;
        let art = typeof payload.art === 'string' ? payload.art : '';
        if (compact.state && typeof compact.state === 'object') {
          compact = compact.state;
          if (!art && typeof payload.artData === 'string') art = payload.artData;
        }

        showConfirm(
          'Импорт заменит текущего персонажа. Продолжить?',
          () => {
            try {
              const stateToLoad = _reconstructV2(compact);
              window._charImport(stateToLoad, art);
              location.reload();
            } catch (e) {
              showToast('Ошибка импорта: ' + e.message);
            }
          }
        );
      } catch (e) {
        showToast(e.message === 'SAVE_CHECKSUM_MISMATCH'
          ? 'Файл сохранения повреждён или изменён вручную'
          : 'Ошибка чтения файла');
      }
    });
    reader.readAsText(file, 'utf-8');
  });
  input.click();
}
