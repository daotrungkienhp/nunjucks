// ssg/deps.ts
import { walk } from "jsr:@std/fs";
import * as path from "jsr:@std/path";
import { extract } from "jsr:@std/front-matter/any";
import { parse } from "jsr:@std/yaml";
import { createGenerator } from "npm:@unocss/core@0.58.5";
import { default as default2 } from "npm:@unocss/preset-uno@0.58.5";
import { default as default3 } from "npm:@unocss/preset-attributify@0.58.5";
import { default as default4 } from "npm:@unocss/preset-typography@0.58.5";
import { default as default5 } from "npm:@unocss/preset-icons@0.58.5";
import * as _ from "npm:radash";
import nunjucks from "npm:nunjucks";
import { marked } from "npm:marked";
import sharp from "npm:sharp";

// ssg/cleaner.ts
async function cleanDir(dir) {
  await _.tryit(Deno.remove)(dir, { recursive: true });
  await Deno.mkdir(dir, { recursive: true });
}
function minifyHtml(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
}

// ssg/utils.ts
function normalizeString(str) {
  if (typeof str !== "string" || !str)
    return str;
  return _.title(str);
}
function slugifyUrl(str) {
  if (!str)
    return str;
  let slug = str.toLowerCase();
  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  slug = slug.replace(/[ìíịỉĩ]/g, "i");
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, "u");
  slug = slug.replace(/[ỳýỵỷỹ]/g, "y");
  slug = slug.replace(/đ/g, "d");
  slug = slug.replace(/[^a-z0-9\/]/g, "-");
  slug = slug.replace(/-+/g, "-");
  return slug.split("/").map((s) => s.replace(/^-+|-+$/g, "")).join("/");
}
function pickFields(obj, fields) {
  return _.pick(obj, fields);
}
function where_multiple(arr, queryObj, fields = null) {
  if (!arr || !Array.isArray(arr))
    return [];
  if (!queryObj || typeof queryObj !== "object" || Object.keys(queryObj).length === 0) {
    return fields ? arr.map((item) => _.pick(item, fields)) : arr;
  }
  const queryKeys = Object.keys(queryObj);
  const filtered = arr.filter((item) => {
    return queryKeys.every((key) => {
      const itemValue = item[key];
      const queryValue = queryObj[key];
      if (queryValue && typeof queryValue === "object" && "$ne" in queryValue) {
        return itemValue !== queryValue.$ne;
      }
      if (Array.isArray(itemValue)) {
        if (Array.isArray(queryValue)) {
          return itemValue.some((v) => queryValue.includes(v));
        }
        return itemValue.includes(queryValue);
      }
      if (Array.isArray(queryValue)) {
        return queryValue.includes(itemValue);
      }
      if (!item.hasOwnProperty(key))
        return false;
      return String(itemValue).toLowerCase() === String(queryValue).toLowerCase();
    });
  });
  return fields && Array.isArray(fields) && fields.length > 0 ? filtered.map((item) => _.pick(item, fields)) : filtered;
}
function getImageDimensions(filePath) {
  try {
    const file = Deno.openSync(filePath, { read: true });
    try {
      const buffer = new Uint8Array(2048);
      const bytesRead = file.readSync(buffer);
      if (!bytesRead || bytesRead < 8)
        return null;
      if (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10) {
        if (bytesRead >= 24) {
          const width = buffer[16] << 24 | buffer[17] << 16 | buffer[18] << 8 | buffer[19];
          const height = buffer[20] << 24 | buffer[21] << 16 | buffer[22] << 8 | buffer[23];
          return { width, height };
        }
      }
      if (buffer[0] === 71 && // G
      buffer[1] === 73 && // I
      buffer[2] === 70 && // F
      buffer[3] === 56 && // 8
      (buffer[4] === 55 || buffer[4] === 57) && // 7 or 9
      buffer[5] === 97) {
        if (bytesRead >= 10) {
          const width = buffer[6] | buffer[7] << 8;
          const height = buffer[8] | buffer[9] << 8;
          return { width, height };
        }
      }
      if (buffer[0] === 255 && buffer[1] === 216) {
        let offset = 2;
        while (offset < bytesRead - 8) {
          if (buffer[offset] !== 255) {
            break;
          }
          const marker = buffer[offset + 1];
          if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
            const height = buffer[offset + 5] << 8 | buffer[offset + 6];
            const width = buffer[offset + 7] << 8 | buffer[offset + 8];
            return { width, height };
          }
          const length = buffer[offset + 2] << 8 | buffer[offset + 3];
          offset += length + 2;
        }
      }
      if (buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 71 && // RIFF
      buffer[8] === 87 && buffer[9] === 69 && buffer[10] === 66 && buffer[11] === 80) {
        const chunkType = String.fromCharCode(buffer[12], buffer[13], buffer[14], buffer[15]);
        if (chunkType === "VP8 ") {
          const width = (buffer[27] & 63) << 8 | buffer[26];
          const height = (buffer[29] & 63) << 8 | buffer[28];
          return { width, height };
        } else if (chunkType === "VP8L") {
          if (buffer[20] === 47) {
            const b0 = buffer[21];
            const b1 = buffer[22];
            const b2 = buffer[23];
            const b3 = buffer[24];
            const width = 1 + ((b1 & 63) << 8 | b0);
            const height = 1 + ((b3 & 15) << 10 | b2 << 2 | (b1 & 192) >> 6);
            return { width, height };
          }
        } else if (chunkType === "VP8X") {
          const width = 1 + (buffer[24] | buffer[25] << 8 | buffer[26] << 16);
          const height = 1 + (buffer[27] | buffer[28] << 8 | buffer[29] << 16);
          return { width, height };
        }
      }
    } finally {
      file.close();
    }
  } catch (_e) {
  }
  return null;
}

// ssg/obsidian.ts
function processObsidianContent(content, idMap = {}) {
  if (!content)
    return "";
  return content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, src, alt) => {
    const altText = alt ? alt.trim() : "";
    return `![${altText}](${src.trim()})`;
  }).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, link, text) => {
    let target = link.trim();
    const displayText = text ? text.trim() : target;
    if (target.startsWith("id:")) {
      const id = target.replace("id:", "");
      if (idMap[id]) {
        target = idMap[id];
      }
    }
    return `[${displayText}](${target})`;
  });
}
function postProcessHtml(html) {
  if (!html)
    return "";
  return html.replace(/<([a-z1-6]+)([^>]*)>((?:(?!<\/\1>)[\s\S])*?)(?:\s+)?\^([a-zA-Z0-9-]+)<\/\1>/g, (match, tag, attrs, content, id) => {
    if (attrs.includes("id="))
      return match;
    return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
  }).replace(/<([a-z1-6]+)([^>]*)>((?:(?!<\/\1>)[\s\S])*?)(?:\s+)?\{([^}]+)\}<\/\1>/g, (match, tag, attrs, content, attrStr) => {
    let newAttrs = attrs;
    const parts = attrStr.match(/(?:[a-zA-Z0-9_-]+="[^"]*"|[a-zA-Z0-9_-]+='[^']*'|\.[a-zA-Z0-9_:-]+|#[a-zA-Z0-9_-]+|[^\s{}]+)/g) || [];
    parts.forEach((part) => {
      if (part.startsWith("#")) {
        const id = part.slice(1);
        if (!newAttrs.includes("id=")) {
          newAttrs += ` id="${id}"`;
        }
      } else if (part.startsWith(".")) {
        const cls = part.slice(1);
        if (newAttrs.includes('class="')) {
          newAttrs = newAttrs.replace('class="', `class="${cls} `);
        } else {
          newAttrs += ` class="${cls}"`;
        }
      } else if (part.includes("=")) {
        const eqIndex = part.indexOf("=");
        const key = part.substring(0, eqIndex).trim();
        const val = part.substring(eqIndex + 1).replace(/["']/g, "").trim();
        newAttrs += ` ${key}="${val}"`;
      } else {
        if (newAttrs.includes('class="')) {
          newAttrs = newAttrs.replace('class="', `class="${part} `);
        } else {
          newAttrs += ` class="${part}"`;
        }
      }
    });
    return `<${tag}${newAttrs}>${content}</${tag}>`;
  }).replace(/<(h[2-6])([^>]*)>([\s\S]*?)<\/\1>/g, (match, tag, attrs, text) => {
    if (attrs.includes("id="))
      return match;
    const cleanText = text.replace(/<[^>]+>/g, "").replace(/[\*_~]/g, "").trim();
    const id = slugifyUrl(cleanText);
    return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
  }).replace(/<p>\s*<\/p>/g, "");
}
function processObsidianFrontMatter(data) {
  const newData = { ...data };
  if (data.images_list && Array.isArray(data.images_list)) {
    newData.images = data.images_list.map((item) => {
      if (typeof item === "string" && item.includes("|")) {
        const [url, desc] = item.split("|").map((s) => s.trim());
        return { url, desc };
      }
      return item;
    });
  }
  if (data.property_data && typeof data.property_data === "object") {
    Object.assign(newData, data.property_data);
  }
  return newData;
}
function cleanContentForAI(content) {
  if (!content)
    return "";
  return content.replace(/\s+\^[a-zA-Z0-9-]+(?=\s|$)/g, "").replace(/\{:[^}]+\}/g, "").replace(/\{[^}]+\}/g, "").replace(/%%[\s\S]*?%%/g, "").split("\n").map((line) => line.trimEnd()).join("\n").trim();
}

// ssg/content.ts
var GlobalIdRegistry = {};
async function collectContent(srcDir, options = {}) {
  const pages = [];
  const { exts = [".md"], recursive = true, transform } = options;
  const dirMetadataCache = {};
  try {
    for await (const entry of walk(srcDir, { includeDirs: false, exts, maxDepth: recursive ? Infinity : 1 })) {
      try {
        const raw = await Deno.readTextFile(entry.path);
        let { attrs: fm, body } = extract(raw);
        const dirPath = path.dirname(entry.path);
        const inheritedMetadata = await getInheritedMetadata(srcDir, dirPath, dirMetadataCache);
        fm = deepMerge(inheritedMetadata, fm);
        try {
          const schemaFile = path.join(dirPath, "schema.json");
          const schemaContent = await Deno.readTextFile(schemaFile);
          fm._schema = JSON.parse(schemaContent);
        } catch {
        }
        fm = processObsidianFrontMatter(fm);
        if (!fm.permalink) {
          const fileName = path.basename(entry.path, path.extname(entry.path));
          const baseTitle = fm.title || fileName;
          fm.permalink = `/${slugifyUrl(baseTitle)}/`;
        } else if (!fm.permalink.endsWith("/")) {
          fm.permalink += "/";
        }
        let page = {
          ...fm,
          _body: body,
          _path: entry.path,
          _filename: path.basename(entry.path)
        };
        if (page.id) {
          GlobalIdRegistry[String(page.id)] = page.permalink;
        }
        if (transform)
          page = transform(page);
        pages.push(page);
      } catch (err) {
        console.warn(`[Skip] L\u1ED7i t\u1EA1i file ${entry.path}:`, err.message);
      }
    }
  } catch (err) {
    console.warn(`[Error] Kh\xF4ng th\u1EC3 qu\xE9t th\u01B0 m\u1EE5c ${srcDir}:`, err.message);
  }
  return pages;
}
async function getInheritedMetadata(baseDir, currentDir, cache) {
  const parts = path.relative(baseDir, currentDir).split(/[\\/]/).filter((p) => p && p !== ".");
  let fullMetadata = {};
  const dirsToCheck = [baseDir, ...parts.map((_3, i) => path.join(baseDir, ...parts.slice(0, i + 1)))];
  for (const dir of dirsToCheck) {
    if (cache[dir]) {
      fullMetadata = { ...fullMetadata, ...cache[dir] };
      continue;
    }
    const metadataFile = path.join(dir, "_metadata.json");
    try {
      const stats = await Deno.stat(metadataFile);
      if (stats.isFile) {
        const content = await Deno.readTextFile(metadataFile);
        const data = JSON.parse(content);
        cache[dir] = data;
        fullMetadata = { ...fullMetadata, ...data };
      }
    } catch {
      cache[dir] = {};
    }
  }
  return fullMetadata;
}
function deepMerge(target, source) {
  if (typeof target !== "object" || target === null || typeof source !== "object" || source === null) {
    return source;
  }
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] instanceof Object && target[key] instanceof Object) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

// ssg/database.ts
async function buildDatabase(pages, folderPattern, jsonFileName, fields = null, saveDir = "./dist", filter = null, baseDir) {
  const matched = [];
  const patterns = Array.isArray(folderPattern) ? folderPattern : [folderPattern];
  const metadataCache = {};
  for (let page of pages) {
    if (!page._path)
      continue;
    const dirPath = path.dirname(page._path);
    if (baseDir) {
      const inheritedMetadata = await getInheritedMetadata(baseDir, dirPath, metadataCache);
      const merged = deepMerge(inheritedMetadata, page);
      Object.assign(page, merged);
    }
    const normalizedPath = page._path.replace(/\\/g, "/").toLowerCase();
    const isMatch = patterns.some((p) => {
      const normalizedPattern = p.replace(/\\/g, "/").toLowerCase();
      return normalizedPath.includes(normalizedPattern);
    });
    let passesFilter = true;
    if (filter) {
      if (typeof filter === "function") {
        passesFilter = filter(page);
      } else {
        passesFilter = Object.entries(filter).every(([key, value]) => page[key] === value);
      }
    }
    if (isMatch && passesFilter) {
      if (page.category) {
        const catName = String(page.category).trim();
        page.categorySlug = slugifyUrl(catName);
      }
      if (page.direction) {
        page.direction = normalizeString(page.direction);
      }
      matched.push(fields ? _.pick(page, fields) : page);
    }
  }
  if (saveDir) {
    await Deno.mkdir(saveDir, { recursive: true });
    const finalPath = path.join(saveDir, jsonFileName);
    await Deno.writeTextFile(finalPath, JSON.stringify(matched, null, 2));
    console.log(`[Export JSON] -> ${finalPath} (${matched.length} items)`);
  }
  return matched;
}

// ssg/unocss.ts
async function generateCss(outDir = "./dist", config, cssFile = "uno.css") {
  const defaultConfig = {
    presets: [
      default2(),
      default3(),
      default4()
    ]
  };
  const uno = createGenerator(config || defaultConfig);
  try {
    console.log(`\u{1F3A8} \u0110ang qu\xE9t v\xE0 sinh CSS t\u1EA1i: ${outDir}`);
    let combinedHtml = "";
    for await (const entry of walk(outDir, { exts: [".html"] })) {
      combinedHtml += await Deno.readTextFile(entry.path) + "\n";
    }
    const { css } = await uno.generate(combinedHtml);
    const cssPath = path.join(outDir, cssFile);
    await Deno.mkdir(path.dirname(cssPath), { recursive: true });
    await Deno.writeTextFile(cssPath, css);
    console.log(`\u2728 \u0110\xE3 t\u1EA1o file CSS th\xE0nh c\xF4ng: ${cssPath}`);
  } catch (e) {
    console.error("\u274C L\u1ED7i UnoCSS:", e.message);
  }
}
async function generateShortcuts(searchDirs, outputFile) {
  const allShortcuts = {};
  for (const dir of searchDirs) {
    try {
      const stat = await Deno.stat(dir);
      if (!stat.isDirectory)
        continue;
      for await (const entry of walk(dir, { exts: [".uno.json"] })) {
        try {
          const content = await Deno.readTextFile(entry.path);
          const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, "");
          const data = JSON.parse(cleanContent);
          const shortcuts = data.shortcuts || data;
          Object.assign(allShortcuts, shortcuts);
          console.log(`  \u{1F4E6} Loaded shortcuts from: ${path.relative(Deno.cwd(), entry.path)}`);
        } catch (err) {
          console.error(`  \u274C Error loading ${entry.path}:`, err.message);
        }
      }
    } catch (_err) {
    }
  }
  await Deno.writeTextFile(outputFile, JSON.stringify(allShortcuts, null, 2));
  console.log(`\u2728 Generated ${outputFile} with ${Object.keys(allShortcuts).length} shortcuts.`);
}

// ssg/sitemap.ts
async function generateSitemap(pages, siteUrl, outDir = "./dist", options = {}) {
  console.log("\u{1F5FA}\uFE0F \u0110ang sinh file sitemap...");
  try {
    const siteName = options.siteName || "SSG Site";
    const indexablePages = pages.filter((p) => p.noindex !== true && p.noindex !== "true");
    const formatDate = (dateVal) => {
      if (!dateVal) {
        const d = /* @__PURE__ */ new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) {
          const now = /* @__PURE__ */ new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        }
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      } catch (_err) {
        const now = /* @__PURE__ */ new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      }
    };
    const makeLoc = (siteUrl2, permalink) => {
      const base = siteUrl2.endsWith("/") ? siteUrl2.slice(0, -1) : siteUrl2;
      const urlPath = permalink.startsWith("/") ? permalink : "/" + permalink;
      return base + urlPath;
    };
    const extractImages = (p) => {
      const imgs = /* @__PURE__ */ new Set();
      if (p.featureImage) {
        imgs.add(p.featureImage);
      }
      if (p.images && Array.isArray(p.images)) {
        p.images.forEach((img) => {
          if (typeof img === "string")
            imgs.add(img);
          else if (typeof img === "object" && img.url)
            imgs.add(img.url);
        });
      }
      if (p._body) {
        const regex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = regex.exec(p._body)) !== null) {
          const [url] = match[1].split("#");
          if (url) {
            imgs.add(url);
          }
        }
      }
      const result = [];
      for (const img of imgs) {
        if (img.startsWith("http") || img.startsWith("//")) {
          result.push(img);
        } else {
          const ext = path.extname(img);
          const baseName = path.basename(img, ext);
          const webpName = `${baseName}.webp`;
          result.push(makeLoc(siteUrl, path.join(p.permalink || "/", webpName)));
        }
      }
      return result;
    };
    const today = formatDate(null);
    let groups = options.groups || [];
    if (groups.length === 0) {
      const postsFolders = options.postsFolders || [];
      const listingsFolders = options.listingsFolders || [];
      groups = [
        {
          name: "Posts",
          filename: "sitemap-posts.xml",
          filter: (p) => postsFolders.length > 0 && postsFolders.some((f) => p._path.includes(f)),
          changefreq: "weekly",
          priority: 0.8
        },
        {
          name: "Listings",
          filename: "sitemap-listings.xml",
          filter: (p) => listingsFolders.length > 0 && listingsFolders.some((f) => p._path.includes(f)),
          changefreq: "daily",
          priority: 0.9
        },
        {
          name: "Pages",
          filename: "sitemap-pages.xml",
          filter: (p) => !postsFolders.some((f) => p._path.includes(f)) && !listingsFolders.some((f) => p._path.includes(f)),
          changefreq: "weekly",
          priority: 0.7
        }
      ];
    }
    const sitemapsToCreate = [];
    for (const group of groups) {
      const matchedPages = indexablePages.filter(group.filter);
      if (matchedPages.length > 0) {
        sitemapsToCreate.push({
          filename: group.filename,
          locs: matchedPages.map((p) => ({
            loc: makeLoc(siteUrl, p.permalink),
            lastmod: formatDate(p.date || p.lastmod),
            changefreq: p.changefreq || group.changefreq || "weekly",
            priority: p.priority || group.priority || 0.5,
            images: extractImages(p)
          }))
        });
      }
    }
    let xsl = `<?xml version="1.0" encoding="UTF-8"?>
`;
    xsl += `<xsl:stylesheet version="2.0"
`;
    xsl += `                xmlns:html="http://www.w3.org/TR/REC-html40"
`;
    xsl += `                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
`;
    xsl += `                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
`;
    xsl += `                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
`;
    xsl += `    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
`;
    xsl += `    <xsl:template match="/">
`;
    xsl += `        <html xmlns="http://www.w3.org/1999/xhtml">
`;
    xsl += `            <head>
`;
    xsl += `                <title>XML Sitemap | ${siteName}</title>
`;
    xsl += `                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
`;
    xsl += `                <style type="text/css">
`;
    xsl += `                    body { font-family: sans-serif; color: #1a202c; background-color: #f7fafc; margin: 0; padding: 40px 20px; }
`;
    xsl += `                    .container { max-width: 1024px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
`;
    xsl += `                    h1 { font-size: 28px; margin-bottom: 5px; color: #111; }
`;
    xsl += `                    p.desc { color: #718096; margin-bottom: 25px; font-size: 14px; }
`;
    xsl += `                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
`;
    xsl += `                    th { text-align: left; padding: 12px 10px; border-bottom: 2px solid #edf2f7; color: #4a5568; font-size: 14px; text-transform: uppercase; }
`;
    xsl += `                    td { padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
`;
    xsl += `                    tr:hover td { background-color: #f7fafc; }
`;
    xsl += `                    a { color: #3182ce; text-decoration: none; }
`;
    xsl += `                    a:hover { text-decoration: underline; }
`;
    xsl += `                </style>
`;
    xsl += `            </head>
`;
    xsl += `            <body>
`;
    xsl += `                <div class="container">
`;
    xsl += `                    <h1>XML Sitemap</h1>
`;
    xsl += `                    <p class="desc">Sitemap n\xE0y \u0111\u01B0\u1EE3c t\u1EA1o t\u1EF1 \u0111\u1ED9ng b\u1EDFi ${siteName} SSG.</p>
`;
    xsl += `                    <xsl:if test="sitemap:sitemapindex">
`;
    xsl += `                        <p class="desc">S\u1ED1 l\u01B0\u1EE3ng sitemap con: <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></p>
`;
    xsl += `                        <table>
`;
    xsl += `                            <thead><tr><th>Sitemap URL</th><th>Last Modified</th></tr></thead>
`;
    xsl += `                            <tbody>
`;
    xsl += `                                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
`;
    xsl += `                                    <tr><td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td><td><xsl:value-of select="sitemap:lastmod"/></td></tr>
`;
    xsl += `                                </xsl:for-each>
`;
    xsl += `                            </tbody>
`;
    xsl += `                        </table>
`;
    xsl += `                    </xsl:if>
`;
    xsl += `                    <xsl:if test="sitemap:urlset">
`;
    xsl += `                        <p class="desc">S\u1ED1 l\u01B0\u1EE3ng li\xEAn k\u1EBFt (URLs): <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></p>
`;
    xsl += `                        <table>
`;
    xsl += `                            <thead><tr><th>URL</th><th>Last Modified</th><th>Change Freq</th><th>Priority</th><th>Images</th></tr></thead>
`;
    xsl += `                            <tbody>
`;
    xsl += `                                <xsl:for-each select="sitemap:urlset/sitemap:url">
`;
    xsl += `                                    <tr>
`;
    xsl += `                                        <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
`;
    xsl += `                                        <td><xsl:value-of select="sitemap:lastmod"/></td>
`;
    xsl += `                                        <td><xsl:value-of select="sitemap:changefreq"/></td>
`;
    xsl += `                                        <td><xsl:value-of select="sitemap:priority"/></td>
`;
    xsl += `                                        <td>
`;
    xsl += `                                            <xsl:if test="image:image">
`;
    xsl += `                                                <details style="cursor: pointer;">
`;
    xsl += `                                                    <summary><xsl:value-of select="count(image:image)"/></summary>
`;
    xsl += `                                                    <div>
`;
    xsl += `                                                        <xsl:for-each select="image:image">
`;
    xsl += `                                                            <div><a href="{image:loc}" target="_blank"><xsl:value-of select="image:loc"/></a></div>
`;
    xsl += `                                                        </xsl:for-each>
`;
    xsl += `                                                    </div>
`;
    xsl += `                                                </details>
`;
    xsl += `                                            </xsl:if>
`;
    xsl += `                                        </td>
`;
    xsl += `                                    </tr>
`;
    xsl += `                                </xsl:for-each>
`;
    xsl += `                            </tbody>
`;
    xsl += `                        </table>
`;
    xsl += `                    </xsl:if>
`;
    xsl += `                </div>
`;
    xsl += `            </body>
`;
    xsl += `        </html>
`;
    xsl += `    </xsl:template>
`;
    xsl += `</xsl:stylesheet>
`;
    await Deno.writeTextFile(path.join(outDir, "main-sitemap.xsl"), xsl);
    for (const s of sitemapsToCreate) {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
      xml += `<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
`;
      xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;
      for (const entry of s.locs) {
        xml += `  <url>
`;
        xml += `    <loc>${entry.loc}</loc>
`;
        xml += `    <lastmod>${entry.lastmod}</lastmod>
`;
        xml += `    <changefreq>${entry.changefreq}</changefreq>
`;
        xml += `    <priority>${entry.priority}</priority>
`;
        if (entry.images && entry.images.length > 0) {
          for (const imgUrl of entry.images) {
            xml += `    <image:image>
`;
            xml += `      <image:loc>${imgUrl}</image:loc>
`;
            xml += `    </image:image>
`;
          }
        }
        xml += `  </url>
`;
      }
      xml += `</urlset>
`;
      await Deno.writeTextFile(path.join(outDir, s.filename), xml);
    }
    let indexXml = `<?xml version="1.0" encoding="UTF-8"?>
`;
    indexXml += `<?xml-stylesheet type="text/xsl" href="/main-sitemap.xsl"?>
`;
    indexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
    for (const s of sitemapsToCreate) {
      indexXml += `  <sitemap>
`;
      indexXml += `    <loc>${siteUrl}/${s.filename}</loc>
`;
      indexXml += `    <lastmod>${today}</lastmod>
`;
      indexXml += `  </sitemap>
`;
    }
    indexXml += `</sitemapindex>
`;
    await Deno.writeTextFile(path.join(outDir, "sitemap.xml"), indexXml);
    console.log(`\u2728 \u0110\xE3 sinh sitemap.xml th\xE0nh c\xF4ng (Sitemaps: ${sitemapsToCreate.length})!`);
  } catch (e) {
    console.error("\u274C L\u1ED7i sinh sitemap:", e.message);
  }
}

// ssg/toc.ts
function renderToc(html, options = {}) {
  const marker = options.marker || "[toc]";
  if (!html || !html.includes(marker))
    return html;
  const defaultOpen = options.defaultOpen === true;
  const { renderTocHtml } = options;
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(/<(h[2-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (match2, tag, attrs, text) => {
    if (attrs.includes("id="))
      return match2;
    const cleanText = text.replace(/<[^>]+>/g, "").replace(/[\*_~]/g, "").trim();
    const id = slugifyUrl(cleanText);
    return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
  });
  const headingRegex = /<(h[2-6])(?: id="([^"]+)")?[^>]*>([\s\S]*?)<\/\1>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1].substring(1));
    const text = match[3].replace(/<[^>]+>/g, "").replace(/[\*_~]/g, "").trim();
    const id = match[2] || slugifyUrl(text);
    headings.push({ level, text, id });
  }
  if (headings.length === 0) {
    const removeRegex = new RegExp(`<p>\\s*${escapedMarker}\\s*</p>|${escapedMarker}`, "gi");
    return html.replace(removeRegex, "");
  }
  let tocHtml = "";
  if (renderTocHtml) {
    tocHtml = renderTocHtml(headings, defaultOpen);
  } else {
    tocHtml = `<div x-data="{ open: ${defaultOpen} }" class="toc">
`;
    tocHtml += `  <div @click="open = !open" class="toc__header">
`;
    tocHtml += `    <span class="toc__title">
`;
    tocHtml += `      <span class="toc__icon"></span> M\u1EE5c l\u1EE5c
`;
    tocHtml += `    </span>
`;
    tocHtml += `    <span class="toc__toggle">
`;
    tocHtml += `      <span :class="open ? 'toc__toggle-icon toc__toggle-icon--open' : 'toc__toggle-icon'"></span>
`;
    tocHtml += `    </span>
`;
    tocHtml += `  </div>
`;
    tocHtml += `  <div x-show="open" class="toc__content">
`;
    tocHtml += `    <ul class="toc__list">
`;
    const minLevel = Math.min(...headings.map((x) => x.level));
    const counters = Array(7).fill(0);
    for (const h of headings) {
      const level = h.level;
      counters[level]++;
      for (let i = level + 1; i <= 6; i++) {
        counters[i] = 0;
      }
      const prefixParts = [];
      for (let i = minLevel; i <= level; i++) {
        prefixParts.push(counters[i] || 1);
      }
      let prefix = prefixParts.join(".");
      if (level === minLevel) {
        prefix += ".";
      }
      const indent = h.level - 2;
      tocHtml += `      <li class="toc__item toc__item--level-${h.level}" style="--toc-indent: ${indent}">
`;
      tocHtml += `        <a href="#${h.id}" class="toc__link">
`;
      tocHtml += `          <span class="toc__link-prefix">${prefix}</span>
`;
      tocHtml += `          <span class="toc__link-text">${h.text}</span>
`;
      tocHtml += `        </a>
`;
      tocHtml += `      </li>
`;
    }
    tocHtml += `    </ul>
`;
    tocHtml += `  </div>
`;
    tocHtml += `</div>
`;
  }
  const replaceRegex = new RegExp(`<p>\\s*${escapedMarker}\\s*</p>|${escapedMarker}`, "gi");
  return html.replace(replaceRegex, tocHtml);
}

// ssg/images.ts
import sharp2 from "npm:sharp";
function processAnyImages(obj, srcDir, outDir, basePermalink, imageProcessingQueue, fieldName, options = { autoRename: true }) {
  if (!obj)
    return obj;
  if (typeof obj === "string") {
    const parts = obj.split("|");
    const url = parts[0].trim();
    const desc = parts[1] ? parts[1].trim() : "";
    if (url && !url.startsWith("http") && !url.startsWith("/") && !url.startsWith("//")) {
      const [urlWithoutHash] = url.split("#");
      const [cleanUrl, queryString] = urlWithoutHash.split("?");
      const params = new URLSearchParams(queryString || "");
      const widthStr = params.get("w");
      const width = widthStr ? parseInt(widthStr, 10) : null;
      const ext = path.extname(cleanUrl).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
        try {
          const srcImgPath = path.join(srcDir, cleanUrl);
          if (Deno.statSync(srcImgPath).isFile) {
            const baseName = path.basename(cleanUrl, ext);
            let webpName = `${baseName}.webp`;
            if (options.autoRename) {
              if (fieldName === "featureImage") {
                webpName = "feature-image.webp";
              } else if (fieldName === "facebookImage") {
                webpName = "facebook-image.webp";
              } else if (fieldName === "twitterImage") {
                webpName = "twitter-image.webp";
              } else if (fieldName === "ogImage") {
                webpName = "og-image.webp";
              }
            }
            if (width && !isNaN(width)) {
              const namePart = path.basename(webpName, ".webp");
              webpName = `${namePart}-${width}w.webp`;
            }
            const outImgPath = path.join(outDir, webpName);
            imageProcessingQueue.push(
              (async () => {
                try {
                  let pipeline = sharp2(srcImgPath);
                  if (width && !isNaN(width)) {
                    pipeline = pipeline.resize(width);
                  }
                  await pipeline.webp({ quality: 80 }).toFile(outImgPath);
                } catch (_err) {
                  try {
                    Deno.copyFileSync(srcImgPath, path.join(outDir, webpName));
                  } catch (_e) {
                  }
                }
              })()
            );
            return `${basePermalink}${webpName}${desc ? " | " + desc : ""}`;
          }
        } catch (_e) {
        }
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = processAnyImages(obj[i], srcDir, outDir, basePermalink, imageProcessingQueue, fieldName, options);
    }
    return obj;
  }
  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === "_body" || key === "template" || key === "layout" || key === "permalink")
          continue;
        obj[key] = processAnyImages(obj[key], srcDir, outDir, basePermalink, imageProcessingQueue, key, options);
      }
    }
    return obj;
  }
  return obj;
}

// ssg/markdown.ts
function createMarkedRenderer(options) {
  const {
    imageQueue,
    getSrcDir,
    getOutDir,
    imageBaseUrl = "",
    imageSizes = [],
    renderImage,
    renderFigure
  } = options;
  return {
    image(token) {
      const { href, title, text } = token;
      const [urlWithoutHash] = href.split("#");
      const [cleanUrl, queryString] = urlWithoutHash.split("?");
      const params = new URLSearchParams(queryString || "");
      const widthStr = params.get("w");
      const heightStr = params.get("h");
      const width = widthStr ? parseInt(widthStr, 10) : null;
      const height = heightStr ? parseInt(heightStr, 10) : null;
      let outUrl = cleanUrl + (queryString ? `?${queryString}` : "");
      let srcset = "";
      let renderedWidth = void 0;
      let renderedHeight = void 0;
      if (!cleanUrl.startsWith("http") && !cleanUrl.startsWith("//") && !cleanUrl.startsWith("/")) {
        try {
          const srcDir = getSrcDir();
          const outDir = getOutDir();
          const srcImagePath = path.join(srcDir, cleanUrl);
          const ext = path.extname(cleanUrl);
          const baseName = path.basename(cleanUrl, ext);
          try {
            const stats = Deno.statSync(srcImagePath);
            if (stats.isFile) {
              const originalDimensions = getImageDimensions(srcImagePath);
              if (originalDimensions) {
                const { width: originalWidth, height: originalHeight } = originalDimensions;
                if (width && !isNaN(width)) {
                  renderedWidth = width;
                  renderedHeight = height || Math.round(originalHeight * (width / originalWidth));
                } else {
                  renderedWidth = originalWidth;
                  renderedHeight = originalHeight;
                }
              } else if (width && !isNaN(width)) {
                renderedWidth = width;
                if (height && !isNaN(height)) {
                  renderedHeight = height;
                }
              }
              if (width && !isNaN(width)) {
                const webpName = `${baseName}-${width}w.webp`;
                const outImagePath = path.join(outDir, webpName);
                outUrl = path.join(imageBaseUrl, webpName).replace(/\\/g, "/");
                imageQueue.push(
                  (async () => {
                    try {
                      await sharp(srcImagePath).resize(width).webp({ quality: 80 }).toFile(outImagePath);
                    } catch (err) {
                      console.error(`\u274C L\u1ED7i x\u1EED l\xFD \u1EA3nh size ${width}:`, err.message);
                      try {
                        Deno.copyFileSync(srcImagePath, outImagePath);
                      } catch (_e) {
                      }
                    }
                  })()
                );
              } else if (imageSizes.length > 0) {
                const srcsetParts = [];
                for (const size of imageSizes) {
                  const webpName = `${baseName}-${size}w.webp`;
                  const outImagePath = path.join(outDir, webpName);
                  const webpUrl = path.join(imageBaseUrl, webpName).replace(/\\/g, "/");
                  srcsetParts.push(`${webpUrl} ${size}w`);
                  imageQueue.push(
                    (async () => {
                      try {
                        await sharp(srcImagePath).resize(size).webp({ quality: 80 }).toFile(outImagePath);
                      } catch (err) {
                        console.error(`\u274C L\u1ED7i x\u1EED l\xFD \u1EA3nh size ${size}:`, err.message);
                      }
                    })()
                  );
                }
                srcset = srcsetParts.join(", ");
                outUrl = path.join(imageBaseUrl, `${baseName}-${imageSizes[0]}w.webp`).replace(/\\/g, "/");
              } else {
                const webpName = `${baseName}.webp`;
                const outImagePath = path.join(outDir, webpName);
                outUrl = path.join(imageBaseUrl, webpName).replace(/\\/g, "/");
                imageQueue.push(
                  (async () => {
                    try {
                      await sharp(srcImagePath).webp({ quality: 80 }).toFile(outImagePath);
                    } catch (_err) {
                      try {
                        Deno.copyFileSync(srcImagePath, outImagePath);
                      } catch (_e) {
                      }
                    }
                  })()
                );
              }
            }
          } catch (_e) {
          }
        } catch (_e) {
        }
      } else {
        if (width && !isNaN(width)) {
          renderedWidth = width;
          if (height && !isNaN(height)) {
            renderedHeight = height;
          }
        }
      }
      let imgHtml = "";
      let useRenderImage = false;
      if (renderImage) {
        imgHtml = renderImage({
          src: outUrl,
          alt: text || "",
          title: title || void 0,
          srcset: srcset || void 0,
          originalUrl: href,
          width: renderedWidth,
          height: renderedHeight
        });
        useRenderImage = true;
      } else {
        let imgTag = `<img src="${outUrl}"`;
        if (srcset)
          imgTag += ` srcset="${srcset}" sizes="(max-width: ${imageSizes[imageSizes.length - 1]}px) 100vw, ${imageSizes[imageSizes.length - 1]}px"`;
        imgTag += ` alt="${text || ""}" loading="lazy" class="ssg-image"`;
        if (title)
          imgTag += ` title="${title}"`;
        if (renderedWidth !== void 0)
          imgTag += ` width="${renderedWidth}"`;
        if (renderedHeight !== void 0)
          imgTag += ` height="${renderedHeight}"`;
        imgTag += ">";
        imgHtml = imgTag;
      }
      if (text && text.trim()) {
        if (renderFigure) {
          return renderFigure({
            imgTag: imgHtml,
            text,
            src: outUrl,
            alt: text,
            title: title || void 0,
            srcset: srcset || void 0,
            originalUrl: href,
            width: renderedWidth,
            height: renderedHeight
          });
        }
        if (useRenderImage) {
          return imgHtml;
        }
        return `
<figure class="ssg-figure">
  ${imgHtml}
  <figcaption class="ssg-figure__caption">${text}</figcaption>
</figure>`.trim();
      }
      return imgHtml;
    }
  };
}

// ssg/engine.ts
function registerFilters(env) {
  env.addFilter("normalize", (str) => normalizeString(str));
  env.addFilter("slugify", (str) => slugifyUrl(str));
  env.addFilter("merge", (obj1, obj2) => ({ ...obj1, ...obj2 }));
  env.addFilter("where_multiple", (arr, query, fields = null) => where_multiple(arr, query, fields));
  env.addFilter("sharp", (src) => src);
  env.addFilter("markdown", (str) => {
    if (!str)
      return "";
    return marked(str);
  });
  env.addFilter("parseAttr", (str) => {
    if (typeof str !== "string" || !str) {
      return { text: str || "", id: "", classes: "" };
    }
    const attrRegex = /\s+\{([^}]+)\}\s*$/;
    const match = str.match(attrRegex);
    let text = str;
    let id = "";
    let classes = "";
    if (match) {
      text = str.substring(0, match.index).trim();
      const attrContent = match[1].trim();
      const parts = attrContent.split(/\s+/);
      const classList = [];
      for (const part of parts) {
        if (part.startsWith("#")) {
          if (!id)
            id = part.slice(1);
        } else if (part.startsWith(".")) {
          classList.push(part.slice(1));
        } else {
          classList.push(part);
        }
      }
      classes = Array.from(new Set(classList)).join(" ");
    }
    return { text, id, classes };
  });
  env.addFilter("date", (dateVal) => {
    if (!dateVal)
      return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime()))
        return String(dateVal);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch (_err) {
      return String(dateVal);
    }
  });
  env.addFilter("dump", (obj) => {
    if (typeof obj === "string")
      return obj;
    try {
      return JSON.stringify(obj);
    } catch (_e) {
      return "{}";
    }
  });
  env.addGlobal("create_dict", (key, value) => {
    const obj = {};
    obj[key] = value;
    return obj;
  });
  env.addGlobal("readJson", (filePath) => {
    try {
      return JSON.parse(Deno.readTextFileSync(filePath));
    } catch (_err) {
      return null;
    }
  });
}
function setupNunjucks(themeDir, options = {}) {
  const env = nunjucks.configure(themeDir, {
    autoescape: true,
    noCache: true,
    ...options
  });
  registerFilters(env);
  return env;
}
function parseComponentProps(propsStr) {
  const props = {};
  let i = 0;
  const len = propsStr.length;
  function skipWhitespace() {
    while (i < len && (/\s/.test(propsStr[i]) || propsStr[i] === ",")) {
      i++;
    }
  }
  while (i < len) {
    skipWhitespace();
    if (i >= len)
      break;
    const keyStart = i;
    while (i < len && /[a-zA-Z0-9_-]/.test(propsStr[i])) {
      i++;
    }
    const key = propsStr.substring(keyStart, i);
    if (!key) {
      i++;
      continue;
    }
    skipWhitespace();
    if (i >= len || propsStr[i] !== "=") {
      continue;
    }
    i++;
    skipWhitespace();
    if (i >= len)
      break;
    const valueStart = i;
    const firstChar = propsStr[i];
    if (firstChar === '"' || firstChar === "'" || firstChar === "`") {
      const quote = firstChar;
      i++;
      while (i < len) {
        if (propsStr[i] === "\\") {
          i += 2;
        } else if (propsStr[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
    } else if (firstChar === "[" || firstChar === "{") {
      const stack = [];
      while (i < len) {
        const char = propsStr[i];
        if (char === '"' || char === "'" || char === "`") {
          const quote = char;
          i++;
          while (i < len) {
            if (propsStr[i] === "\\") {
              i += 2;
            } else if (propsStr[i] === quote) {
              i++;
              break;
            } else {
              i++;
            }
          }
          continue;
        }
        if (char === "[" || char === "{") {
          stack.push(char === "[" ? "]" : "}");
        } else if (char === "]" || char === "}") {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
          if (stack.length === 0) {
            i++;
            break;
          }
        }
        i++;
      }
    } else {
      while (i < len && !/[\s,]/.test(propsStr[i])) {
        i++;
      }
    }
    const valueVal = propsStr.substring(valueStart, i);
    props[key] = valueVal.trim();
  }
  const keys = Object.keys(props);
  if (keys.length === 0)
    return {};
  const expr = "({" + keys.map((k) => `${JSON.stringify(k)}: (${props[k]})`).join(",") + "})";
  try {
    const fn = new Function(`return ${expr}`);
    return fn();
  } catch (err) {
    console.error(`\u274C Error evaluating props: ${expr}`, err);
    throw err;
  }
}
async function renderMarkdownToHtml(content, options = {}) {
  let processedContent = content;
  const replacements = [];
  const fencedTags = ["div", "section", "article", "aside", "nav", "header", "footer", "main"];
  const lines = processedContent.split("\n");
  const stack = [];
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    if (trimmed.startsWith(":::")) {
      const afterColons = trimmed.slice(3).trim();
      if (afterColons === "") {
        if (stack.length > 0) {
          const openBlock = stack.pop();
          if (openBlock.isFenced) {
            const leadingWhitespace = lines[i].match(/^\s*/)?.[0] || "";
            lines[i] = `${leadingWhitespace}</${openBlock.tag}>`;
          }
        }
      } else {
        const match = afterColons.match(/^([a-zA-Z0-9_-]+)(.*)$/);
        if (match) {
          const tag = match[1];
          const rawAttrs = match[2].trim();
          const isFenced = fencedTags.includes(tag.toLowerCase());
          if (isFenced) {
            let parsedAttrs = rawAttrs;
            if (parsedAttrs.startsWith("{") && parsedAttrs.endsWith("}")) {
              parsedAttrs = parsedAttrs.slice(1, -1).trim();
            }
            if (parsedAttrs.startsWith(".") || parsedAttrs.startsWith("#") || parsedAttrs.includes("=")) {
              const parts = parsedAttrs.match(/(?:[a-zA-Z0-9_-]+="[^"]*"|[a-zA-Z0-9_-]+='[^']*'|\.[a-zA-Z0-9_:-]+|#[a-zA-Z0-9_-]+|[^\s{}]+)/g) || [];
              const classes = [];
              let id = "";
              let genericAttrs = "";
              for (const part of parts) {
                if (part.startsWith("#")) {
                  if (!id)
                    id = part.slice(1);
                } else if (part.startsWith(".")) {
                  classes.push(part.slice(1));
                } else if (part.includes("=")) {
                  const eqIndex = part.indexOf("=");
                  const key = part.substring(0, eqIndex).trim();
                  const val = part.substring(eqIndex + 1).replace(/["']/g, "").trim();
                  genericAttrs += ` ${key}="${val}"`;
                } else {
                  classes.push(part);
                }
              }
              parsedAttrs = "";
              if (id)
                parsedAttrs += ` id="${id}"`;
              if (classes.length > 0) {
                const uniqueClasses = Array.from(new Set(classes));
                parsedAttrs += ` class="${uniqueClasses.join(" ")}"`;
              }
              if (genericAttrs)
                parsedAttrs += genericAttrs;
            } else if (parsedAttrs) {
              parsedAttrs = ` ${parsedAttrs}`;
            }
            const leadingWhitespace = lines[i].match(/^\s*/)?.[0] || "";
            lines[i] = `${leadingWhitespace}<${tag}${parsedAttrs}>`;
            stack.push({ tag, isFenced: true });
          } else {
            stack.push({ tag, isFenced: false });
          }
        }
      }
    }
  }
  processedContent = lines.join("\n");
  const containerTags = [
    "div",
    "section",
    "article",
    "aside",
    "nav",
    "header",
    "footer",
    "main",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "a",
    "li",
    "ul",
    "ol",
    "blockquote",
    "strong",
    "em",
    "b",
    "i",
    "code",
    "pre",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ];
  const containerRegex = new RegExp(
    `<(${containerTags.join("|")})([^>]*)>((?:(?!<\\/?(?:${containerTags.join("|")}))[\\s\\S])*?)<\\/\\1>`,
    "gi"
  );
  let hasMatches = true;
  let blockIndex = 0;
  const htmlBlocks = [];
  while (hasMatches) {
    containerRegex.lastIndex = 0;
    const match = containerRegex.exec(processedContent);
    if (match) {
      hasMatches = true;
      const fullMatch = match[0];
      const tag = match[1];
      const attrs = match[2];
      const innerContent = match[3];
      const placeholder = `HTMLBLOCKPLACEHOLDER${blockIndex}`;
      blockIndex++;
      htmlBlocks.push({
        placeholder,
        tag,
        attrs,
        innerContent,
        rendered: ""
      });
      processedContent = processedContent.slice(0, match.index) + placeholder + processedContent.slice(match.index + fullMatch.length);
    } else {
      hasMatches = false;
    }
  }
  for (let i = 0; i < htmlBlocks.length; i++) {
    const block = htmlBlocks[i];
    let innerHtml = await renderMarkdownToHtml(block.innerContent, {
      ...options,
      skipToc: true,
      skipPostProcess: false
    });
    const noParagraphInside = ["h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "strong", "em", "b", "i", "code"];
    if (noParagraphInside.includes(block.tag.toLowerCase())) {
      innerHtml = innerHtml.trim();
      if (innerHtml.startsWith("<p>") && innerHtml.endsWith("</p>")) {
        innerHtml = innerHtml.substring(3, innerHtml.length - 4);
      }
    }
    const blockContainerTags = ["div", "section", "article", "aside", "nav", "header", "footer", "main"];
    if (blockContainerTags.includes(block.tag.toLowerCase())) {
      innerHtml = innerHtml.replace(/<p>\s*(<img[^>]*>|<picture[\s\S]*?<\/picture>|<figure[\s\S]*?<\/figure>)\s*<\/p>/g, "$1");
    }
    for (let j = i - 1; j >= 0; j--) {
      const prevBlock = htmlBlocks[j];
      const pRegex = new RegExp(`<p>\\s*${prevBlock.placeholder}\\s*</p>`, "g");
      const pStartRegex = new RegExp(`<p>\\s*${prevBlock.placeholder}\\s*(?:<br\\s*\\/?>|\\n|\\s)+([\\s\\S]*?)</p>`, "g");
      const pEndRegex = new RegExp(`<p>([\\s\\S]*?)(?:<br\\s*\\/?>|\\n|\\s)+\\s*${prevBlock.placeholder}\\s*</p>`, "g");
      const originalInnerHtml = innerHtml;
      innerHtml = innerHtml.replace(pRegex, prevBlock.rendered);
      if (innerHtml === originalInnerHtml) {
        innerHtml = innerHtml.replace(pStartRegex, (_match, rest) => `${prevBlock.rendered}
<p>${rest}</p>`);
      }
      if (innerHtml === originalInnerHtml) {
        innerHtml = innerHtml.replace(pEndRegex, (_match, rest) => `<p>${rest}</p>
${prevBlock.rendered}`);
      }
      if (innerHtml === originalInnerHtml) {
        innerHtml = innerHtml.replace(new RegExp(prevBlock.placeholder, "g"), prevBlock.rendered);
      }
    }
    block.rendered = `<${block.tag}${block.attrs}>${innerHtml}</${block.tag}>`;
  }
  if (options.renderComponent) {
    const matches = [];
    let match;
    let index = 0;
    const regexColons = /^:::\s*([a-zA-Z0-9_-]+)\s*\n([\s\S]*?)\n:::(?:\n|$)/gm;
    regexColons.lastIndex = 0;
    while ((match = regexColons.exec(processedContent)) !== null) {
      let props = {};
      const compName = match[1].toLowerCase();
      if (fencedTags.includes(compName)) {
        continue;
      }
      try {
        const trimmed = match[2].trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          props = JSON.parse(trimmed);
        } else {
          props = parse(trimmed);
        }
      } catch (err) {
        console.error(`\u274C L\u1ED7i parse thu\u1ED9c t\xEDnh component (:::) ${match[1]}:`, err.message);
      }
      matches.push({
        raw: match[0],
        name: match[1],
        props
      });
    }
    const regexTags = /{%\s*([a-zA-Z0-9_-]+)\s*([\s\S]*?)\s*%}/g;
    regexTags.lastIndex = 0;
    while ((match = regexTags.exec(processedContent)) !== null) {
      let props = {};
      try {
        props = parseComponentProps(match[2]);
        if (props.title) {
          let attrStr = "";
          if (props.titleId)
            attrStr += `#${props.titleId} `;
          if (props.titleClass) {
            attrStr += props.titleClass.split(/\s+/).map((c) => `.${c}`).join(" ");
          }
          attrStr = attrStr.trim();
          if (attrStr) {
            props.title = `${props.title} {${attrStr}}`;
          }
        }
        if (props.subtitle) {
          let attrStr = "";
          if (props.subtitleId)
            attrStr += `#${props.subtitleId} `;
          if (props.subtitleClass) {
            attrStr += props.subtitleClass.split(/\s+/).map((c) => `.${c}`).join(" ");
          }
          attrStr = attrStr.trim();
          if (attrStr) {
            props.subtitle = `${props.subtitle} {${attrStr}}`;
          }
        }
      } catch (err) {
        console.error(`\u274C L\u1ED7i parse thu\u1ED9c t\xEDnh component ({%}) ${match[1]}:`, err.message);
      }
      matches.push({
        raw: match[0],
        name: match[1],
        props
      });
    }
    for (const m of matches) {
      const placeholder = `COMPONENTPLACEHOLDER${index}`;
      let rendered = await options.renderComponent(m.name, m.props);
      rendered = rendered.split("\n").map((line) => line.trimStart()).join("\n");
      replacements.push({ placeholder, rendered });
      processedContent = processedContent.replace(m.raw, `

${placeholder}

`);
      index++;
    }
  }
  const finalIdMap = options.idMap || GlobalIdRegistry;
  processedContent = processObsidianContent(processedContent, finalIdMap);
  if (options.renderer) {
    marked.use({ renderer: options.renderer });
  }
  let html = await marked(processedContent);
  if (!options.skipToc) {
    html = renderToc(html, {
      marker: options.tocMarker,
      defaultOpen: options.tocDefaultOpen,
      renderTocHtml: options.renderTocHtml
    });
  }
  if (!options.skipPostProcess) {
    html = postProcessHtml(html);
  }
  if (options.basePermalink) {
    html = html.replace(/<img\s+([^>]*?)src=["'](?!\/|http)([^"']+)["']/gi, (_match, p1, p2) => {
      return `<img ${p1}src="${options.basePermalink}${p2}"`;
    });
  }
  for (const r of replacements) {
    const pRegex = new RegExp(`<p>\\s*${r.placeholder}\\s*</p>`, "g");
    const originalHtml = html;
    html = html.replace(pRegex, r.rendered);
    if (html === originalHtml) {
      html = html.replace(new RegExp(r.placeholder, "g"), r.rendered);
    }
  }
  for (let i = htmlBlocks.length - 1; i >= 0; i--) {
    const block = htmlBlocks[i];
    const pRegex = new RegExp(`<p>\\s*${block.placeholder}\\s*</p>`, "g");
    const pStartRegex = new RegExp(`<p>\\s*${block.placeholder}\\s*(?:<br\\s*\\/?>|\\n|\\s)+([\\s\\S]*?)</p>`, "g");
    const pEndRegex = new RegExp(`<p>([\\s\\S]*?)(?:<br\\s*\\/?>|\\n|\\s)+\\s*${block.placeholder}\\s*</p>`, "g");
    const originalHtml = html;
    html = html.replace(pRegex, block.rendered);
    if (html === originalHtml) {
      html = html.replace(pStartRegex, (_match, rest) => `${block.rendered}
<p>${rest}</p>`);
    }
    if (html === originalHtml) {
      html = html.replace(pEndRegex, (_match, rest) => `<p>${rest}</p>
${block.rendered}`);
    }
    if (html === originalHtml) {
      html = html.replace(new RegExp(block.placeholder, "g"), block.rendered);
    }
  }
  return html;
}
async function generateIndexMd(page, outPath, options = {}) {
  const exclude = options.excludeKeys || ["_body", "_path", "content"];
  let frontMatterStr = "---\n";
  for (const [k, v] of Object.entries(page)) {
    if (!k.startsWith("_") && !exclude.includes(k) && typeof v !== "object") {
      frontMatterStr += `${k}: ${v}
`;
    }
  }
  frontMatterStr += "---\n\n";
  let rawBody = page._body || "";
  try {
    if (page._path) {
      const originalRawMd = await Deno.readTextFile(page._path);
      rawBody = originalRawMd.replace(/^---[\s\S]*?---\s*/, "");
    }
  } catch (_e) {
  }
  await Deno.writeTextFile(outPath, frontMatterStr + rawBody);
}

// ssg/assets.ts
async function copyDirectory(src, dest) {
  try {
    for await (const entry of walk(src)) {
      if (entry.isFile) {
        const relPath = path.relative(src, entry.path);
        const targetPath = path.join(dest, relPath);
        await Deno.mkdir(path.dirname(targetPath), { recursive: true });
        await Deno.copyFile(entry.path, targetPath);
      }
    }
  } catch (_err) {
  }
}

// ssg/server.ts
async function startDevServer(outDir, port = 8001) {
  console.log(`\u{1F30D} \u0110ang ch\u1EA1y web server t\u1EA1i http://localhost:${port}`);
  Deno.serve({ port }, async (req) => {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) {
      pathname += "index.html";
    }
    const filePath = path.join(outDir, pathname);
    try {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "text/plain; charset=utf-8";
      const mimeTypes = {
        [".html"]: "text/html; charset=utf-8",
        [".json"]: "application/json; charset=utf-8",
        [".css"]: "text/css; charset=utf-8",
        [".js"]: "application/javascript; charset=utf-8",
        [".webp"]: "image/webp",
        [".png"]: "image/png",
        [".jpg"]: "image/jpeg",
        [".jpeg"]: "image/jpeg",
        [".svg"]: "image/svg+xml",
        [".ico"]: "image/x-icon"
      };
      contentType = mimeTypes[ext] || contentType;
      const file = await Deno.open(filePath, { read: true });
      return new Response(file.readable, {
        headers: { ["content-type"]: contentType }
      });
    } catch (_err) {
      return new Response("Not Found", { status: 404 });
    }
  });
}

// ssg/seo.ts
function generateFullSchema(options) {
  const { site, page } = options;
  const graph = [];
  const siteUrl = site.url.endsWith("/") ? site.url.slice(0, -1) : site.url;
  const pageUrl = `${siteUrl}${page.permalink}`;
  graph.push({
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "url": siteUrl,
    "name": site.siteName,
    "description": site.description || site.footerText,
    "publisher": { "@id": `${siteUrl}/#organization` },
    "inLanguage": site.language || "vi"
  });
  graph.push({
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    "name": site.brand || site.siteName,
    "url": siteUrl,
    "logo": site.logoUrl ? {
      "@type": "ImageObject",
      "url": site.logoUrl
    } : void 0,
    "sameAs": site.socialLinks || [],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": site.phone,
      "contactType": "customer service",
      "email": site.email
    }
  });
  const pageSchema = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    "url": pageUrl,
    "name": page.title || site.siteName,
    "description": page.description || site.footerText,
    "isPartOf": { "@id": `${siteUrl}/#website` },
    "breadcrumb": { "@id": `${pageUrl}#breadcrumb` },
    "inLanguage": page.language || site.language || "vi"
  };
  if (page.geo || site.geo) {
    const geo = page.geo || site.geo;
    pageSchema["contentLocation"] = {
      "@type": "Place",
      "name": geo.name || site.address,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": geo.address || site.address,
        "addressLocality": geo.locality || "",
        "addressRegion": geo.region || "",
        "addressCountry": geo.country || "VN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": geo.lat,
        "longitude": geo.lng
      }
    };
  }
  graph.push(pageSchema);
  if (page.breadcrumbs || page.permalink && page.permalink !== "/") {
    let itemListElement = [];
    if (Array.isArray(page.breadcrumbs)) {
      itemListElement = page.breadcrumbs.map((bc, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@id": bc.url.startsWith("http") ? bc.url : `${siteUrl}${bc.url.startsWith("/") ? bc.url : "/" + bc.url}`,
          "name": bc.name
        }
      }));
    } else {
      itemListElement.push({
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@id": `${siteUrl}/`,
          "name": "Trang ch\u1EE7"
        }
      });
      const parts = page.permalink.split("/").filter(Boolean);
      let currentPath = "/";
      parts.forEach((part, index) => {
        currentPath += `${part}/`;
        itemListElement.push({
          "@type": "ListItem",
          "position": index + 2,
          "item": {
            "@id": `${siteUrl}${currentPath}`,
            "name": index === parts.length - 1 ? page.title || part : part
          }
        });
      });
    }
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      "itemListElement": itemListElement
    });
  }
  const activeSchemas = Array.isArray(page.schemas) ? page.schemas : [];
  if (activeSchemas.includes("article") || page.layout === "post") {
    const article = {
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      "isPartOf": { "@id": `${pageUrl}#webpage` },
      "headline": page.title,
      "description": page.description || site.footerText,
      "mainEntityOfPage": { "@id": `${pageUrl}#webpage` },
      "datePublished": page.date || (/* @__PURE__ */ new Date()).toISOString(),
      "dateModified": page.updated || page.date || (/* @__PURE__ */ new Date()).toISOString(),
      "author": {
        "@type": "Person",
        "name": page.author?.name || site.brand || "Admin",
        "url": page.author?.url || siteUrl
      },
      "publisher": { "@id": `${siteUrl}/#organization` }
    };
    if (page.featureImage || page.image) {
      const imgPath = String(page.featureImage || page.image).replace("./", "");
      article["image"] = `${pageUrl}${imgPath}`;
    }
    graph.push(article);
  }
  if (activeSchemas.includes("author") || activeSchemas.includes("person")) {
    graph.push({
      "@type": "Person",
      "@id": `${pageUrl}#person`,
      "name": page.author?.name || page.title,
      "description": page.author?.bio || page.description,
      "url": pageUrl,
      "image": page.author?.image || page.featureImage,
      "sameAs": page.author?.socialLinks || []
    });
  }
  if (activeSchemas.includes("faq") && Array.isArray(page.faqs)) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": page.faqs.map((f) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    });
  }
  if (activeSchemas.includes("local")) {
    const geo = page.geo || site.geo;
    graph.push({
      "@type": "LocalBusiness",
      "name": site.brand || site.siteName,
      "image": site.logoUrl || "",
      "@id": `${pageUrl}#localbusiness`,
      "url": pageUrl,
      "telephone": site.phone,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": geo?.address || site.address,
        "addressLocality": geo?.locality || "",
        "addressRegion": geo?.region || "",
        "addressCountry": geo?.country || "VN"
      },
      "geo": geo ? {
        "@type": "GeoCoordinates",
        "latitude": geo.lat,
        "longitude": geo.lng
      } : void 0
    });
  }
  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

// ssg/design_helper.ts
async function getMockData(layoutName, mocksDir) {
  const baseName = layoutName.split(".")[0];
  const jsonPath = path.join(mocksDir, `${baseName}.json`);
  let data = {};
  try {
    const content = await Deno.readTextFile(jsonPath);
    data = JSON.parse(content);
  } catch (_e) {
    data = {};
  }
  if (data.bricks && Array.isArray(data.bricks)) {
    const brickData = await loadBrickMocks(data.bricks);
    data = deepMerge(brickData, data);
  }
  return data;
}
async function loadBrickMocks(bricks) {
  let combinedBrickData = {};
  let cdnNjkPath = "";
  try {
    const resolved = import.meta.resolve("cdnlib/");
    if (resolved.startsWith("file:")) {
      cdnNjkPath = path.join(path.fromFileUrl(resolved), "njk");
    }
  } catch (_e) {
  }
  const localBricksPath = path.join(Deno.cwd(), "templates/bricks");
  for (const brick of bricks) {
    let content = null;
    try {
      const localMockPath = path.join(localBricksPath, `${brick}.mock.json`);
      content = await Deno.readTextFile(localMockPath);
    } catch (_e) {
      if (cdnNjkPath) {
        try {
          const systemMockPath = path.join(cdnNjkPath, "bricks", `${brick}.mock.json`);
          content = await Deno.readTextFile(systemMockPath);
        } catch (_e2) {
        }
      }
    }
    if (content) {
      try {
        const data = JSON.parse(content);
        combinedBrickData = deepMerge(combinedBrickData, data);
      } catch (_e) {
      }
    }
  }
  return combinedBrickData;
}
function combineData(mockData, siteConfig, pageData = {}) {
  return deepMerge(deepMerge(mockData, siteConfig), pageData);
}
export {
  GlobalIdRegistry,
  _,
  buildDatabase,
  cleanContentForAI,
  cleanDir,
  collectContent,
  combineData,
  copyDirectory,
  createGenerator,
  createMarkedRenderer,
  deepMerge,
  extract,
  generateCss,
  generateFullSchema,
  generateIndexMd,
  generateShortcuts,
  generateSitemap,
  getImageDimensions,
  getInheritedMetadata,
  getMockData,
  loadBrickMocks,
  marked,
  minifyHtml,
  normalizeString,
  nunjucks,
  parseComponentProps,
  parse as parseYaml,
  path,
  pickFields,
  postProcessHtml,
  default3 as presetAttributify,
  default5 as presetIcons,
  default4 as presetTypography,
  default2 as presetUno,
  processAnyImages,
  processObsidianContent,
  processObsidianFrontMatter,
  registerFilters,
  renderMarkdownToHtml,
  renderToc,
  setupNunjucks,
  sharp,
  slugifyUrl,
  startDevServer,
  walk,
  where_multiple
};
