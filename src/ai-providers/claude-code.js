// src/ai-providers/claude-code.js

const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Basic log utility
const log = (...args) => {
  // In a real application, you might use a more sophisticated logger
  // like Winston or Bunyan, or integrate with a logging service.
  // For this example, we'll just log to the console.
  console.log('[claude-code]', ...args);
};

/**
 * Generates text using the Claude CLI.
 * @param {string} prompt - The prompt to send to Claude.
 * @returns {Promise<string>} The generated text.
 */
async function generateClaudeCodeText(prompt) {
  // Escape the prompt to be safely used in a shell command
  const escapedPrompt = prompt.replace(/"/g, '\\"');
  const command = `echo "${escapedPrompt}" | claude --print --output-format json`;
  log(`Executing command: ${command}`);

  try {
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      // claude CLI might output non-fatal info to stderr, so log it but don't always throw
      log(`CLI stderr: ${stderr}`);
      // Example: if stderr contains "Rate limit exceeded", then throw an error
      if (stderr.toLowerCase().includes("error") || stderr.toLowerCase().includes("failed")) {
        throw new Error(`CLI Error: ${stderr}`);
      }
    }

    log(`Raw CLI output: ${stdout}`);
    const output = JSON.parse(stdout);

    if (output && output.response && typeof output.response.completion === 'string') {
      return output.response.completion;
    } else {
      log('Could not find generated text in CLI output:', output);
      throw new Error('Could not parse generated text from Claude CLI output. Expected response.completion.');
    }
  } catch (error) {
    log(`Error in generateClaudeCodeText: ${error.message}`);
    if (error.message.includes("command not found")) {
        throw new Error("Claude CLI command not found. Please ensure it is installed and in your PATH.");
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON output from Claude CLI: ${error.message}`);
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Streams text from the Claude CLI.
 * (Currently defers to generateClaudeCodeText)
 * @param {string} prompt - The prompt to send to Claude.
 * @returns {Promise<string>} The generated text.
 */
async function streamClaudeCodeText(prompt) {
  log('streamClaudeCodeText called, deferring to generateClaudeCodeText.');
  // For now, this will just call generateClaudeCodeText.
  // Streaming directly from a CLI that uses a pipe (`echo ... | claude`)
  // would require a different approach, possibly involving spawning the `claude`
  // process directly and piping stdin, then reading its stdout stream.
  // return generateClaudeCodeText(prompt);

  // Alternatively, throw a "not implemented" error:
  throw new Error('Streaming not implemented for Claude Code CLI provider.');
}

/**
 * Generates a structured object using the Claude CLI.
 * @param {string} prompt - The prompt to send to Claude, expecting a JSON object in response.
 * @returns {Promise<object>} The generated object.
 */
async function generateClaudeCodeObject(prompt) {
  const escapedPrompt = prompt.replace(/"/g, '\\"');
  const command = `echo "${escapedPrompt}" | claude --print --output-format json`;
  log(`Executing command for object: ${command}`);

  try {
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      log(`CLI stderr (object generation): ${stderr}`);
      if (stderr.toLowerCase().includes("error") || stderr.toLowerCase().includes("failed")) {
        throw new Error(`CLI Error (object generation): ${stderr}`);
      }
    }

    log(`Raw CLI output for object: ${stdout}`);
    const output = JSON.parse(stdout);

    // Assuming the primary object is within response.completion,
    // and it's a JSON string that needs to be parsed again.
    // Or, if the entire output.response is the object.
    if (output && output.response && output.response.completion) {
      try {
        // If completion is expected to be a JSON string
        return JSON.parse(output.response.completion);
      } catch (e) {
        // If completion is the object itself (but not a string)
        // This case might not be hit if claude CLI always returns a string for completion.
        // For safety, let's assume it could be an object if JSON.parse fails.
        if (typeof output.response.completion === 'object') {
            return output.response.completion;
        }
        log('Failed to parse completion string as JSON, and it is not an object:', output.response.completion);
        throw new Error('Could not parse object from Claude CLI output. Expected response.completion to be a JSON string or an object.');
      }
    } else if (output && output.response) {
        // Fallback if completion is not the target, but response is.
        return output.response;
    }
     else {
      log('Could not find generated object in CLI output:', output);
      throw new Error('Could not parse structured object from Claude CLI output.');
    }
  } catch (error) {
    log(`Error in generateClaudeCodeObject: ${error.message}`);
    if (error.message.includes("command not found")) {
        throw new Error("Claude CLI command not found. Please ensure it is installed and in your PATH.");
    }
    if (error instanceof SyntaxError) { // This catches JSON.parse errors on `stdout`
      throw new Error(`Failed to parse JSON output from Claude CLI for object: ${error.message}`);
    }
    // Errors from JSON.parse(output.response.completion) will be caught and re-thrown above.
    throw error; // Re-throw other errors
  }
}

module.exports = {
  generateClaudeCodeText,
  streamClaudeCodeText,
  generateClaudeCodeObject,
};
