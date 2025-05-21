import fs from 'fs';
import path from 'path';

import { readJSON, log } from '../utils.js';
import { startLoadingIndicator, stopLoadingIndicator } from '../ui.js';
import { generateTextService } from '../ai-services-unified.js';
import { getDebugFlag } from '../config-manager.js';

function padId(id) {
    return id.toString().padStart(3, '0');
}

/**
 * Generate a Jest test file for a task using the AI service.
 * @param {object} params - Options for generation
 * @param {string} params.tasksPath - Path to tasks.json
 * @param {number|string} params.id - Task ID
 * @param {boolean} [params.includeSubtasks=false] - Include subtasks in prompt
 * @param {string} [params.prompt=''] - Additional prompt context
 * @param {object} [params.context={}] - Execution context (session, mcpLog)
 */
async function generateTest({ tasksPath, id, includeSubtasks = false, prompt = '', context = {} }) {
    const { session, mcpLog, projectRoot: ctxRoot } = context;
    const outputFormat = mcpLog ? 'json' : 'text';
    const projectRoot = ctxRoot || path.dirname(path.dirname(tasksPath));

    const logger = mcpLog || {
        info: (msg) => log('info', msg),
        error: (msg) => log('error', msg)
    };

    const data = readJSON(tasksPath);
    if (!data || !Array.isArray(data.tasks)) {
        throw new Error(`Invalid tasks data in ${tasksPath}`);
    }

    const taskId = parseInt(id, 10);
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) {
        throw new Error(`Task ${id} not found`);
    }

    let taskPrompt = `Generate a Jest test file for the following task.\nTask ${task.id}: ${task.title}\n${task.description}\n${task.details || ''}`;
    if (includeSubtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        taskPrompt += `\nSubtasks:\n` + task.subtasks.map((st) => `${st.id}. ${st.title} - ${st.description}`).join('\n');
    }
    if (prompt) {
        taskPrompt += `\nAdditional Context: ${prompt}`;
    }

    const systemPrompt = 'You are an AI developer assistant. Provide only valid Jest test code.';

    logger.info(`Generating test for task ${task.id}`);
    const indicator = startLoadingIndicator ? startLoadingIndicator('Generating tests...') : null;
    let aiResponse;
    try {
        aiResponse = await generateTextService({
            prompt: taskPrompt,
            systemPrompt,
            role: 'main',
            session,
            projectRoot,
            commandName: 'generate-test',
            outputType: outputFormat
        });
    } finally {
        if (indicator) stopLoadingIndicator(indicator);
    }

    let testContent = '';
    if (typeof aiResponse?.mainResult === 'string') {
        testContent = aiResponse.mainResult;
    } else if (typeof aiResponse === 'string') {
        testContent = aiResponse;
    }

    const outputDir = path.join(projectRoot, 'tests', 'generated');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const fileName = `task_${padId(task.id)}.test.ts`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, testContent);

    logger.info(`Test written to ${filePath}`);
    return filePath;
}

export default generateTest;
