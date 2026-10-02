#!/usr/bin/env node
/**
 * scripts/generate-og.js
 * Generates ultra-crisp, high-fidelity 2400x1260 (@2x Retina) OpenGraph PNG cards
 * (both og-card.png and and-card.png) from assets/og-card.svg using authentic
 * Playfair Display, Space Mono, and Plus Jakarta Sans.
 */

import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const svgPath = path.join(root, 'assets', 'og-card.svg');
const outPng = path.join(root, 'assets', 'og-card.png');
const andCardPng = path.join(root, 'assets', 'and-card.png');
const andCardSvg = path.join(root, 'assets', 'and-card.svg');
const fontsDir = path.join(root, 'assets', 'fonts');

if (!fs.existsSync(svgPath)) {
  console.error('Missing assets/og-card.svg at ' + svgPath);
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, 'utf8');

// Mirror to and-card.svg
fs.writeFileSync(andCardSvg, svg);

// Render at 2400x1260 (@2x HiDPI / Retina scale)
const resvg = new Resvg(svg, {
  fitTo: { mode: 'zoom', value: 2 },
  font: {
    fontDirs: [fontsDir],
    loadSystemFonts: true
  },
  dpi: 192,
  shapeRendering: 2, // geometricPrecision
  textRendering: 1,  // optimizeLegibility
  imageRendering: 0  // optimizeQuality
});

const rendered = resvg.render();
const pngBuffer = rendered.asPng();

fs.writeFileSync(outPng, pngBuffer);
fs.writeFileSync(andCardPng, pngBuffer);

console.log(`✅ assets/og-card.png and assets/and-card.png generated at ${rendered.width}x${rendered.height} (${pngBuffer.length} bytes)`);
