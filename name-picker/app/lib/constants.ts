// Default names for testing and demo purposes
export const defaultNames = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Henry",
];

// Animation constants
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

// Layout constants
export const BORDER_RADIUS = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
} as const;

// Z-index constants
export const Z_INDEX = {
  modal: 1000,
  overlay: 900,
  drawer: 800,
  dropdown: 700,
  tooltip: 600,
  banner: 500,
  header: 400,
  footer: 300,
} as const;

// Theme constants
export const THEME = {
  colors: {
    brand: {
      50: "hsl(280, 100%, 95%)",
      100: "hsl(280, 100%, 85%)",
      200: "hsl(280, 100%, 75%)",
      300: "hsl(280, 100%, 65%)",
      400: "hsl(280, 100%, 55%)",
      500: "hsl(280, 100%, 45%)",
      600: "hsl(280, 100%, 35%)",
      700: "hsl(280, 100%, 25%)",
      800: "hsl(280, 100%, 15%)",
      900: "hsl(280, 100%, 5%)",
    },
  },
  fonts: {
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
} as const;
