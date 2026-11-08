/** Integration tests run in Node against the hosted dev project (Section 18 #23). */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  transformIgnorePatterns: ['node_modules/(?!(@react-native-async-storage|expo)/)'],
  testTimeout: 30000,
};
