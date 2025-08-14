/**
 * Test setup file for Vitest
 */

import '@testing-library/jest-dom';

// Mock window.crypto for PKCE tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: async (algorithm, data) => {
        // Mock SHA-256 hash
        const mockHash = new ArrayBuffer(32);
        const view = new Uint8Array(mockHash);
        for (let i = 0; i < 32; i++) {
          view[i] = Math.floor(Math.random() * 256);
        }
        return mockHash;
      }
    }
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;