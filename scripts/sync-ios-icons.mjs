import { access, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const sourceIcon = resolve(projectRoot, "src-tauri/icons/frankcards-app-icon.png");
const iosSourceDirectory = resolve(projectRoot, "src-tauri/icons/ios");
const destinationDirectory = resolve(
  projectRoot,
  "src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset",
);

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status === 0) return result.stdout.trim();

  const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`);
}

function renderOpaqueIcon(width, height, output) {
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    sourceIcon,
    "-filter_complex",
    `[0:v]scale=${width}:${height}:flags=lanczos[icon];color=c=0xF7F7F1:s=${width}x${height}[background];[background][icon]overlay=0:0:format=auto,format=rgb24`,
    "-frames:v",
    "1",
    output,
  ]);
}

try {
  await access(destinationDirectory);
} catch {
  throw new Error("iOS project is missing. Run `npm run tauri ios init` before syncing icons.");
}

try {
  await access(sourceIcon);
} catch {
  throw new Error("The FrankCards SVG icon source is missing.");
}

const iconNames = (await readdir(iosSourceDirectory))
  .filter((name) => name.endsWith(".png"))
  .sort();

if (iconNames.length === 0) throw new Error("No iOS icon assets were found.");

for (const iconName of iconNames) {
  const sourceDestination = resolve(iosSourceDirectory, iconName);
  const destination = resolve(destinationDirectory, iconName);
  const dimensions = run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0",
    sourceDestination,
  ]);
  const [width, height] = dimensions.split("x");

  for (const output of [sourceDestination, destination]) {
    renderOpaqueIcon(width, height, output);
  }
}

console.log(`Rendered ${iconNames.length} opaque iOS icons from the Icon Composer export.`);
