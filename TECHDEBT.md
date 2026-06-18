# Карта техдолга — Deadlands Char Sheet

Версия на момент составления: **0.9.6**
Источник: совместный аудит (ассистент + CGPT), подтверждён по коду.

Формат пункта:
- **Проблема** — что не так и где.
- **План** — как будет решаться.
- **Статус** — `☐ не решено` / `☑ решено` + краткое «как решено».

Правила работы: идём **последовательно сверху вниз**, по одному пункту. Под каждым фиксируем фактическое решение.

---

## 🔴 Баги / функциональные риски

### 1. Вместимость чехлов винтовок завязана на седельные сумки
- **Проблема:** `getRifleSlotCount` ([mount.js:363-371](js/features/mount.js)) считает `saddlebagSlots || legacySlots` — число убираемых винтовок = число сумок, а чехол (`rifleScabbard`) учитывается только при 0 сумок. Тост ошибочно про «седельную сумку». Недоведённый рефактор «чехол ↔ сумки».
- **План:** определить единый источник вместимости = число купленных чехлов `rifleScabbard`. Переписать `getRifleSlotCount` на подсчёт только чехлов, убрать ветку с сумками и обёртку `getScabbardCount` (см. #17). Поправить тост на «чехол».
- **Статус:** ☑ решено
  - `getRifleSlotCount` ([mount.js](js/features/mount.js)) переписан: вместимость = `getMountGearOwnedCount(equipment, rifleScabbard)` — считаются только чехлы. Ветка с `saddlebags`/`legacyScabbard` удалена.
  - Обёртка `getScabbardCount` удалена; единственное её использование (fallback в [choice.js](js/picker/choice.js)) убрано — там теперь только `getRifleSlotCount`.
  - Тост `stashRifle` исправлен: «Нет свободного **чехла** для винтовки».
  - Проверка: `node --check` обоих файлов OK; страница грузится без JS-ошибок; упоминаний сумок-в-чехле/обёртки в коде не осталось.
  - Побочно закрыта часть #17 (удаление `getScabbardCount`).

### 2. Дубль id `a010` / `a015` в двух каталогах
- **Проблема:** конская броня `a010`/`a015` есть и в [armor.js:103](js/catalogs/armor.js), и в [mount.js:346,358](js/catalogs/mount.js). Id перестал быть однозначным; `resolveMountArmorById` падает в `CATALOG_BY_ID.armor`.
- **План:** перенумеровать конскую броню в каталоге лошади в `ma001`/`ma002`; обновить ссылки (`equipment.armorId`, экспорт/импорт, `_isIdRef` — см. #13); удалить дубли из `armor.js`, если они там лишние; проверить миграцию старых сохранений (старый `armorId: "a010"` → `ma001`).
- **Статус:** ☑ решено
  - Уточнение по факту: коллизия была только по `a010` (в [armor.js](js/catalogs/armor.js) это «Бронешляпа» персонажа, в [mount.js](js/catalogs/mount.js) — «Бронзовый доспех для лошади»); `a015` был только в mount.js. Жёстких ссылок на эти id в коде не было.
  - В [mount.js](js/catalogs/mount.js) конская броня перенумерована: `a010 → ma001`, `a015 → ma002` (теперь все три = `ma001/ma002/ma003`). `armor.js` не трогал — «Бронешляпа» (`a010`) там легитимна.
  - Миграция старых сохранений в `ensureMountEquipment` ([mount.js](js/features/mount.js)): `equipment.armorId` `a010→ma001`, `a015→ma002`.
  - `_isIdRef` не трогал: конская броня хранится в снимке `mount` как `armorId` (сырая строка), не через id-ref → правка регэкспа относится к #13.
  - Проверка: `node` подтвердил пустое пересечение id `armor` × `mountArmor`; страница грузится без ошибок.

### 3. Авто-генерация id по индексу
- **Проблема:** [index.js:7-8](js/catalogs/index.js) при отсутствии `id` варнит, но всё равно присваивает `prefix + index`. Сдвиг порядка в каталоге → тихий сдвиг id → рассинхрон сохранений.
- **План:** заменить авто-присвоение на жёсткую ошибку (throw) при отсутствии `id` в каталоге — пусть падает на этапе разработки, а не молча портит данные.
- **Статус:** ☑ решено
  - В [index.js](js/catalogs/index.js) авто-присвоение `prefix + index` удалено полностью.
  - `_addIds` заменён на `_assertStableIds`: каждый каталог теперь только проверяется, а при отсутствии ручного стабильного `id` загрузка падает с понятной ошибкой вида `[catalog] <catalog> entry at index <n> has no stable id`.
  - Каталоги больше не мутируются ради id на старте: если id забыли добавить, это ошибка разработки, а не тихое изменение данных.
  - Проверка: `node --check js\catalogs\index.js` OK; загрузка всех каталогов через `js/catalogs/index.js` OK (`hindrances 112`, `edges 215`, `powers 95`, `weapons 72`, `armor 13`, `gear 12`, `mountGear 22`, `mountArmor 3`).

---

## 🟠 Архитектура / спагетти

### 4. `mount.js` — гипер-узел (~1261 строк)
- **Проблема:** в одном файле покупка, 3 модалки, снаряжение, броня, лимиты/взаимоисключения, изъяны лошади, расчёт показателей, перегруз, винтовки-в-чехлах, рендер, деньги.
- **План:** разбить на модули: `mount/data` (варианты, расчёт показателей/нагрузки), `mount/equipment` (снаряжение, лимиты, взаимоисключения), `mount/modal` (UI покупки), `mount/render` (панель). Делать после развязки денег (#10).
- **Статус:** ☑ решено
  - [mount/index.js](js/features/mount/index.js) больше не гипер-узел: файл оставлен как короткий entrypoint-комментарий, основная логика разнесена по отдельным feature-файлам без изменения поведения.
  - Все файлы лошади перенесены из корня `js/features/` в отдельную папку [js/features/mount/](js/features/mount/index.js), чтобы не засорять общий список features.
  - Новый разнос:
    - [data.js](js/features/mount/data.js) — константы, варианты лошади, группы снаряжения, варианты покупки.
    - [core.js](js/features/mount/core.js) — базовые действия: выбор варианта, покупка/убрать лошадь, чехлы винтовок, временно деньги до решения #10.
    - [equipment.js](js/features/mount/equipment.js) — состояние снаряжения, лимиты, взаимоисключения, покупка/удаление предметов.
    - [defects.js](js/features/mount/defects.js) — изъяны лошади, случайная черта от Слепоты, нагрузка и расчёт показателей.
    - [modal.js](js/features/mount/modal.js) — окна выбора лошади, способа покупки и магазина снаряжения лошади.
    - [render.js](js/features/mount/render.js) — рендер панели лошади, показателей, снаряжения, изъянов и черты.
  - [Char_sheet.html](Char_sheet.html) подключает новые файлы перед [app.js](js/app.js), в явном порядке `index → data → core → equipment → defects → modal → render`. ES-модули не вводились, чтобы не смешивать с большой задачей #7.
  - Проверка: `node --check` по всем `js/**/*.js` OK; последовательная загрузка каталогов + mount-файлов через VM OK; script-пути в [Char_sheet.html](Char_sheet.html) проверены, отсутствующих файлов нет.

### 5. Эффекты лошади зашиты по именам в feature-файле
- **Проблема:** штрафы/бонусы изъянов лошади считаются по именам (`defect.name === "Полнота"` и т.п.), id черт — там же ([defects.js](js/features/mount/defects.js)).
- **План:** вынести модификаторы изъянов лошади в таблицу-данные (по id), как сделано для секторов брони; расчёт читает таблицу, а не сравнивает имена.
- **Статус:** ☑ решено
  - В [mount.js](js/catalogs/mount.js) добавлены таблицы данных:
    - `DEADLANDS_MOUNT_HINDRANCE_EFFECTS` — эффекты изъянов лошади по id (`h099/h100` Хромота, `h032` Копуша, `h074` Полнота, `h033` Коротышка, `h086` Старость).
    - `DEADLANDS_MOUNT_EDGE_EFFECTS` — эффекты случайных черт лошади по id (`e009` Блок, `e019` Бугай, `e089` Тяжеловес).
    - `DEADLANDS_MOUNT_BLINDNESS_EDGE_IDS` — список возможных случайных черт от Слепоты перенесён из feature-кода в каталог лошади.
  - [data.js](js/features/mount/data.js) теперь только забирает эти таблицы из `window`.
  - [defects.js](js/features/mount/defects.js) больше не считает модификаторы по `defect.name`; расчёт нагрузки и показателей читает эффекты через `defect.id` / `edge.id`.
  - `hasMountBlindness` и `hasMountAging` также переведены на id без fallback по имени. Старые сохранения с именами всё ещё нормализуются в id через `resolveMountHindranceRef`.
  - Проверка: `node --check` по всем `js/**/*.js` OK; последовательная загрузка каталогов + mount-файлов через VM OK; функциональная VM-проверка подтвердила прежние значения: Полнота даёт нагрузку `150` и показатели `Шаг 5 / Бег d4 / Стойкость 9`, Хромота даёт `Шаг 5 / Бег d4`, Бугай через черту даёт нагрузку `150`.

### 6. Пикер перегружен (`list.js`)
- **Проблема:** [list.js](js/picker/list.js) обслуживает черты/изъяны/силы/оружие/броню/магазин снаряжения/деньги/предупреждения/лимиты — всё вместе.
- **План:** выделить рендер-стратегии по типу (отдельные рендереры строк), магазин снаряжения лошади вынести из пикера в `mount/modal`. Делать после #4.
- **Статус:** ☑ решено
  - Навигация оружейных групп вынесена из [list.js](js/picker/list.js) в [weaponNav.js](js/picker/weaponNav.js): порядок групп, иконки, страницы и группировка результатов поиска больше не живут внутри общего рендера списка.
  - Рендер деталей строк вынесен в [rowRenderers.js](js/picker/rowRenderers.js): оружие, броня, изъяны, черты и силы имеют отдельные функции оформления, а `list.js` оставлен диспетчером фильтрации, блокировок и кликов.
  - Покупка магазинного снаряжения персонажа вынесена в [gearPurchase.js](js/picker/gearPurchase.js). Магазин снаряжения лошади уже находится в [modal.js](js/features/mount/modal.js) после решения #4, поэтому в общий picker не возвращался.
  - [Char_sheet.html](Char_sheet.html) обновлён явным порядком загрузки `weaponNav → rowRenderers → gearPurchase → list`. Проверка: `node --check` по picker-файлам OK; script-пути существуют.

### 7. Нет модулей — ~311 глобальных функций
- **Проблема:** всё в global scope через `<script>`, вперемешку с `window.X`; связанность по порядку загрузки → защитные `typeof X === "function"` в picker/mount/harrowed-коде.
- **План:** долгосрочно — перейти на ES-модули (import/export) или хотя бы единый namespace-объект. Краткосрочно — убрать `typeof`-костыли, зафиксировав порядок скриптов. Крупная задача, ближе к концу.
- **Статус:** ☑ решено
  - Введён короткий boot-namespace [dependencies.js](js/bootstrap/dependencies.js): `window.DEADLANDS_BOOT.assertFunctions(scope, names)` падает понятной ошибкой, если обязательная функция не загружена.
  - [Char_sheet.html](Char_sheet.html) теперь грузит `app.js` последним после feature/modal-скриптов. `exportImport.js`, `advance.js`, `archetypeInfo.js`, `instruction.js` подключены до запуска `init()`, поэтому обработчики в `app.js` больше не зависят от будущих скриптов.
  - Убраны защитные `typeof ... === "function"` вокруг обязательных зависимостей в [helpers.js](js/picker/helpers.js), [gearPurchase.js](js/picker/gearPurchase.js), [choice.js](js/picker/choice.js), [mount/core.js](js/features/mount/core.js), [mount/render.js](js/features/mount/render.js), [mount/defects.js](js/features/mount/defects.js), [harrowed.js](js/features/harrowed.js). Если порядок загрузки сломается, ошибка будет явной, а не тихим пропуском поведения.
  - Полного перехода на ES modules пока нет намеренно: это отдельная крупная миграция и не смешивалась с текущим безопасным шагом. Проверка: `node --check` по всем `js/**/*.js` OK; script-пути существуют.

### 8. Ручное распространение обновлений
- **Проблема:** `renderX(); recalculate(); scheduleSave();` повторяется в каждом обработчике (mount.js ~14, traits.js ~28). Забытый вызов = баг.
- **План:** ввести единую функцию `commit()` (recalculate + нужные рендеры + scheduleSave) или простой «грязный»-флаг с одним проходом обновления. Внедрять постепенно.
- **Статус:** ☑ решено
  - Добавлен общий [commit.js](js/bootstrap/commit.js) с `commitSheetUpdate(options)`. Helper явно принимает флаги: `recalc`, `save`, `renderGear`, `renderTracks`, `renderCatalogPickers`, `renderArt`, `renderMount`, `renderTraits`, `renderChoices`, `rerenderPickers`, `updateEdgeCost`, `updateSkillBuy`, `updateRank`, `updateDeal`, `updateJoker`, `updateMarshal`, `updateHarrowed`, `updateLocks`.
  - [Char_sheet.html](Char_sheet.html) подключает commit-слой сразу после boot-dependencies; [app.js](js/app.js) проверяет наличие `commitSheetUpdate` в boot-check пункта #7.
  - Основные пользовательские обработчики переведены на `commitSheetUpdate`: трейтборд, треки, выборы picker/subpicker, оружие/броня/снаряжение, лошадь и её снаряжение, режим Маршала, Меченный, расклад, повышение, Лоа, Божественные вмешательства, призыв духов.
  - Осознанно оставлены вне общего commit: `init()` и `clearSheet()` в [app.js](js/app.js) (это отдельный пункт #9 и reset-поток), `syncMoneyGrants()` внутри `recalculate()` (нельзя вызывать commit из пересчёта без риска рекурсии), `normalizeMountEdgeIds()` в [defects.js](js/features/mount/defects.js) (ленивая нормализация состояния при рендере/расчёте).
  - Проверка: `node --check` по всем `js/**/*.js` OK; вне `commit.js` прямые `recalculate()`/`scheduleSave()` остались только в перечисленных исключениях.

### 9. `init` делает лишние рендеры/сейв на старте
- **Проблема:** [app.js:57](js/app.js) — `renderTraitBoard()` дважды, `renderMount()` отдельно + `recalculate()` + `scheduleSave()`. Порядок хрупок.
- **План:** упорядочить init: одна установка состояния → один полный рендер → один отложенный save. Убрать повторный `renderTraitBoard`.
- **Статус:** ☑ решено
  - Убран **дублирующий** `renderTraitBoard()` (был сразу после `reconcileHarrowed()`, до `recalculate()` и сброса `extraPoints`). Оставлен единственный — ниже, после `recalculate()`/сброса `extraPoints`, чтобы борд сразу показывал корректные бюджет/локи. На месте старого вызова — поясняющий комментарий со ссылкой на #9.
  - Проверка не выявила других дублей рендера в `init`: каждый `renderX`/`updateX` теперь вызывается по разу; `scheduleSave()` — один (отложенный save уже был единственным).
  - Остальной порядок не трогал (минимальное изменение без риска): `init` намеренно вне `commitSheetUpdate` (см. примечание в #8), state-нормализация по-прежнему предшествует рендерам.
  - Проверка: `awk` по телу `init` подтвердил `renderTraitBoard()` ×1 и `scheduleSave()` ×1; `node --check` OK; страница грузится без ошибок (борд отрисован — 190 кубик-кнопок).
  - 🔸 Не делал полную «фазовую» реорганизацию (group state → group render): это дало бы больше риска ради косметики; ключевая проблема пункта (двойной рендер) устранена.

---

## 🟡 Деньги и дублирование

### 10. Деньги разрознены и не на своём месте
- **Проблема:** глобальная `spendMoney` в [mount.js:427](js/features/mount.js), зовут её [weaponAcquisition.js](js/features/weaponAcquisition.js), [list.js:69](js/picker/list.js). Магазин снаряжения использует оружейный `_parseWeaponCostCents` ([list.js:63](js/picker/list.js)). 5+ функций центов с пересекающейся логикой.
- **План:** создать `js/features/money.js`: `getMoneyCents()`, `spendMoney(cents)`, `parsePriceCents(str)`, `formatCents(cents)`. Перевести все вызовы на него, удалить дубли из mount.js/weaponAcquisition.js.
- **Статус:** ☑ решено
  - Создан [js/features/money.js](js/features/money.js) с канонической логикой: `getMoneyCents()`, `spendMoney(cents)`, `parsePriceCents(str)` (супермножество — понимает `$X`, `X¢`, `X.YY`; `null` если цены нет), `formatCents(cents)`. Подключён в [Char_sheet.html](Char_sheet.html) сразу после `utils.js`.
  - Удалены дубли:
    - `spendMoney` (был в [mount/core.js](js/features/mount/core.js)) → перенесён в money.js; все вызовы (mount/core, mount/equipment, weaponAcquisition×2, gearPurchase) работают без изменений (имя глобальное).
    - `parseMountPriceCents` (mount/core) и `_parseWeaponCostCents` (weaponAcquisition) → один `parsePriceCents`. На mount-сайтах добавлен `?? 0` (там цена всегда есть; null не ожидается).
    - `getMountMoneyCents` (mount/equipment) → `getMoneyCents`.
    - `_formatCents` (weaponAcquisition) → `formatCents`.
    - `updatePickerMoneyBadge` больше не парсит деньги вручную — берёт остаток через `getMoneyCents()`.
  - **Намеренно оставлены** дисплей-форматтеры лошади `formatMountPrice` / `formatMountMoney` (стиль «$ X» с пробелом и «Бесплатно» для 0) — у магазина лошади свой визуал; их унификация с `formatCents` («¢/$X») изменила бы внешний вид. Это презентация, не логика.
  - Проверка: `node --check` всех затронутых файлов OK; VM-тест значений совпал со старым поведением (`$2→200`, `50¢→50`, `$1.25→125`, `—→null`; `formatCents`: 50→«50¢», 200→«$2», null→«—»; `spendMoney` корректно занимает центы из долларов и возвращает false при нехватке); страница грузится без ошибок.
  - 🔸 Остаток: `updatePickerMoneyBadge` и mount-форматтеры используют свои строки вывода — это осознанно (разные UI-конвенции), логика парсинга/списания при этом общая.

### 11. Три почти одинаковые acquisition-модалки
- **Проблема:** `openWeaponAcquisitionModal` + `openArmorAcquisitionModal` ([weaponAcquisition.js](js/features/weaponAcquisition.js)) + `openMountAcquisitionModal` ([mount.js:145](js/features/mount.js)) + каркасы в mount — один шаблон скопирован ~5 раз.
- **План:** вынести общий конструктор модалки `buildAcquisitionModal({title, options, onPick})` (backdrop/dialog/опции/закрытие/иконка/цена); три фичи зовут его со своими опциями.
- **Статус:** ☑ решено
  - Создан [js/modals/acquisitionModal.js](js/modals/acquisitionModal.js) с `buildAcquisitionModal(config)`. Конструктор собирает каркас (modal/backdrop/dialog/шапка с eyebrow+title+close/список опций) и проводку (клик по backdrop и крестику закрывает; клик по опции вызывает её `onPick({close, dialog})`). Возвращает `{ modal, dialog, close }`.
  - Визуальные различия двух семейств инкапсулированы в `ACQ_THEMES` — карте имён CSS-классов (`weapon` → `weapon-acq-*`, `mount` → `mount-*`). **CSS не трогался**, внешний вид идентичен прежнему. Опционально: `leadImage` (картинка-лошадь в шапке), `moneyBadge` (`[data-mount-money]`), `dialogClass`/`optionsModifier` (модификаторы `--variant`/`paper`), у опции — `variants[]` (несколько модификаторов вида `mount-option--variant mount-option--horse`), `iconImageSrc` (иконка-картинка вместо эмодзи).
  - Переведены на конструктор: `openWeaponAcquisitionModal` и `openArmorAcquisitionModal` ([weaponAcquisition.js](js/features/weaponAcquisition.js)) — общий обработчик покупки вынесен в `_acqBuy(opt, item, onAdd, close, mutate?)` (списание + `updatePickerMoneyBadge` + `onAdd`; `mutate` ставит `_worn` для «полцены»). `openMountModal` (выбор варианта) и `openMountAcquisitionModal` (способ покупки) ([mount/modal.js](js/features/mount/modal.js)) — опции мапятся из `MOUNT_VARIANTS`/`MOUNT_ACQUISITION_OPTIONS`, `onPick` зовёт `openMountAcquisitionModal`/`activateMount`; `updateMountMoneyBadges(dialog)` вызывается после сборки. Удалено ~150 строк скопированного каркаса.
  - `closeWeaponAcquisitionModal`/`closeMountModal` оставлены тонкими врапперами (`.remove()`) — их зовёт внешний код.
  - **Намеренно НЕ переведён** `openMountEquipmentModal` ([mount/modal.js](js/features/mount/modal.js)): он структурно другой (пейджер по категориям с ре-рендером группы), общий конструктор ему не подходит.
  - [Char_sheet.html](Char_sheet.html) подключает `acquisitionModal.js` после `money.js` (до `mount/modal.js` и `weaponAcquisition.js`).
  - Проверка: `node --check` трёх файлов OK; временный триггер в headless подтвердил сборку всех путей — оружие 3 опции (купить/полцены/найдено), вариант лошади 2 опции + бейдж денег «ДЕНЬГИ: $ 0», способ покупки 3 опции; страница грузится без ошибок (190 кубик-кнопок).

### 12. Повтор разрешения каталога
- **Проблема:** `(x.id && window.CATALOG_BY_ID?.[type]?.[x.id]) || x` разбросан по mount/weapon/armor/hindrance.
- **План:** хелпер `resolveCatalogItem(type, idOrItem)` в utils; заменить все вхождения.
- **Статус:** ☑ решено
  - В [utils.js](js/utils.js) добавлен `resolveCatalogItem(type, item, fallback = item)`: возвращает полный каталожный объект из `CATALOG_BY_ID[type]` по `item.id`, иначе `fallback` (по умолчанию сам `item`). Третий аргумент покрывает варианты с другим фолбэком.
  - Заменены все вхождения «чистого» паттерна `(x.id && window.CATALOG_BY_ID?.[type]?.[x.id]) || x`:
    - [helpers.js](js/picker/helpers.js): `isCharacterArmor`, `formatArmorSectors` (armor).
    - [mount/core.js](js/features/mount/core.js): `isRifleWeapon` (weapons).
    - [app.js](js/app.js): `getGearEntryDisplay` (`resolveCatalogItem("gear", entry, {})`) и `isCatalogGearEntry` (`!!resolveCatalogItem("gear", entry, null)` — проверка наличия).
    - [helpers.js](js/picker/helpers.js) `getPowerCatalogDefinition` — как первый член цепочки с `fallback = null`, чтобы при промахе по id продолжить поиск через `.find` по id/имени.
  - **Намеренно НЕ трогал** (другая форма, не `idOrItem → item`):
    - Прямые id→def по строке (`CATALOG_BY_ID?.[type]?.[stringId]`): [helpers.js](js/picker/helpers.js) (arcane/powers byId), [spirit.js](js/panels/spirit.js), [advance.js](js/features/advance.js), [harrowed.js](js/features/harrowed.js), [app.js](js/app.js) (`_arcaneGift`).
    - Мульти-каталожные фолбэки и `catalog.find()`-цепочки: [mount/equipment.js](js/features/mount/equipment.js), [mount/defects.js](js/features/mount/defects.js).
  - Проверка: `node --check` всех затронутых файлов OK; VM-тест хелпера подтвердил поведение (резолв по id, фолбэк на item/`{}`/`null`); страница грузится без ошибок (190 кубик-кнопок).

---

## 🟢 Хрупкость / гигиена

### 13. Экспорт/импорт мутный
- **Проблема:** [exportImport.js](js/modals/exportImport.js) — ручной whitelist `_EXPORT_SCALAR_FIELDS` + ad-hoc флаги на тип (`_worn/_stashed/_equipped/_reduceProgress/_startSpend`), `mount`/`gear` как raw-снимок; `_isIdRef` ([:108](js/modals/exportImport.js)) не знает `g/mg/ma`. Новый флаг = правки в 3 местах.
- **План:** обобщить кодирование ссылок предметов (один кодер/декодер с сохранением известных флагов из списка), расширить `_isIdRef` под `g/mg/ma`. Согласовать с #2.
- **Статус:** ☑ решено
  - `_isIdRef` ([exportImport.js](js/modals/exportImport.js)) расширен: регэксп `/^(ae|ma|mg|[ehpwag])\d{2,3}$/` теперь распознаёт и `g` (gear), `mg` (mountGear), `ma` (mountArmor) — раньше эти префиксы ошибочно считались бы legacy-именами.
  - Введён **единый источник флагов** `_REF_FLAG_SPECS` (по типу: `hindrances:_reduceProgress`, `edges:count>1`, `weapons:_worn/_stashed/_bundleKey/_ammo`, `armor:_equipped`) + три хелпера:
    - `_encodeRef(id, item, type)` — голый id, если значимых флагов нет; иначе `{id, ...флаги}` (через `enc`-трансформ, напр. `_ammo` пишется только если есть потраченные).
    - `_applyRefFlags(target, ref, type)` — переносит флаги из ссылки в восстановленный предмет (через `dec`-трансформ).
    - `_decodeRef(ref, type, resolveById, resolveLegacy)` — резолв по id или legacy-имени + применение флагов.
  - 5 кодеров в `_buildCompactV2` и 5 декодеров в `_reconstructV2` переведены на эти хелперы — добавление нового флага теперь правится **в одном месте** (таблица `_REF_FLAG_SPECS`), а не в 3 (кодер + 2 ветки декодера).
  - **Формат на диске совместим**: декодер по-прежнему читает и старые ссылки-объекты (`{id}`), и legacy-имена (`{name,degree}`/`{name,bonus}`/`{name,count}`); новые экспорты для беспряжковых предметов пишут голый id (компактнее). `mount`/`gear` осознанно оставлены raw-снимком (вне ссылочного кодирования) — это вне рамок пункта.
  - Проверка headless round-trip (`_buildCompactV2`→`_reconstructV2`): сохраняются `_reduceProgress`, `count`, `_worn/_stashed/_bundleKey/_ammo`, `_equipped`; беспряжковый предмет кодируется голой строкой; legacy-ссылки по имени декодируются; `_isIdRef` принимает `g/mg/ma` и отвергает имена — все 9 проверок OK; страница грузится без ошибок (190 кубик-кнопок).

### 14. `getTotalSkillSpend` — геттер с побочкой
- **Проблема:** пишет `_startSpend` в state внутри геттера ([utils.js:158](js/utils.js)).
- **План:** вынести заморозку `_startSpend` в явный момент цементирования (при первом повышении / в `reconcile`), а `getTotalSkillSpend` сделать чистым (только чтение).
- **Статус:** ☑ решено
  - [utils.js](js/utils.js): `getTotalSkillSpend()` больше не пишет в `state`; он только читает `_startSpend`, если персонаж уже зацементирован, иначе считает динамически по текущей характеристике.
  - Добавлены явные функции:
    - `cementSkillStartSpend({ refresh })` — фиксирует стартовую стоимость навыков в `_startSpend`.
    - `reconcileSkillStartSpend()` — при загрузке дозаполняет отсутствующие `_startSpend` только у уже зацементированных персонажей.
  - Точки цементирования вынесены из геттера:
    - `init()` вызывает `reconcileSkillStartSpend()` после `ensureTraitModel()` — старые сохранения с повышениями получают недостающий базис один раз при загрузке.
    - клик по монетке повышения ([tracks.js](js/features/tracks.js)) и повышение ранга ([app.js](js/app.js)) вызывают `cementSkillStartSpend({ refresh: !isSkillCostCemented() })` — первый переход создание → повышения фиксирует текущую стоимость, а уже зацементированные персонажи не перезаписываются.
    - `_advConfirm()` ([advance.js](js/features/advance.js)) дополнительно цементирует перед применением выбранного варианта повышения как страховка прямого входа в модалку.
  - Важное поведение сохранено: до повышений поднятие характеристики на создании всё ещё динамически освобождает очки навыков; после начала повышений поднятие характеристики больше не возвращает стартовые очки.
  - Проверка: `node --check` по всем `js/**/*.js` OK; headless-проверка подтвердила сценарий `Драка d10 при Ловкости d4 = 7`, на создании `Ловкость d10 → 4`, после цементирования дальнейшее поднятие характеристики оставляет стоимость `4`.

---

## ⚪ Мёртвый / недостижимый код

### 15. Средний призыв духа не подключён
- **Проблема:** в [spirit.js](js/panels/spirit.js) `MEDIUM_*`, `_runMediumRoll`, ветка `"medium"` реализованы (~150 стр), но кнопку «ПРИЗВАТЬ ДУХА» на силу «Призвать духа» не повесили — код недостижим.
- **План:** по решению пользователя — либо повесить кнопку в [choice.js](js/picker/choice.js) (как у младшего призыва, `openSpiritSummonerModal(psCost, "medium")`, гейт `!allMediumSpiritsTaken()`), либо удалить мёртвый блок. **Ждёт решения.**
- **Статус:** ☐ не решено

### 16. Старая CSS-система тултипов — балласт
- **Проблема:** заглушена `display:none !important` ([base.css:109](css/base.css)); блоки `[data-tooltip]::after`/`:hover::after` в [identity.css:36-63](css/identity.css) и [traits.css](css/traits.css) больше не работают (есть JS-портал).
- **План:** удалить мёртвые `::after`-тултип-блоки из identity.css/traits.css; оставить только глушащее правило (или убрать и его, если очистить все ::after).
- **Статус:** ☑ решено
  - Удалены старые CSS-подсказки на `[data-tooltip]::after` / `[data-tooltip]::before` из [identity.css](css/identity.css) и [traits.css](css/traits.css).
  - Удалена глушилка `.tooltip-portal-enabled [data-tooltip]::before/::after` из [base.css](css/base.css): после удаления псевдо-подсказок она больше не нужна. Само добавление класса `tooltip-portal-enabled` также убрано из [app.js](js/app.js).
  - JS-портал подсказок оставлен единственным механизмом: `.global-tooltip` в [base.css](css/base.css) и обработчики `setupGlobalTooltips()` в [app.js](js/app.js).
  - Проверка: `rg "\[data-tooltip\].*::|tooltip-portal-enabled" css js/app.js` больше не находит старый слой; `node --check js/app.js` OK.

### 17. Мелочи
- **Проблема:** `getScabbardCount` — обёртка над багованным #1; `silyCurrent` в [state.js:20](js/state.js) — вестигиальное поле (значение деривативно); `migrateLegacySkillSpend` — мигратор поля, жившего только в разработке.
- **План:** удалить `getScabbardCount` (вместе с фиксом #1); убрать `silyCurrent` из дефолтного state; удалить `migrateLegacySkillSpend` после уверенности, что промежуточных сохранений с `_spent` не осталось.
- **Статус:** ☑ решено
  - `getScabbardCount` удалён в рамках #1: вместимость винтовок теперь идёт через `getRifleSlotCount()`.
  - `silyCurrent` удалён из [state.js](js/state.js): значение количества сил остаётся производным и выводится через `setOutput("silyCurrent", ...)` в пересчёте, без хранения в `state`.
  - `migrateLegacySkillSpend()` удалён из [app.js](js/app.js) и убран из boot-check/init. Поле `_spent` было промежуточным dev-форматом; актуальный формат использует `_startSpend`, а недостающий базис для зацементированных персонажей дозаполняет `reconcileSkillStartSpend()` из #14.
  - Проверка: `rg "silyCurrent|migrateLegacySkillSpend|_spent|getScabbardCount" js` больше не находит мёртвые поля/функции (кроме производного `setOutput("silyCurrent", ...)`); `node --check` по всем `js/**/*.js` OK.

---

## 🩹 Фиксы и улучшения вне исходного аудита (по ходу работы)

Баги и доработки, найденные/запрошенные уже после составления карты. Формат тот же: проблема → решение → статус.

### 18. Приоритет архетипов: «Мастер боевых искусств» выше «Просветлённого»
- **Проблема:** при мультивыборе архетипов в выводе «Мастер боевых искусств» оказывался выше «Просветлённого», хотя это боевая под-ветка и должна уступать первенство любому архетипу.
- **Статус:** ☑ решено
  - В `computeArchetypes()` ([app.js](js/app.js)) после блока «Громилы» добавлен сдвиг: если в результате есть «Мастер боевых искусств» и он не единственный — он уводится в конец списка. Проверено: `[Просветлённый, Мастер боевых искусств]` независимо от порядка выбора.

### 19. Панель лошади ломалась при печати
- **Проблема:** в печати блок лошади не дробился (резервировал ~190px пустоты, выталкивая себя на след. страницу) и «скакала» ширина; плюс оружие/броня печатались бок-о-бок, а не друг под другом, как на экране.
- **Статус:** ☑ решено
  - В `@media print` ([layout.css](css/layout.css)) `.tables-row` переведён в одну колонку (`1fr`) — Оружие и Броня идут стопкой, как на экране.
  - Вложенные гриды лошади (`.horse-panel`, `.horse-panel-body`, `.horse-main`, `.horse-side`) расплющены в `display:block` + `break-inside:auto` — контент течёт и дробится на мини-блоки между страницами; декоративные «шторки» `::before/::after` и фикс-высоты убраны. Токен сжат в компактный блок сверху (фикс «скачущей» ширины). Мелкие элементы (`.horse-indicator`, `.mount-card`, строки таблицы и т.п.) защищены `break-inside:avoid`.

### 20. Лист не центрировался на странице
- **Проблема:** карта прижималась влево с пустой полосой справа (особенно в узкой панели). Позиционирование считается в JS (`updateSheetScale` в [instruction.js](js/modals/instruction.js)): (а) гаттер под кнопку «Инструкция» резервировался **только слева**, (б) `visualLeft` вычислялся в экранных px, но применялся как `margin-left` до `zoom: scale` → домножался на scale повторно (совпадало только при scale=1).
- **Статус:** ☑ решено
  - При закрытой панели гаттер резервируется **с обеих сторон** (`buttonGutter*2`) — есть симметричное место для центрирования, лист не лезет под кнопку.
  - `visualLeft = renderedLeft / scale` — компенсация `zoom`, фактический отступ совпадает с расчётным. Ветка открытой панели приведена к тем же единицам.
  - Проверено headless на разных ширинах: поля симметричны (950px → 96/96, 1600px → 112/113, 1920px → 272/273). Компромисс: на узких панелях лист чуть меньше (резерв и справа).

### 21. Фильтр выбора черт: добавлены архетипы
- **Проблема (доработка):** в выпадашке фильтра черт были только ранги; не было способа быстро посмотреть особые черты конкретного архетипа.
- **Статус:** ☑ решено
  - В попап фильтра ([filter.js](js/picker/filter.js)) добавлена группа из 8 архетипов (порядок из `ARCHETYPE_COLORS`). Новый режим `archetype:<Название>` в `getAvailableCatalogItems` ([helpers.js](js/picker/helpers.js)) показывает **вообще все** черты архетипа — независимо от того, выбран ли он, и независимо от текущего ранга. Подпись кнопки вычисляется (`edgeFilterModeLabel`). Попап получил `max-height:60vh; overflow-y:auto` ([picker.css](css/picker.css)) под удлинившийся список.

### 22. Блок повышений полностью не работал (регрессия от #7)
- **Проблема:** монетка повышения подсвечивалась, но модалка не реагировала — опции и «Подтвердить» мертвы. Причина: top-level вызов `updateHindranceAdvanceBtn()` в конце [advance.js](js/features/advance.js) кидал `state is not defined` при загрузке. После рефактора #7 `app.js` грузится **последним**, поэтому advance.js исполняется **до** `init()` (когда `state` ещё не готов). Неперехваченный throw срывал стоящую сразу под ним привязку `addEventListener` к `#advance-modal` (функции при этом hoisted → модалка открывалась, но клики не обрабатывались).
- **Статус:** ☑ решено
  - Привязка обработчика модалки вынесена **первой и безусловной** — её ничто не срывает.
  - Восстановление подписи кнопки изъянов отложено на `window 'load'` (после `init()`), вместо прямого вызова в теле файла.
  - 🔸 На будущее: проверить другие feature-файлы на top-level вызовы, зависящие от `state`/`init()` — тот же сдвиг #7 мог задеть и их.

### 23. Режим маршала: разблокировка зафиксированных разделов
- **Проблема (доработка):** после фиксации (Изъяны/Черты/Силы) маршалу нужен явный способ снять фиксацию, чтобы раздел снова можно было редактировать и зафиксировать заново (в т.ч. игроком).
- **Статус:** ☑ решено
  - Рядом с «+ Добавить» в каждой секции добавлена кнопка «🔓 Разблокировать» ([Char_sheet.html](Char_sheet.html), стиль в [choices.css](css/choices.css)). Видна **только** в режиме маршала и **только** если раздел зафиксирован (`hindrancesDone`/`edgesDone`/`powersDone`).
  - `updateSectionUnlockBtn()` вызывается из трёх `updateXLock` ([app.js](js/app.js)); обработчик `unlockSection` в делегированном клике; сама `unlockSection()` в [marshal.js](js/features/marshal.js) снимает `*Done`.
  - Для изъянов при разблокировке `extraPoints` сбрасывается в 0 (инвариант init `!hindrancesDone ⇒ extraPoints=0`), иначе повторная фиксация начислила бы очки изъянов второй раз.

### 24. Удаление черты маршалом: выбор «вернуть очки / без возврата»
- **Проблема (доработка):** при удалении черты всегда возвращались очки. Маршалу нужны оба сценария: переобучение (вернуть очки, черту можно купить заново) и регресс по сюжету (снять без компенсации — напр. потерял руку → «Два ствола» убирается, «Однорукий» выдаётся, очки не трогаются).
- **Статус:** ☑ решено
  - Логика удаления вынесена в `removeChoiceItem(type, index, refund)` ([choice.js](js/picker/choice.js)); флаг `refund` управляет возвратом 2 очков (только для черт).
  - При удалении черты **в режиме маршала** открывается модалка «Условия удаления» (`openEdgeRemovalModal`) с кнопками «Вернуть очки» / «Без возврата». Построена на общем `buildAcquisitionModal` из #11 (без нового CSS). Игрок (не маршал) удаляет как прежде — без модалки, с возвратом.

### 25. «Вернуться» в повышении не работало + хрупкое закрытие модалки
- **Проблема:** в модалке повышения кнопка «↺ Вернуться» (`advCancel`) не отменяла повышение — модалка оставалась открытой. Корень: в [commit.js](js/bootstrap/commit.js) деструктурированный флаг `renderTracks` **затенял** одноимённую глобальную функцию, поэтому `if (renderTracks) renderTracks()` выполнял `true()` → `TypeError`. `_advCancel` вызывает `commitSheetUpdate({ renderTracks: true })` и падал **до** `_advClose()`, оставляя модалку висеть (трек повышения при этом уже сбрасывался — отсюда ощущение «кнопка ничего не делает»). Для `renderMount` коллизию уже обходили через `shouldRenderMount`, но `renderTracks`, `renderCatalogPickers`, `renderArt` пропустили.
- **Статус:** ☑ решено
  - В [commit.js](js/bootstrap/commit.js) флаги `renderTracks`/`renderCatalogPickers`/`renderArt` переименованы в `shouldRenderTracks`/`shouldRenderCatalogPickers`/`shouldRenderArt` (как уже было сделано для `renderMount`) — вызов больше не затеняется. Это чинило ещё и `_cancelHindranceAdvance`, который тоже звал `renderTracks: true`.
  - Заодно усилил `_advClose()` ([advance.js](js/features/advance.js)): закрытие по `transitionend` дополнено fallback-таймаутом (300мс). Без него при несработавшем переходе (прерывание, reduced-motion, фон-вкладка) `#advance-modal` оставался видимым и его backdrop блокировал экран.
  - Проверка headless: клик «Вернуться» → `.open` снимается, `modal.hidden=true`, трек повышения сброшен; страница грузится без ошибок (190 кубик-кнопок).
  - 🔸 На будущее: латентные `renderCatalogPickers:true`/`renderArt:true` через commit тоже падали бы — теперь исправлены превентивно.

### 26. Деньги: нередактируемое поле + модалка прихода/расхода
- **Проблема (доработка):** поля денег ($ и ¢) редактировались напрямую — легко случайно затереть. Нужно: только для чтения, а изменение — через явное действие, причём как пополнение, так и списание (непредвиденные траты).
- **Статус:** ☑ решено
  - Поля `[data-bind="money"]`/`[data-bind="moneyCents"]` помечены `readonly` ([Char_sheet.html](Char_sheet.html)); рядом — компактная зелёная кнопка со значком «$» (`data-action="editMoney"`). `.money-fields` переведён в 3 колонки (`1fr 1fr auto`) — поля чуть у́же, справа кнопка. Стили — в [css/identity.css](css/identity.css) (модуль, реально подключённый через `css/styles.css`; корневой `styles.css` — мёртвый монолит, не линкуется — **изначально по ошибке правил его**).
  - Кнопка открывает модалку «Изменить наличность» (`openMoneyModal` в [money.js](js/features/money.js)) с полями доллары/центы и **двумя** действиями: «＋ Добавить» (`addMoney`) и «－ Списать» (`spendMoney`). Списание не уходит в минус: при нехватке — тост «Не хватает средств!», модалка остаётся открытой. Обработчик `editMoney` — в делегированном клике [app.js](js/app.js).
  - `addMoney(cents)` и `spendMoney(cents)` переносят центы в доллары и обновляют поля; оба сохраняют (`scheduleSave`). Деньги-гранты (Богатство/расклад) считаются дельтой в `syncMoneyGrants` ([app.js](js/app.js)) — ручные приход/расход ими не затираются.
  - Проверка headless: кнопка показывает «$»; модалка с 2 действиями; $5.00 ＋$2.50 → $7.50; $7.50 －$3.00 → $4.50 (закрытие); списание $999 при $4.50 → кошелёк не меняется, модалка открыта; без ошибок (190 кубик-кнопок).

---

## 🎨 CSS — раздутые файлы (аудит 2026-06-19)

Картина на момент аудита: 6 898 строк CSS в 18 файлах. Четыре файла превысили разумный порог (~1 000+ строк) и содержат несвязанные по смыслу секции.

### 27. `choices.css` — ЛОА и Чудотворец в файле карточек выбора (1 252 строки)
- **Проблема:** файл задуман для карточек изъянов/черт/сил (~137 строк) и таблиц снаряжения/оружия/брони (~285 строк), но 830 строк (67% файла, строки 423–1252) занимают архетипные панели ЛОА и Чудотворца — самостоятельная визуальная подсистема, не имеющая отношения к «choices».
- **План:** вынести таблицы снаряжения/оружия/брони (строки 138–422) в `css/gear-tables.css`; ЛОА и Чудотворца разводить в **отдельные файлы** — `css/loa.css` и `css/bv.css` (Божественные вмешательства), т.к. это разные архетипы с несвязанным UI. В `choices.css` оставить только карточки выбора (~137 строк).
- **Статус:** ☐ не решено

### 28. `picker.css` — Spirit Summoner и Power extended detail не на своём месте (1 105 строк)
- **Проблема:** picker.css обслуживает shell модалки, навигацию по группам оружия, бейджи, confirm-модалку, кнопку инструкции, статус джокера — и ещё Power extended detail (~153 строки, строки 629–781) и Spirit Summoner modal (~323 строки, строки 782–1105). Последние две секции — самостоятельные фичи с собственным UI, случайно осевшие в picker.css.
- **План:** вынести Power extended detail в `css/powers.css` (файл сейчас 50 строк и явно недозаполнен); Spirit Summoner — в новый `css/spirit.css`. В picker.css оставить: shell, filter, weapon nav, item rows, badges, confirm, instruction, joker (~629 строк).
- **Статус:** ☐ не решено

### 29. `mount.css` — монолит без секций (1 085 строк)
- **Проблема:** почти без внутренних разделов (три пометки за весь файл). В одном месте: панель лошади, характеристики, изъяны, таблица снаряжения (строки/карточки/лимиты), магазин (пейджер по категориям, карточки предметов), броня. Ситуация зеркалит `mount.js` до техдолга #4 — тогда 1 261 строку разнесли по 6 модулям.
- **План:** разбить по аналогии с JS-модулями: `css/mount/panel.css` (панель, показатели, изъяны), `css/mount/equipment.css` (таблица снаряжения, лимиты, броня), `css/mount/shop.css` (магазин, пейджер категорий, карточки товаров).
- **Статус:** ☐ не решено

### 30. `identity.css` — Weapon Acquisition Modal и Money Modal не в своём файле (771 строка)
- **Проблема:** identity.css содержит стили панели персонажа (~411 строк) плюс Weapon Acquisition Modal (строки 412–676, ~265 строк) и модалку денег (строки 677–771, ~95 строк). Обе модалки используются вне identity-контекста и логически относятся к слою модалок.
- **План:** вынести оба блока в `css/modals.css` (или `css/acquisition.css`) — там же могут жить стили других acquisition-модалок, уже объединённых через `buildAcquisitionModal` (#11). Identity.css при этом сократится до ~411 строк.
- **Статус:** ☐ не решено

---

_Обновляется по мере решения. Не закрывать пункт без отметки «как решено» и проверки загрузки._
