import fs from 'fs';
import path from 'path';
import os from 'os';
import { jest } from '@jest/globals';

// Import the actual config-manager module without mocks
import * as configManager from '../../scripts/modules/config-manager.js';

// Test helpers
function createTestDirectory() {
	const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
	return testDir;
}

function cleanupTestDirectory(dir) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

describe('Config Manager Integration Tests', () => {
	let testDir;
	let originalConsoleWarn;
	let originalConsoleError;
	let consoleWarnSpy;
	let consoleErrorSpy;

	beforeEach(() => {
		testDir = createTestDirectory();

		// Spy on console methods to verify warnings/errors
		originalConsoleWarn = console.warn;
		originalConsoleError = console.error;
		consoleWarnSpy = jest.fn();
		consoleErrorSpy = jest.fn();
		console.warn = consoleWarnSpy;
		console.error = consoleErrorSpy;
	});

	afterEach(() => {
		cleanupTestDirectory(testDir);

		// Restore console methods
		console.warn = originalConsoleWarn;
		console.error = originalConsoleError;
	});

	describe('getConfig', () => {
		test('should return default config when .taskmasterconfig does not exist', () => {
			// Act: Get config from directory without .taskmasterconfig
			const config = configManager.getConfig(testDir, true);

			// Assert: Should return default configuration
			expect(config).toBeDefined();
			expect(config.models).toBeDefined();
			expect(config.models.main).toBeDefined();
			expect(config.models.research).toBeDefined();
			expect(config.models.fallback).toBeDefined();
			expect(config.global).toBeDefined();

			// Check that it has the required properties
			expect(config.models.main.provider).toBe('anthropic');
			expect(config.models.main.modelId).toBe('claude-3-7-sonnet-20250219');
			expect(config.global.logLevel).toBe('info');
			expect(config.global.complexityMode).toBe('balanced');

			// Should have logged a warning about missing config
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('not found at provided project root')
			);
		});

		test('should read and merge valid config file with defaults', () => {
			// Arrange: Create a valid config file
			const customConfig = {
				models: {
					main: {
						provider: 'openai',
						modelId: 'gpt-4o',
						maxTokens: 4096,
						temperature: 0.5
					}
				},
				global: {
					logLevel: 'debug',
					projectName: 'Test Project'
				}
			};

			const configPath = path.join(testDir, '.taskmasterconfig');
			fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

			// Act: Get config
			const config = configManager.getConfig(testDir, true);

			// Assert: Should merge custom config with defaults
			expect(config.models.main.provider).toBe('openai');
			expect(config.models.main.modelId).toBe('gpt-4o');
			expect(config.models.main.maxTokens).toBe(4096);
			expect(config.models.main.temperature).toBe(0.5);

			// Should retain default values for unspecified properties
			expect(config.models.research.provider).toBe('perplexity');
			expect(config.models.fallback.provider).toBe('anthropic');

			// Should merge global settings
			expect(config.global.logLevel).toBe('debug');
			expect(config.global.projectName).toBe('Test Project');
			expect(config.global.complexityMode).toBe('balanced'); // Default retained
		});

		test('should handle partial config file and merge with defaults', () => {
			// Arrange: Create a partial config file
			const partialConfig = {
				models: {
					main: { provider: 'openai', modelId: 'gpt-4-turbo' }
				},
				global: {
					projectName: 'Partial Project'
				}
			};

			const configPath = path.join(testDir, '.taskmasterconfig');
			fs.writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));

			// Act: Get config
			const config = configManager.getConfig(testDir, true);

			// Assert: Should merge properly
			expect(config.models.main.provider).toBe('openai');
			expect(config.models.main.modelId).toBe('gpt-4-turbo');
			// Should have default maxTokens and temperature since not specified
			expect(config.models.main.maxTokens).toBeDefined();
			expect(config.models.main.temperature).toBeDefined();

			// Other models should use defaults
			expect(config.models.research.provider).toBe('perplexity');
			expect(config.models.fallback.provider).toBe('anthropic');

			// Global should merge
			expect(config.global.projectName).toBe('Partial Project');
			expect(config.global.logLevel).toBe('info'); // Default
		});

		test('should handle invalid JSON and return defaults', () => {
			// Arrange: Create invalid JSON file
			const configPath = path.join(testDir, '.taskmasterconfig');
			fs.writeFileSync(configPath, 'invalid json content');

			// Act: Get config
			const config = configManager.getConfig(testDir, true);

			// Assert: Should return defaults and log error
			expect(config.models.main.provider).toBe('anthropic');
			expect(config.global.logLevel).toBe('info');
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error reading or parsing')
			);
		});

		test('should validate providers and fallback to defaults for invalid ones', () => {
			// Arrange: Create config with invalid provider
			const invalidConfig = {
				models: {
					main: { provider: 'invalid-provider', modelId: 'some-model' },
					research: { provider: 'perplexity', modelId: 'sonar-pro' }
				}
			};

			const configPath = path.join(testDir, '.taskmasterconfig');
			fs.writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

			// Act: Get config
			const config = configManager.getConfig(testDir, true);

			// Assert: Should fallback to default for invalid provider
			expect(config.models.main.provider).toBe('anthropic'); // Should fallback to default
			expect(config.models.research.provider).toBe('perplexity'); // Should keep valid one
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid main provider "invalid-provider"')
			);
		});
	});

	describe('writeConfig', () => {
		test('should write config to file successfully', () => {
			// Arrange: Create test config
			const testConfig = {
				models: {
					main: {
						provider: 'openai',
						modelId: 'gpt-4o',
						maxTokens: 4096,
						temperature: 0.3
					}
				},
				global: {
					logLevel: 'debug',
					projectName: 'Test Write'
				}
			};

			// Act: Write config
			const success = configManager.writeConfig(testConfig, testDir);

			// Assert: Should succeed and create file
			expect(success).toBe(true);

			const configPath = path.join(testDir, '.taskmasterconfig');
			expect(fs.existsSync(configPath)).toBe(true);

			// Verify file content
			const writtenContent = fs.readFileSync(configPath, 'utf-8');
			const parsedConfig = JSON.parse(writtenContent);
			expect(parsedConfig).toEqual(testConfig);
		});

		test('should handle write errors gracefully', () => {
			// Arrange: Create readonly directory to cause write error
			const readonlyDir = path.join(testDir, 'readonly');
			fs.mkdirSync(readonlyDir);
			fs.chmodSync(readonlyDir, 0o444); // Read-only

			const testConfig = { test: 'value' };

			// Act: Try to write to readonly directory
			const success = configManager.writeConfig(testConfig, readonlyDir);

			// Assert: Should fail gracefully
			expect(success).toBe(false);
			expect(consoleErrorSpy).toHaveBeenCalled();

			// Cleanup
			fs.chmodSync(readonlyDir, 0o755); // Restore permissions for cleanup
		});
	});

	describe('getter functions', () => {
		test('should return correct values from config', () => {
			// Arrange: Create custom config
			const customConfig = {
				models: {
					main: { provider: 'openai', modelId: 'gpt-4o' },
					research: { provider: 'google', modelId: 'gemini-pro' }
				},
				global: {
					logLevel: 'debug',
					projectName: 'Test Project'
				}
			};

			const configPath = path.join(testDir, '.taskmasterconfig');
			fs.writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

			// Act & Assert: Test various getters
			expect(configManager.getMainProvider(testDir)).toBe('openai');
			expect(configManager.getLogLevel(testDir)).toBe('debug');
			expect(configManager.getProjectName(testDir)).toBe('Test Project');
		});
	});

	describe('isConfigFilePresent', () => {
		test('should return true when config file exists', () => {
			// Arrange: Create config file
			const configPath = path.join(testDir, '.taskmasterconfig');
			fs.writeFileSync(configPath, '{}');

			// Act & Assert
			expect(configManager.isConfigFilePresent(testDir)).toBe(true);
		});

		test('should return false when config file does not exist', () => {
			// Act & Assert
			expect(configManager.isConfigFilePresent(testDir)).toBe(false);
		});
	});

	describe('validation functions', () => {
		test('should validate known providers correctly', () => {
			// Load config to initialize MODEL_MAP
			configManager.getConfig(testDir, true);

			// Test valid providers
			expect(configManager.validateProvider('openai')).toBe(true);
			expect(configManager.validateProvider('anthropic')).toBe(true);
			expect(configManager.validateProvider('google')).toBe(true);
			expect(configManager.validateProvider('perplexity')).toBe(true);
			expect(configManager.validateProvider('ollama')).toBe(true);
			expect(configManager.validateProvider('openrouter')).toBe(true);

			// Test invalid providers
			expect(configManager.validateProvider('invalid-provider')).toBe(false);
			expect(configManager.validateProvider('')).toBe(false);
			expect(configManager.validateProvider(null)).toBe(false);
		});

		test('should get all providers from supported models', () => {
			// Load config to initialize MODEL_MAP
			configManager.getConfig(testDir, true);

			const providers = configManager.getAllProviders();
			expect(Array.isArray(providers)).toBe(true);
			expect(providers.length).toBeGreaterThan(0);
			expect(providers).toContain('anthropic');
			expect(providers).toContain('openai');
		});
	});
});
