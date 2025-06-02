import { writeFile, mkdir, copyFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fonts = [
  {
    name: 'arvo-v22-latin-regular',
    url: 'https://fonts.gstatic.com/s/arvo/v22/tDbD2oWUg0MKmSAaHVxM.woff2',
    weight: '400',
    style: 'normal'
  },
  {
    name: 'arvo-v22-latin-700',
    url: 'https://fonts.gstatic.com/s/arvo/v22/tDbM2oWUg0MKoZw2yLTA8v3Xy.woff2',
    weight: '700',
    style: 'normal'
  }
];

async function downloadFont(font) {
  const fontDir = join(process.cwd(), 'public/fonts');
  const woff2Path = join(fontDir, `${font.name}.woff2`);
  const woffPath = join(fontDir, `${font.name}.woff`);
  
  // Create fonts directory if it doesn't exist
  try {
    await access(fontDir);
  } catch {
    await mkdir(fontDir, { recursive: true });
  }
  
  console.log(`Downloading ${font.name}...`);
  
  // Download WOFF2
  const woff2Response = await fetch(font.url);
  const woff2Buffer = await woff2Response.arrayBuffer();
  await writeFile(woff2Path, Buffer.from(woff2Buffer));
  
  // For now, we'll just copy the WOFF2 file as WOFF since we can't convert it directly
  await copyFile(woff2Path, woffPath);
  
  console.log(`Downloaded ${font.name} to ${woff2Path}`);
}

async function main() {
  try {
    for (const font of fonts) {
      await downloadFont(font);
    }
    console.log('All fonts downloaded successfully!');
  } catch (error) {
    console.error('Error downloading fonts:', error);
    process.exit(1);
  }
}

main();
