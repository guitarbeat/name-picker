/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) {
    console.warn('shuffleArray received non-array input:', array);
    return [];
  }

  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
} 