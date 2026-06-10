const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceLogo = path.join(__dirname, '../../mobile/assets/logo.png');
const outputDir = path.join(__dirname, '../../mobile/assets');

async function generateIcons() {
  console.log('Generating mobile icons using sharp...');
  
  if (!fs.existsSync(sourceLogo)) {
    console.error(`Source logo not found at: ${sourceLogo}`);
    process.exit(1);
  }

  // 1. Generate icon.png (1024x1024, solid white background)
  // We place the resized logo over a solid white background canvas.
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(sourceLogo)
        .resize(720, 720, { fit: 'inside' })
        .toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.join(outputDir, 'icon.png'));
  console.log('Generated icon.png');

  // 2. Generate adaptive-icon.png (1024x1024, transparent background, padded)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
  .composite([
    {
      input: await sharp(sourceLogo)
        .resize(680, 680, { fit: 'inside' })
        .toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.join(outputDir, 'adaptive-icon.png'));
  console.log('Generated adaptive-icon.png');

  // 3. Generate splash-icon.png (1024x1024, transparent background, padded)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
  .composite([
    {
      input: await sharp(sourceLogo)
        .resize(600, 600, { fit: 'inside' })
        .toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.join(outputDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png');

  // 4. Generate favicon.png (48x48, transparent background)
  await sharp(sourceLogo)
    .resize(48, 48, { fit: 'inside' })
    .png()
    .toFile(path.join(outputDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
