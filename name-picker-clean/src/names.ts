// List of cat names for the tournament
export const DEFAULT_NAMES = [
  'Luna',
  'Oliver',
  'Bella',
  'Leo',
];

// Function to get a random subset of names
export function getRandomDefaultNames(count: number): string[] {
  const shuffled = [...DEFAULT_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
} 