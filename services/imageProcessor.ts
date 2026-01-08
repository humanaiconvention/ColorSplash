import { PixelData } from "../types";

// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => 
  "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

// Helper to calculate Euclidean distance between colors
const colorDist = (c1: {r:number, g:number, b:number}, c2: {r:number, g:number, b:number}) => 
  Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));

/**
 * Processes a base64 image into a grid of quantized colors.
 */
export const processImageForGame = async (
  imageUrl: string,
  gridSize: number, // e.g. 32
  colorCount: number // e.g. 10
): Promise<{ grid: PixelData[]; palette: string[] }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // 1. Setup Canvas for downscaling (Pixelation)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context not found");

      // Enable crisp pixelation
      ctx.imageSmoothingEnabled = false;

      canvas.width = gridSize;
      canvas.height = gridSize;

      // Draw and scale down
      ctx.drawImage(img, 0, 0, gridSize, gridSize);
      
      const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
      const data = imageData.data;
      const pixelCount = gridSize * gridSize;
      
      const rawColors: {r: number, g: number, b: number}[] = [];

      // 2. Extract raw colors
      for (let i = 0; i < pixelCount; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        // Ignore alpha, assume full opacity for simplicity
        rawColors.push({ r, g, b });
      }

      // 3. Smart Palette Extraction
      // Instead of simple binning which gets confused by anti-aliasing shades,
      // we aggregate frequent colors and then pick DISTINCT ones.
      
      const colorMap = new Map<string, number>();
      
      rawColors.forEach(c => {
        // Round to nearest 5 to group extremely close noise
        const qr = Math.round(c.r / 5) * 5;
        const qg = Math.round(c.g / 5) * 5;
        const qb = Math.round(c.b / 5) * 5;
        const key = `${qr},${qg},${qb}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      });

      // Sort candidate colors by frequency
      const sortedCandidates = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => {
          const [r, g, b] = entry[0].split(',').map(Number);
          return { r, g, b, count: entry[1] };
        });

      // Select Palette Colors ensuring distinctiveness
      const paletteObjs: {r: number, g: number, b: number}[] = [];
      const MIN_DIST = 40; // Minimum distance to be considered a new color (approx 15% difference)

      // Always take the most frequent color (usually background or main subject color)
      if (sortedCandidates.length > 0) {
        paletteObjs.push(sortedCandidates[0]);
      }

      // Greedily pick next most frequent colors that are distinct enough
      for (let i = 1; i < sortedCandidates.length; i++) {
        if (paletteObjs.length >= colorCount) break;
        
        const candidate = sortedCandidates[i];
        const isDistinct = paletteObjs.every(p => colorDist(candidate, p) > MIN_DIST);

        if (isDistinct) {
          paletteObjs.push(candidate);
        }
      }

      // If we still need more colors, lower the threshold or just take what's left
      if (paletteObjs.length < colorCount) {
         for (let i = 1; i < sortedCandidates.length; i++) {
            if (paletteObjs.length >= colorCount) break;
            const candidate = sortedCandidates[i];
            // Check if already added (reference check won't work, need content check)
            const alreadyIn = paletteObjs.some(p => p.r === candidate.r && p.g === candidate.g && p.b === candidate.b);
            if (!alreadyIn) {
               // We relax distance check here implicitly by just filling up
               paletteObjs.push(candidate);
            }
         }
      }

      // 4. Map every pixel to the nearest palette color
      const finalGrid: PixelData[] = [];
      
      for (let i = 0; i < pixelCount; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const current = { r, g, b };

        let minDist = Infinity;
        let bestIndex = 0;

        paletteObjs.forEach((pColor, idx) => {
          const d = colorDist(current, pColor);
          if (d < minDist) {
            minDist = d;
            bestIndex = idx;
          }
        });

        finalGrid.push({
          r: paletteObjs[bestIndex].r,
          g: paletteObjs[bestIndex].g,
          b: paletteObjs[bestIndex].b,
          colorIndex: bestIndex,
          isColored: false // All start uncolored
        });
      }

      // Convert palette objects to Hex strings
      const paletteHex = paletteObjs.map(c => rgbToHex(c.r, c.g, c.b));

      resolve({ grid: finalGrid, palette: paletteHex });
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};