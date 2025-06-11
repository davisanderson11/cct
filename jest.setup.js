// Mock canvas to avoid ELF header issues in WSL
jest.mock('canvas', () => ({}), { virtual: true });

// Suppress canvas-related errors
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].toString().includes('canvas')) {
    return;
  }
  originalError.apply(console, args);
};

// Mock any other problematic native modules
global.HTMLCanvasElement = class HTMLCanvasElement {
  getContext() {
    return {};
  }
};

global.CanvasRenderingContext2D = class CanvasRenderingContext2D {};

// Set up environment
global.window = global.window || {};
global.document = global.document || {};