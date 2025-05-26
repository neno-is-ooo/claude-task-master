import { jest } from '@jest/globals';
import {
  generateClaudeCodeText,
  generateClaudeCodeObject,
  streamClaudeCodeText
} from '../../../src/ai-providers/claude-code.js';

// Mock child_process module
const mockSpawn = jest.fn();
jest.unstable_mockModule('child_process', () => ({
  spawn: mockSpawn
}));

describe('Claude Code Provider', () => {
  let mockChildProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock child process
    mockChildProcess = {
      stdin: {
        write: jest.fn(),
        end: jest.fn()
      },
      stdout: {
        on: jest.fn(),
        setEncoding: jest.fn()
      },
      stderr: {
        on: jest.fn(),
        setEncoding: jest.fn()
      },
      on: jest.fn()
    };

    mockSpawn.mockReturnValue(mockChildProcess);
  });

  describe('generateClaudeCodeText', () => {
    it('should generate text successfully', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, Claude!' }
      ];
      const options = {
        maxTokens: 1000,
        temperature: 0.7
      };

      // Mock successful response
      const mockResponse = {
        status: 'success',
        response: 'Hello! How can I help you today?',
        cost_usd: 0
      };

      // Set up stdout mock to emit data
      mockChildProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          // Simulate Claude Code response
          setTimeout(() => {
            callback(JSON.stringify(mockResponse));
          }, 10);
        }
      });

      // Set up process exit mock
      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          setTimeout(() => {
            callback(0);
          }, 20);
        }
      });

      const result = await generateClaudeCodeText({ messages, ...options });

      expect(result).toEqual({
        text: 'Hello! How can I help you today?',
        usage: {
          promptTokens: null,
          completionTokens: null,
          totalTokens: null
        },
        cost: 0
      });

      expect(mockSpawn).toHaveBeenCalledWith('claude', ['chat', '--json']);
      expect(mockChildProcess.stdin.write).toHaveBeenCalled();
      expect(mockChildProcess.stdin.end).toHaveBeenCalled();
    });

    it('should handle Claude Code not installed error', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      // Mock spawn error (command not found)
      mockSpawn.mockImplementation(() => {
        throw new Error('spawn claude ENOENT');
      });

      await expect(generateClaudeCodeText({ messages })).rejects.toThrow(
        'Claude Code CLI is not installed'
      );
    });

    it('should handle non-zero exit code', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      mockChildProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('Error: Something went wrong');
        }
      });

      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          callback(1); // Non-zero exit code
        }
      });

      await expect(generateClaudeCodeText({ messages })).rejects.toThrow(
        'Claude Code command failed with exit code 1'
      );
    });

    it('should handle JSON parse errors', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      mockChildProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('Invalid JSON response');
        }
      });

      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          callback(0);
        }
      });

      await expect(generateClaudeCodeText({ messages })).rejects.toThrow(
        'Failed to parse Claude Code response'
      );
    });

    it('should handle timeout', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const options = { maxTokens: 1000, temperature: 0.7, timeout: 100 }; // 100ms timeout

      // Don't emit any events to simulate timeout
      mockChildProcess.on.mockImplementation(() => {});
      mockChildProcess.stdout.on.mockImplementation(() => {});

      await expect(generateClaudeCodeText({ messages, ...options })).rejects.toThrow(
        'Claude Code command timed out'
      );
    }, 10000);
  });

  describe('generateClaudeCodeObject', () => {
    it('should generate structured object successfully', async () => {
      const messages = [
        { role: 'user', content: 'Generate a task object' }
      ];
      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' }
        }
      };

      const mockResponse = {
        status: 'success',
        response: '{"title": "Test Task", "description": "A test task"}',
        cost_usd: 0
      };

      mockChildProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(mockResponse));
        }
      });

      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          callback(0);
        }
      });

      const result = await generateClaudeCodeObject({ messages, schema });

      expect(result).toEqual({
        object: {
          title: 'Test Task',
          description: 'A test task'
        },
        usage: {
          promptTokens: null,
          completionTokens: null,
          totalTokens: null
        },
        cost: 0
      });
    });

    it('should handle invalid structured response', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const schema = { type: 'object' };

      const mockResponse = {
        status: 'success',
        response: 'Not a valid JSON object',
        cost_usd: 0
      };

      mockChildProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(mockResponse));
        }
      });

      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          callback(0);
        }
      });

      await expect(generateClaudeCodeObject({ messages, schema })).rejects.toThrow(
        'Failed to parse structured response from Claude Code'
      );
    });
  });

  describe('streamClaudeCodeText', () => {
    it('should stream text successfully', async () => {
      const messages = [{ role: 'user', content: 'Stream test' }];
      const options = { maxTokens: 1000 };

      const mockResponse = {
        status: 'success',
        response: 'Streaming response',
        cost_usd: 0
      };

      mockChildProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify(mockResponse));
        }
      });

      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'exit') {
          callback(0);
        }
      });

      const stream = await streamClaudeCodeText({ messages, ...options });
      
      // Collect stream chunks
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.some(chunk => chunk.type === 'text-delta')).toBe(true);
      expect(chunks[chunks.length - 1].type).toBe('usage');
    });
  });
});