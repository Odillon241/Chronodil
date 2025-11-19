// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock des APIs globales pour les tests
global.BroadcastChannel = jest.fn(() => ({
  postMessage: jest.fn(),
  close: jest.fn(),
  onmessage: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}))

global.Notification = {
  permission: 'default',
  requestPermission: jest.fn().mockResolvedValue('granted'),
}

global.Audio = jest.fn(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

global.localStorage = localStorageMock as any

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any

// Suppression des avertissements React
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
