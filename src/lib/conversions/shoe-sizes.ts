/**
 * Shoe size conversion utilities
 * Based on standard EU to UK shoe size conversion charts
 */

// EU to UK conversion mapping
const EU_TO_UK_MAPPING: Record<number, number> = {
  33: 1,
  34: 2,
  35: 2.5,
  36: 3.5,
  37: 4,
  38: 5,
  39: 5.5,
  40: 6.5,
  41: 7,
  42: 8,
  43: 8.5,
  44: 9.5,
  45: 10,
  46: 11,
  47: 11.5,
  48: 12.5,
  49: 13,
  50: 14
};

// UK to EU conversion mapping (reverse of above)
const UK_TO_EU_MAPPING: Record<number, number> = {};
Object.entries(EU_TO_UK_MAPPING).forEach(([eu, uk]) => {
  UK_TO_EU_MAPPING[uk] = parseInt(eu);
});

/**
 * Convert EU shoe size to UK shoe size
 */
export function convertEUToUK(euSize: number): number | null {
  return EU_TO_UK_MAPPING[euSize] || null;
}

/**
 * Convert UK shoe size to EU shoe size
 */
export function convertUKToEU(ukSize: number): number | null {
  return UK_TO_EU_MAPPING[ukSize] || null;
}

/**
 * Get formatted size display with conversion
 */
export function getSizeWithConversion(size: number, originalType: 'EU' | 'UK'): string {
  if (originalType === 'EU') {
    const ukSize = convertEUToUK(size);
    return ukSize ? `EU ${size} (UK ${ukSize})` : `EU ${size}`;
  } else {
    const euSize = convertUKToEU(size);
    return euSize ? `UK ${size} (EU ${euSize})` : `UK ${size}`;
  }
}

/**
 * Get all available EU sizes
 */
export function getAvailableEUSizes(): number[] {
  return Object.keys(EU_TO_UK_MAPPING).map(Number).sort((a, b) => a - b);
}

/**
 * Get all available UK sizes
 */
export function getAvailableUKSizes(): number[] {
  return Object.keys(UK_TO_EU_MAPPING).map(Number).sort((a, b) => a - b);
}