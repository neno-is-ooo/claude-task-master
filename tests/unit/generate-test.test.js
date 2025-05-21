import { jest } from '@jest/globals';

// Mock fs before import
jest.mock('fs', () => ({
    existsSync: jest.fn(() => false),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn()
}));

const mockGenerateTextService = jest.fn();

jest.unstable_mockModule('../../scripts/modules/ai-services-unified.js', () => ({
    generateTextService: mockGenerateTextService
}));

const mockReadJSON = jest.fn();
jest.unstable_mockModule('../../scripts/modules/utils.js', () => ({
    readJSON: mockReadJSON,
    log: jest.fn()
}));

let generateTest;
let fs;

beforeAll(async () => {
    generateTest = (await import('../../scripts/modules/task-manager/generate-test.js')).default;
    fs = await import('fs');
});

beforeEach(() => {
    jest.clearAllMocks();
    mockReadJSON.mockReturnValue({
        tasks: [
            { id: 1, title: 'Test', description: 'Desc', details: '' }
        ]
    });
    mockGenerateTextService.mockResolvedValue({ mainResult: 'test code' });
});

describe('generateTest', () => {
    test('calls AI service and writes file', async () => {
        await generateTest({ tasksPath: 'tasks.json', id: 1 });
        expect(mockGenerateTextService).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('throws for missing task', async () => {
        mockReadJSON.mockReturnValue({ tasks: [] });
        await expect(
            generateTest({ tasksPath: 'tasks.json', id: 5 })
        ).rejects.toThrow('Task 5 not found');
    });
});
