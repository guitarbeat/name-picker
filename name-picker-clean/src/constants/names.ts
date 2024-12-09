// List of cat names for the tournament
export const DEFAULT_NAMES = [
  'Luna', 'Bella', 'Lucy', 'Lily', 'Kitty', 'Callie', 'Nala', 'Zoe', 'Chloe',
  'Sophie', 'Daisy', 'Stella', 'Molly', 'Penny', 'Olive', 'Milo', 'Leo', 'Charlie',
  'Max', 'Simba', 'Jack', 'Loki', 'Oliver', 'Tiger', 'Jasper', 'Oscar', 'George',
  'Louie', 'Felix', 'Dexter', 'Winston', 'Finn', 'Henry', 'Zeus', 'Binx', 'Salem',
  'Willow', 'Coco', 'Ruby', 'Rosie', 'Ellie', 'Lola', 'Gracie', 'Mia', 'Pepper',
  'Sasha', 'Maggie', 'Millie', 'Nova', 'Shadow', 'Smokey', 'Ziggy', 'Pumpkin',
  'Midnight', 'Boots', 'Banjo', 'Scout', 'Maple', 'Mocha', 'Sage', 'Ash', 'Storm',
  'River', 'Sky', 'Misty', 'Dusty', 'Sunny', 'Honey', 'Ginger', 'Raven', 'Bear',
  'Goose', 'Pixel', 'Waffle', 'Toast', 'Beans', 'Biscuit', 'Pickle', 'Mochi',
  'Sushi', 'Taco', 'Nacho', 'Noodle', 'Tofu', 'Wasabi', 'Kimchi', 'Kiwi',
  'Orbit', 'Rocket', 'Cosmo', 'Nova', 'Atlas', 'Phoenix', 'Comet', 'Mars',
  'Echo', 'Zen', 'Ghost', 'Spirit', 'Mystic', 'Magic', 'Quest', 'Riddle',
  'Arlo', 'Finn', 'Kai', 'Luca', 'Milo', 'Nova', 'Otto', 'Pip', 'Quinn', 'Rio'
];

// Function to get a random subset of names
export function getRandomDefaultNames(count: number): string[] {
  const shuffled = [...DEFAULT_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
} 