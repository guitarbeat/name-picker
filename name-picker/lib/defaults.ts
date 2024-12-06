export const defaultNames = [
  "Asher", "Afro", "Akon", "Arca", "Arlo", "Maypop", "Aura", "Auroari", 
  "Aurora", "Baba", "Bokeh", "Chroma", "Cosmo", "Cuda", "Cudi", "Ekko", 
  "Euler", "Fiber", "Fresnel", "Galileo", "Halo", "Helix", "Lapis Lazuli", 
  "Lumen", "Luna", "Moon", "Nova", "Orion", "Ozzy", "Photon", "Poem", 
  "Prism", "Quanta", "Salem", "Sìobhan", "Snell", "Sol", "Speckle", 
  "Umbra", "Umi", "Willow", "Zion", "Obsidian", "Psyche", "Mushu", 
  "Filbert", "crisis", "carton", "bear", "wolf"
];

export type BracketType = "single" | "double" | "round_robin";

export const bracketTypes: { label: string; value: BracketType }[] = [
  { label: "Single Elimination", value: "single" },
  { label: "Double Elimination", value: "double" },
  { label: "Round Robin", value: "round_robin" }
];
