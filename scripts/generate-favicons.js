#!/usr/bin/env node
/**
 * scripts/generate-favicons.js
 * Generates PNG favicons at multiple resolutions (16, 32, 48, 180, 512)
 * and creates multi-resolution favicon.ico files.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const svgPath = path.join(root, 'assets', 'favicon.svg');
const assetsDir = path.join(root, 'assets');

if (!fs.existsSync(svgPath)) {
  console.error('Missing assets/favicon.svg');
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, 'utf8');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 512, name: 'favicon.png' }
];

for (const { size, name } of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    shapeRendering: 2,
    imageRendering: 0
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(assetsDir, name), png);
}

// Generate multi-size favicon.ico using ImageMagick
try {
  const f16 = path.join(assetsDir, 'favicon-16x16.png');
  const f32 = path.join(assetsDir, 'favicon-32x32.png');
  const f48 = path.join(assetsDir, 'favicon-48x48.png');
  const icoAssets = path.join(assetsDir, 'favicon.ico');
  const icoRoot = path.join(root, 'favicon.ico');

  execSync(`convert "${f16}" "${f32}" "${f48}" "${icoAssets}"`);
  fs.copyFileSync(icoAssets, icoRoot);
  console.log('✅ Favicons generated (16x16, 32x32, 48x48, 180x180, 512x512, favicon.ico)');
} catch (err) {
  console.error('ICO generation error:', err.message);
}
