const fs = require("fs");
const path = require("path");

const root = __dirname;
const constantsPath = path.join(root, "js", "constants.js");
const constants = fs.readFileSync(constantsPath, "utf8");
const versionMatch = constants.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);

if (!versionMatch) {
  throw new Error("APP_VERSION not found in js/constants.js");
}

const version = versionMatch[1];
const outputPath = path.join(
  root,
  "ReleaseVersion",
  `Deadlands_CharSheet_${version}.html`
);

const mimeByExt = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const dataUriCache = new Map();

function normalizeRelative(value) {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function dataUriFromPath(absolutePath) {
  const normalizedPath = path.normalize(absolutePath);

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Missing asset: ${normalizedPath}`);
  }

  if (!dataUriCache.has(normalizedPath)) {
    const ext = path.extname(normalizedPath).toLowerCase();
    const mime = mimeByExt[ext] || "application/octet-stream";
    const base64 = fs.readFileSync(normalizedPath).toString("base64");

    dataUriCache.set(normalizedPath, `data:${mime};base64,${base64}`);
  }

  return dataUriCache.get(normalizedPath);
}

function dataUriFromRef(ref, baseDir) {
  if (/^(data:|https?:|#)/i.test(ref)) return ref;

  const cleanRef = ref.split(/[?#]/)[0];
  const suffix = ref.slice(cleanRef.length);
  const decodedRef = decodeURI(cleanRef);
  const absolutePath = decodedRef.startsWith("assets/")
    ? path.join(root, decodedRef)
    : path.resolve(baseDir, decodedRef);

  return dataUriFromPath(absolutePath) + suffix;
}

function processCss(relativeFile) {
  const absoluteFile = path.resolve(root, relativeFile);
  const cssDir = path.dirname(absoluteFile);
  let css = fs.readFileSync(absoluteFile, "utf8");

  css = css.replace(
    /@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g,
    (_, importedFile) => {
      const importedAbsolute = path.resolve(cssDir, importedFile);
      const importedRelative = normalizeRelative(
        path.relative(root, importedAbsolute)
      );

      return `\n/* ${importedRelative} */\n${processCss(importedRelative)}\n`;
    }
  );

  css = css.replace(
    /url\(\s*(['"]?)(?!data:|https?:|#)([^'")]+)\1\s*\)/g,
    (_, _quote, ref) => `url("${dataUriFromRef(ref.trim(), cssDir)}")`
  );

  return css;
}

function removeExternalFonts(html) {
  return html
    .replace(
      /\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\r?\n?/g,
      ""
    )
    .replace(
      /\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\r?\n?/g,
      ""
    )
    .replace(
      /\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]+" \/>\r?\n?/g,
      ""
    );
}

function inlineCss(html) {
  const css = [
    `/* Deadlands Character Sheet release ${version}. Single-file build generated from source. */`,
    "/* css/styles.css */",
    processCss("css/styles.css"),
  ].join("\n");

  return html.replace(
    /<link rel="stylesheet" href="css\/styles\.css" \/>/,
    `<style>\n${css.replace(/<\/style/gi, "<\\/style")}\n</style>`
  );
}

function prepareScriptForInline(src, script) {
  let preparedScript = script;

  if (src === "js/modals/changelog.js") {
    const marker = 'const EMBEDDED_CHANGELOG_MARKDOWN = "";';
    const changelogMarkdown = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

    if (!preparedScript.includes(marker)) {
      throw new Error("Changelog embed marker not found in js/modals/changelog.js");
    }

    preparedScript = preparedScript.replace(
      marker,
      `const EMBEDDED_CHANGELOG_MARKDOWN = ${JSON.stringify(changelogMarkdown)};`
    );
  }

  return preparedScript.replace(/<\/script/gi, "<\\/script");
}

function inlineScripts(html) {
  return html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
    const scriptPath = path.join(root, src);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Missing script: ${src}`);
    }

    const script = prepareScriptForInline(src, fs.readFileSync(scriptPath, "utf8"));

    return `<script>\n/* ${src} */\n${script}\n</script>`;
  });
}

function inlineRemainingAssets(html) {
  return html.replace(
    /assets\/[A-Za-z0-9_+\-.\/%]+?\.(?:png|jpg|jpeg|gif|webp|svg)/gi,
    (ref) => dataUriFromRef(ref, root)
  );
}

function addReleaseHeader(html) {
  const withoutDoctype = html.trimStart().replace(/^<!doctype html>\s*/i, "");

  return [
    "<!doctype html>",
    `<!-- Deadlands Character Sheet release ${version}. Single-file build generated from source. -->`,
    withoutDoctype,
  ].join("\n");
}

let html = fs.readFileSync(path.join(root, "Char_sheet.html"), "utf8");

html = removeExternalFonts(html);
html = inlineCss(html);
html = html.replace(
  /<title>.*?<\/title>/,
  `<title>Deadlands: Лист персонажа (v${version})</title>`
);
html = inlineScripts(html);
html = inlineRemainingAssets(html);
html = addReleaseHeader(html);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");

console.log(`Built: ${outputPath}`);
console.log(`Version: ${version}`);
console.log(`Inlined assets: ${dataUriCache.size}`);
console.log(`Size: ${fs.statSync(outputPath).size}`);
