import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const source = resolve(projectRoot, "src-tauri/icons/frankcards-app-icon.svg");
const outputDirectory = resolve(projectRoot, "src-tauri/icons/icon-composer");

const svgOpen = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:serif="http://www.serif.com/" viewBox="0 0 1024 1024">';
const svgClose = "</svg>\n";
const interactionIds = new Set(["right-hand", "left-hand", "coffe-cup", "coffe", "unnamed-base-detail"]);

function matchingGroupEnd(markup, start) {
  const tags = /<\/?g\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;

  for (let match = tags.exec(markup); match; match = tags.exec(markup)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return tags.lastIndex;
  }

  throw new Error("Unable to find the end of the existing female figure.");
}

function directGroups(innerMarkup) {
  const tags = /<\/?g\b[^>]*>/g;
  const groups = [];
  let depth = 0;
  let start = null;
  let openingTag = "";

  for (let match = tags.exec(innerMarkup); match; match = tags.exec(innerMarkup)) {
    if (!match[0].startsWith("</")) {
      if (depth === 0) {
        start = match.index;
        openingTag = match[0];
      }
      depth += 1;
      continue;
    }

    depth -= 1;
    if (depth === 0 && start !== null) {
      const id = openingTag.match(/\bid="([^"]+)"/)?.[1] ?? "unnamed-base-detail";
      groups.push({ id, markup: innerMarkup.slice(start, tags.lastIndex) });
      start = null;
    }
  }

  return groups;
}

const master = await readFile(source, "utf8");
const figureStart = master.indexOf('<g id="female"');
if (figureStart === -1) throw new Error("The FrankCards master icon has no female figure.");

const openingEnd = master.indexOf(">", figureStart) + 1;
const figureEnd = matchingGroupEnd(master, figureStart);
const figureOpening = master.slice(figureStart, openingEnd);
const figureInner = master.slice(openingEnd, figureEnd - 4);
const groups = directGroups(figureInner);

const base = groups.filter(({ id }) => !interactionIds.has(id)).map(({ markup }) => markup).join("\n");
const interaction = groups.filter(({ id }) => interactionIds.has(id)).map(({ markup }) => markup).join("\n");
if (!base || !interaction) throw new Error("Could not split the existing FrankCards figure into base and interaction layers.");

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, "01-background.svg"), `${svgOpen}\n  <linearGradient id="frankcards-background" x1="92" y1="88" x2="932" y2="936" gradientUnits="userSpaceOnUse">\n    <stop stop-color="#f7f7f1"/>\n    <stop offset="0.54" stop-color="#e9eee9"/>\n    <stop offset="1" stop-color="#dce8ee"/>\n  </linearGradient>\n  <rect width="1024" height="1024" fill="url(#frankcards-background)"/>\n${svgClose}`),
  writeFile(resolve(outputDirectory, "02-conversation-card.svg"), `${svgOpen}\n  <g transform="rotate(-11 466 646)">\n    <rect x="210" y="484" width="512" height="324" rx="48" fill="#9ab1cc"/>\n  </g>\n  <g transform="rotate(8 570 650)">\n    <rect x="312" y="498" width="512" height="324" rx="48" fill="#fdfdf9"/>\n  </g>\n${svgClose}`),
  writeFile(resolve(outputDirectory, "03-female.svg"), `${svgOpen}\n  ${figureOpening}\n${base}\n  </g>\n${svgClose}`),
  writeFile(resolve(outputDirectory, "04-hands-and-coffee.svg"), `${svgOpen}\n  ${figureOpening}\n${interaction}\n  </g>\n${svgClose}`),
  writeFile(resolve(outputDirectory, "README.md"), `# FrankCards Icon Composer layers\n\nImport the SVGs in numerical order into Icon Composer. They use the actual FrankCards female figure and product card language.\n\n1. \`01-background.svg\` — full-bleed product background\n2. \`02-conversation-card.svg\` — two overlapping existing-style conversation cards in the app's pale blue and ivory\n3. \`03-female.svg\` — existing olive-cardigan character, without hands or coffee\n4. \`04-hands-and-coffee.svg\` — existing hands and coffee cup, for the foreground glass layer\n\nKeep the background opaque. In Icon Composer, use modest Liquid Glass on layers 2 and 4; keep the character layer mostly opaque for visual fidelity.\n`),
]);

console.log(`Exported ${groups.length} existing FrankCards figure groups to ${outputDirectory}.`);
