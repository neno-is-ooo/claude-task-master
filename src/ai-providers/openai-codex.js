// src/ai-providers/openai-codex.js

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const log = (...args) => {
  // In a real application, you might use a more sophisticated logger
  // like Winston or Bunyan, or integrate with a logging service.
  // For this example, we'll just log to the console.
  console.log('[openai-codex]', ...args);
};

async function generateOpenAICodexText(prompt) {
  const command = `openai-codex "${prompt}" --output-format json`;
  log(`Executing command: ${command}`);

  try {
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      log(`Error during command execution: ${stderr}`);
      throw new Error(`CLI Error: ${stderr}`);
    }

    log(`Raw CLI output: ${stdout}`);
    const output = JSON.parse(stdout);

    // Assuming the text is in a field like 'completion' or 'text'
    // Adjust this based on the actual CLI output format
    const generatedText = output.completion || output.text;

    if (typeof generatedText === 'undefined') {
      log('Could not find generated text in CLI output:', output);
      throw new Error('Could not parse generated text from CLI output.');
    }

    return generatedText;
  } catch (error) {
    log(`Error in generateOpenAICodexText: ${error.message}`);
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON output from CLI: ${error.message}`);
    }
    throw error; // Re-throw other errors
  }
}

async function streamOpenAICodexText(prompt) {
  // For now, this will just call generateOpenAICodexText.
  // Streaming directly from a CLI might require more complex handling
  // of stdout streams.
  log('streamOpenAICodexText called, deferring to generateOpenAICodexText.');
  // Alternatively, throw a "not implemented" error:
  // throw new Error('Streaming not implemented for OpenAI Codex CLI.');
  return generateOpenAICodexText(prompt);
}

async function generateOpenAICodexObject(prompt) {
  const command = `openai-codex "${prompt}" --output-format json`;
  log(`Executing command for object: ${command}`);

  try {
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      log(`Error during command execution: ${stderr}`);
      throw new Error(`CLI Error: ${stderr}`);
    }

    log(`Raw CLI output for object: ${stdout}`);
    const output = JSON.parse(stdout);
    return output;
  } catch (error) {
    log(`Error in generateOpenAICodexObject: ${error.message}`);
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON output from CLI for object: ${error.message}`);
    }
    throw error; // Re-throw other errors
  }
}

module.exports = {
  generateOpenAICodexText,
  streamOpenAICodexText,
  generateOpenAICodexObject,
};
