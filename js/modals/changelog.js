// -- История версий -----------------------------------------------------------
// Единственный источник данных - CHANGELOG.md.
// В обычном режиме файл читается через fetch(), а build-release.js встраивает
// этот же Markdown в single-file релиз, чтобы окно работало без внешних файлов.

const EMBEDDED_CHANGELOG_MARKDOWN = "";
let changelogDataPromise = null;

const CHANGELOG_SECTION_KINDS = {
  "Добавлено": "add",
  "Изменено": "change",
  "Исправлено": "fix",
  "Техническое": "tech",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatChangelogDate(date) {
  const match = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return date || "";

  return `${match[3]}.${match[2]}.${match[1]}`;
}

function parseChangelogHeading(line) {
  const match = line.match(/^##\s+(.+?)\s*$/);
  if (!match) return null;

  const rawTitle = match[1].trim();
  const versionMatch = rawTitle.match(/^(.+?)\s+-\s+(.+)$/);

  if (!versionMatch) {
    return { version: rawTitle, date: "" };
  }

  return {
    version: versionMatch[1].trim(),
    date: formatChangelogDate(versionMatch[2].trim()),
  };
}

function hasChangelogContent(version) {
  if (!version) return false;
  if (version.note) return true;

  return version.sections.some(section => section.items.length > 0);
}

function parseChangelogMarkdown(markdown) {
  const versions = [];
  let currentVersion = null;
  let currentSection = null;

  const pushVersion = () => {
    if (!hasChangelogContent(currentVersion)) return;
    versions.push(currentVersion);
  };

  String(markdown || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .forEach(rawLine => {
      const line = rawLine.trim();

      if (!line || line === "-") return;

      const versionHeading = parseChangelogHeading(line);
      if (versionHeading) {
        pushVersion();
        currentVersion = { ...versionHeading, note: "", sections: [] };
        currentSection = null;
        return;
      }

      if (!currentVersion) return;

      const sectionMatch = line.match(/^###\s+(.+?)\s*$/);
      if (sectionMatch) {
        const title = sectionMatch[1].trim();
        currentSection = {
          title,
          kind: CHANGELOG_SECTION_KINDS[title] || "change",
          items: [],
        };
        currentVersion.sections.push(currentSection);
        return;
      }

      const itemMatch = line.match(/^-\s+(.+)$/);
      if (itemMatch && currentSection) {
        currentSection.items.push(itemMatch[1].trim());
        return;
      }

      if (!currentSection) {
        currentVersion.note = currentVersion.note
          ? `${currentVersion.note} ${line}`
          : line;
      }
    });

  pushVersion();

  return versions;
}

async function readChangelogMarkdown() {
  if (EMBEDDED_CHANGELOG_MARKDOWN.trim()) return EMBEDDED_CHANGELOG_MARKDOWN;

  const response = await fetch("CHANGELOG.md", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`CHANGELOG.md: ${response.status}`);
  }

  return response.text();
}

function loadChangelogData() {
  if (!changelogDataPromise) {
    changelogDataPromise = readChangelogMarkdown().then(parseChangelogMarkdown);
  }

  return changelogDataPromise;
}

function renderChangelogBody(versions) {
  if (!versions.length) {
    return `<p class="changelog-note">История версий пока пуста.</p>`;
  }

  return versions.map(version => `
    <section class="changelog-version">
      <div class="changelog-version-head">
        <span class="changelog-version-num">${escapeHtml(version.version)}</span>
        ${version.date ? `<span class="changelog-version-date">${escapeHtml(version.date)}</span>` : ""}
      </div>
      ${version.note ? `<p class="changelog-note">${escapeHtml(version.note)}</p>` : ""}
      ${version.sections
        .filter(section => section.items.length > 0)
        .map(section => `
          <div class="changelog-section changelog-section--${section.kind}">
            <h4 class="changelog-section-title">${escapeHtml(section.title)}</h4>
            <ul class="changelog-list">
              ${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>`)
        .join("")}
    </section>`).join("");
}

function openChangelogModal() {
  document.querySelector(".changelog-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "changelog-modal";
  const close = () => modal.remove();

  const backdrop = document.createElement("div");
  backdrop.className = "changelog-backdrop";
  backdrop.addEventListener("click", close);

  const dialog = document.createElement("div");
  dialog.className = "changelog-dialog";
  dialog.innerHTML = `
    <div class="changelog-header">
      <div class="changelog-eyebrow">Deadlands · Лист персонажа</div>
      <h3 class="changelog-title">История версий</h3>
      <button type="button" class="changelog-close" aria-label="Закрыть">×</button>
    </div>
    <div class="changelog-body">
      <p class="changelog-note">Загрузка истории версий...</p>
    </div>`;

  dialog.querySelector(".changelog-close").addEventListener("click", close);
  dialog.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  modal.append(backdrop, dialog);
  document.body.append(modal);
  dialog.querySelector(".changelog-close").focus();

  const body = dialog.querySelector(".changelog-body");

  loadChangelogData()
    .then(versions => {
      body.innerHTML = renderChangelogBody(versions);
    })
    .catch(() => {
      body.innerHTML = `
        <p class="changelog-note">
          Не удалось загрузить CHANGELOG.md. Для автономного файла соберите релиз через build-release.js.
        </p>`;
    });
}
