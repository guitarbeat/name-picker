declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'clsx' {
  function clsx(...args: any[]): string;
  export default clsx;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module 'vite' {
  export function defineConfig(config: any): any;
}

declare module '@vitejs/plugin-react' {
  const plugin: any;
  export default plugin;
} 