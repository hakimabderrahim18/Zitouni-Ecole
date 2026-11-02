const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatchPkg = require('pixelmatch');
const pixelmatch = pixelmatchPkg.default || pixelmatchPkg;

function compareImages(img1Path, img2Path, diffOutputPath) {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  // Resize or crop to identical dimensions if needed
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.15 }
  );

  const totalPixels = width * height;
  const mismatchPercent = ((numDiffPixels / totalPixels) * 100).toFixed(2);

  fs.writeFileSync(diffOutputPath, PNG.sync.write(diff));
  return {
    numDiffPixels,
    totalPixels,
    mismatchPercent: parseFloat(mismatchPercent),
  };
}

module.exports = { compareImages };
