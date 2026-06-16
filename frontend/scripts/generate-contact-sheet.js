/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const groups = [
  {
    name: "illustrations",
    dir: path.join(__dirname, "..", "public", "assets", "illustrations"),
    output: path.join(__dirname, "..", "tmp", "illustrations-contact-sheet.png"),
  },
  {
    name: "logos",
    dir: path.join(__dirname, "..", "public", "assets", "logos"),
    output: path.join(__dirname, "..", "tmp", "logos-contact-sheet.png"),
    filter: (file) => !file.includes("/pictogrammes/"),
  },
  {
    name: "pictogrammes",
    dir: path.join(__dirname, "..", "public", "assets", "logos", "pictogrammes"),
    output: path.join(__dirname, "..", "tmp", "pictogrammes-contact-sheet.png"),
  },
];

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"]);
const TILE_WIDTH = 240;
const TILE_HEIGHT = 220;
const THUMB_SIZE = 160;
const LABEL_HEIGHT = 48;
const COLS = 4;

function listImages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listImages(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function createTile(imagePath, label) {
  const image = sharp(imagePath, { density: 200 });
  const thumb = await image
    .resize(THUMB_SIZE, THUMB_SIZE, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const labelSvg = Buffer.from(`
    <svg width="${TILE_WIDTH}" height="${TILE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="16" ry="16" fill="#ffffff" stroke="#d7dee7" />
      <text x="16" y="${TILE_HEIGHT - 22}" font-size="13" font-family="Arial, Helvetica, sans-serif" fill="#24313c">
        ${escapeXml(label.slice(0, 34))}
      </text>
      <text x="16" y="${TILE_HEIGHT - 6}" font-size="11" font-family="Arial, Helvetica, sans-serif" fill="#667788">
        ${escapeXml(label.slice(34))}
      </text>
    </svg>
  `);

  return sharp({
    create: {
      width: TILE_WIDTH,
      height: TILE_HEIGHT,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      { input: labelSvg, top: 0, left: 0 },
      {
        input: thumb,
        top: Math.round((TILE_HEIGHT - LABEL_HEIGHT - THUMB_SIZE) / 2),
        left: Math.round((TILE_WIDTH - THUMB_SIZE) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function generateGroup({ dir, output, filter }) {
  const files = listImages(dir).filter((file) => (filter ? filter(file) : true));
  const rows = Math.ceil(files.length / COLS);
  const sheetWidth = COLS * TILE_WIDTH;
  const sheetHeight = rows * TILE_HEIGHT;

  fs.mkdirSync(path.dirname(output), { recursive: true });

  const composites = await Promise.all(
    files.map(async (file, index) => {
      const tile = await createTile(file, path.basename(file));
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      return {
        input: tile,
        left: col * TILE_WIDTH,
        top: row * TILE_HEIGHT,
      };
    }),
  );

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: "#f4f7fb",
    },
  })
    .composite(composites)
    .png()
    .toFile(output);

  console.log(output);
}

async function main() {
  for (const group of groups) {
    await generateGroup(group);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
