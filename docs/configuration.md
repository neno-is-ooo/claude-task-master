# Configuration

Taskmaster uses two primary methods for configuration:

1.  **`.taskmasterconfig` File (Project Root - Recommended for most settings)**

    - This JSON file stores most configuration settings, including AI model selections, parameters, logging levels, and project defaults.
    - **Location:** This file is created in the root directory of your project when you run the `task-master models --setup` interactive setup. You typically do this during the initialization sequence. Do not manually edit this file beyond adjusting Temperature and Max Tokens depending on your model.
    - **Management:** Use the `task-master models --setup` command (or `models` MCP tool) to interactively create and manage this file. You can also set specific models directly using `task-master models --set-<role>=<model_id>`, adding `--ollama` or `--openrouter` flags for custom models. Manual editing is possible but not recommended unless you understand the structure.
    - **Example Structure:**
      ```json
      {
      	"models": {
      		"main": {
      			"provider": "anthropic",
      			"modelId": "claude-3-7-sonnet-20250219",
      			"maxTokens": 64000,
      			"temperature": 0.2,
      			"baseUrl": "https://api.anthropic.com/v1"
      		},
      		"research": {
      			"provider": "perplexity",
      			"modelId": "sonar-pro",
      			"maxTokens": 8700,
      			"temperature": 0.1,
      			"baseUrl": "https://api.perplexity.ai/v1"
      		},
      		"fallback": {
      			"provider": "anthropic",
      			"modelId": "claude-3-5-sonnet",
      			"maxTokens": 64000,
      			"temperature": 0.2
      		}
      	},
      	"global": {
      		"logLevel": "info",
      		"debug": false,
      		"defaultSubtasks": 5,
      		"defaultPriority": "medium",
      		"projectName": "Your Project Name",
      		"ollamaBaseUrl": "http://localhost:11434/api",
      		"azureOpenaiBaseUrl": "https://your-endpoint.openai.azure.com/"
      	}
      }
      ```

2.  **Environment Variables (`.env` file or MCP `env` block - For API Keys Only)**
    - Used **exclusively** for sensitive API keys and specific endpoint URLs.
    - **Location:**
      - For CLI usage: Create a `.env` file in your project root.
      - For MCP/Cursor usage: Configure keys in the `env` section of your `.cursor/mcp.json` file.
    - **Required API Keys (Depending on configured providers):**
      - `ANTHROPIC_API_KEY`: Your Anthropic API key.
      - `PERPLEXITY_API_KEY`: Your Perplexity API key.
      - `OPENAI_API_KEY`: Your OpenAI API key.
      - `GOOGLE_API_KEY`: Your Google API key.
      - `MISTRAL_API_KEY`: Your Mistral API key.
      - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key (also requires `AZURE_OPENAI_ENDPOINT`).
      - `OPENROUTER_API_KEY`: Your OpenRouter API key.
      - `XAI_API_KEY`: Your X-AI API key.
    - **Optional Endpoint Overrides:**
      - **Per-role `baseUrl` in `.taskmasterconfig`:** You can add a `baseUrl` property to any model role (`main`, `research`, `fallback`) to override the default API endpoint for that provider. If omitted, the provider's standard endpoint is used.
      - `AZURE_OPENAI_ENDPOINT`: Required if using Azure OpenAI key (can also be set as `baseUrl` for the Azure model role).
      - `OLLAMA_BASE_URL`: Override the default Ollama API URL (Default: `http://localhost:11434/api`).
    - **Note on CLI-based Providers (Ollama, OpenAI Codex CLI, Claude Code CLI):** These providers typically do not require an API key to be set in the `.env` file or MCP `env` block for Taskmaster. They rely on their own local configuration and authentication (e.g., Ollama being served, `openai-codex login`, or `claude login`).

**Important:** Settings like model ID selections (`main`, `research`, `fallback`), `maxTokens`, `temperature`, `logLevel`, `defaultSubtasks`, `defaultPriority`, and `projectName` are **managed in `.taskmasterconfig`**, not environment variables.

## Example `.env` File (for API Keys)

```
# Required API keys for providers configured in .taskmasterconfig
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# GOOGLE_API_KEY=AIzaSy...
# etc.

# Optional Endpoint Overrides
# AZURE_OPENAI_ENDPOINT=https://your-azure-endpoint.openai.azure.com/
# OLLAMA_BASE_URL=http://custom-ollama-host:11434/api
```

## Provider-Specific Configuration Details

### Ollama

- **Selection:** Choose an Ollama model (e.g., `ollama/mistral-small3.1:latest`) during `task-master models --setup` or by using `task-master models --set-<role>=<ollama_model_id> --ollama`.
- **API Key:** No API key is typically required in Taskmaster's `.env`. Ollama runs as a local service.
- **Endpoint:** The default Ollama API endpoint is `http://localhost:11434/api`. This can be overridden by setting `OLLAMA_BASE_URL` in your `.env` file or by setting the `ollamaBaseUrl` in the `global` section of your `.taskmasterconfig`.

### OpenRouter

- **Selection:** Choose an OpenRouter model (e.g., `openrouter/google/gemini-2.0-flash-001`) during `task-master models --setup` or by using `task-master models --set-<role>=<openrouter_model_id> --openrouter`.
- **API Key:** Requires `OPENROUTER_API_KEY` in your `.env` file or MCP `env` block.
- **Endpoint:** Uses the standard OpenRouter API endpoint. Can be overridden per-role with `baseUrl` in `.taskmasterconfig`.

### OpenAI Codex CLI

- **Selection:**
    - Choose "🤖 OpenAI Codex CLI (Subscription)" during the interactive setup (`task-master models --setup`).
    - This will configure the `openai-codex` provider with the model ID `default` for the selected role(s) (e.g., main, fallback).
- **API Key:** Taskmaster does **not** manage API keys for the OpenAI Codex CLI provider.
- **Prerequisites:**
    - You must have the OpenAI Codex CLI installed on your system.
    - You need to be authenticated with the CLI (e.g., by running `openai-codex login`).
    - The `openai-codex` command must be accessible in your system's PATH.
- **Functionality:** When a role is configured to use `openai-codex`, Taskmaster will execute the `openai-codex` command locally. Ensure your CLI is set up to use the correct underlying OpenAI model and account. Taskmaster simply acts as an orchestrator for this CLI tool.

### Claude Code CLI

- **Selection:**
    - Choose "⚡ Claude Code CLI (Subscription)" during the interactive setup (`task-master models --setup`).
    - This will configure the `claude-code` provider with the model ID `default` for the selected role(s) (e.g., main, fallback).
- **API Key:** Taskmaster does **not** manage API keys for the Claude Code CLI provider.
- **Prerequisites:**
    - You must have the Claude Code CLI (`claude` command) installed on your system.
    - You need to be authenticated with the CLI (e.g., by running `claude login` or ensuring your environment is configured for the `claude` command to work).
    - The `claude` command must be accessible in your system's PATH.
- **Functionality:** When a role is configured to use `claude-code`, Taskmaster will execute the `claude` command locally (typically `echo "<prompt>" | claude --print --output-format json`). Ensure your CLI is set up correctly. Taskmaster acts as an orchestrator for this CLI tool.

## Troubleshooting

### Configuration Errors

- If Task Master reports errors about missing configuration or cannot find `.taskmasterconfig`, run `task-master models --setup` in your project root to create or repair the file.
- Ensure API keys are correctly placed in your `.env` file (for CLI) or `.cursor/mcp.json` (for MCP) and are valid for the providers selected in `.taskmasterconfig`.

### If `task-master init` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/claude-task-master/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/eyaltoledano/claude-task-master.git
cd claude-task-master
node scripts/init.js
```
