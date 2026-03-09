import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ─────────────────────────────────────
// DESIGN SYSTEM — Gray Alpha palette
// ─────────────────────────────────────
const tokens = {
  bg: "#080808",
  white: "rgba(255,255,255,0.95)",
  grayHi: "rgba(255,255,255,0.65)",
  grayMid: "rgba(255,255,255,0.40)",
  grayDim: "rgba(255,255,255,0.18)",
  border: "rgba(255,255,255,0.07)",
  surface: "rgba(255,255,255,0.03)",
  font: "JetBrains Mono, SF Mono, monospace",
};

const BRAND_DIR = join(__dirname, "../../../public/brand");

// ─────────────────────────────────────
// ICON BUILDER
// ─────────────────────────────────────
function buildIcon(opts: {
  size: number;
  rectFill: string;
  rectStroke: string;
  textFill: string;
  fontSize: number;
  rx: number;
}): string {
  const { size, rectFill, rectStroke, textFill, fontSize, rx } = opts;
  const center = size / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" rx="${rx}"
    stroke="${rectStroke}"
    fill="${rectFill}"/>
  <text
    x="${center}" y="${center}"
    text-anchor="middle"
    dominant-baseline="central"
    font-size="${fontSize}"
    font-weight="800"
    fill="${textFill}"
    font-family="${tokens.font}">A</text>
</svg>
`;
}

// ─────────────────────────────────────
// WORDMARK BUILDER
// ─────────────────────────────────────
function buildWordmark(): string {
  return `<svg width="320" height="52" viewBox="0 0 320 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text
    x="0" y="26"
    dominant-baseline="central"
    font-size="40"
    font-weight="800"
    letter-spacing="-2"
    font-family="${tokens.font}">
    <tspan fill="${tokens.white}">armando</tspan><tspan fill="${tokens.grayMid}">analytics</tspan>
  </text>
</svg>
`;
}

// ─────────────────────────────────────
// VARIANT DEFINITIONS
// ─────────────────────────────────────
const variants: { filename: string; svg: string }[] = [
  // 1. Default — dark bg, subtle border, white A
  {
    filename: "logo-icon-default.svg",
    svg: buildIcon({
      size: 52,
      rectFill: tokens.bg,
      rectStroke: tokens.border,
      textFill: tokens.white,
      fontSize: 30,
      rx: 13,
    }),
  },
  // 2. Outline — transparent bg, visible border
  {
    filename: "logo-icon-outline.svg",
    svg: buildIcon({
      size: 52,
      rectFill: "none",
      rectStroke: tokens.grayDim,
      textFill: tokens.white,
      fontSize: 30,
      rx: 13,
    }),
  },
  // 3. Light — white bg, dark A
  {
    filename: "logo-icon-light.svg",
    svg: buildIcon({
      size: 52,
      rectFill: "#ffffff",
      rectStroke: "rgba(0,0,0,0.08)",
      textFill: "#080808",
      fontSize: 30,
      rx: 13,
    }),
  },
  // 4. Elevated — slightly elevated surface
  {
    filename: "logo-icon-elevated.svg",
    svg: buildIcon({
      size: 52,
      rectFill: tokens.surface,
      rectStroke: tokens.border,
      textFill: tokens.white,
      fontSize: 30,
      rx: 13,
    }),
  },
  // 5. Navbar — smaller for sidebar/navbar
  {
    filename: "logo-icon-navbar.svg",
    svg: buildIcon({
      size: 34,
      rectFill: tokens.bg,
      rectStroke: tokens.border,
      textFill: tokens.white,
      fontSize: 19,
      rx: 9,
    }),
  },
  // 6. Favicon — smallest
  {
    filename: "logo-icon-favicon.svg",
    svg: buildIcon({
      size: 32,
      rectFill: tokens.bg,
      rectStroke: tokens.border,
      textFill: tokens.white,
      fontSize: 18,
      rx: 8,
    }),
  },
  // 7. Wordmark — text only
  {
    filename: "logo-wordmark.svg",
    svg: buildWordmark(),
  },
];

// ─────────────────────────────────────
// GENERATE
// ─────────────────────────────────────
export function generateAllLogos(): void {
  mkdirSync(BRAND_DIR, { recursive: true });

  for (const { filename, svg } of variants) {
    const filepath = join(BRAND_DIR, filename);
    writeFileSync(filepath, svg, "utf-8");
    console.log(`  ${filepath} \u2713`);
  }
}

// Run directly
generateAllLogos();
console.log(`\n  ${variants.length} logo variants generated.`);
