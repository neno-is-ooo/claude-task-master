import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

describe('Roo Files Inclusion in Package', () => {
    // This test verifies that the required Roo files are included in the final package
    
    test('package.json includes assets/** in the "files" array for Roo source files', () => {
        // Read the package.json file
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check if assets/** is included in the files array (which contains Roo files)
        expect(packageJson.files).toContain('assets/**');
        
        // Verify we don't have redundant entries
        expect(packageJson.files).not.toContain('.roo/**');
        expect(packageJson.files).not.toContain('.roomodes');
    });
    
    test('prepare-package.js verifies required Roo files', () => {
        // Read the prepare-package.js file
        const preparePackagePath = path.join(process.cwd(), 'scripts', 'prepare-package.js');
        const preparePackageContent = fs.readFileSync(preparePackagePath, 'utf8');
        
        // Check if prepare-package.js includes verification for Roo files
        expect(preparePackageContent).toContain('.roo/');
        expect(preparePackageContent).toContain('.roomodes');
        expect(preparePackageContent).toContain('assets/roocode/.roo/rules/');
    });
    
    test('init.js creates Roo directories and copies files', () => {
        // Read the init.js file
        const initJsPath = path.join(process.cwd(), 'scripts', 'init.js');
        const initJsContent = fs.readFileSync(initJsPath, 'utf8');
        
        // Check if init.js includes code to create Roo directories and copy files
        expect(initJsContent).toContain('ensureDirectoryExists(path.join(targetDir, \'.roo\'))');
        expect(initJsContent).toContain('copyTemplateFile(\'.roomodes\', path.join(targetDir, \'.roomodes\'))');
        expect(initJsContent).toContain('rules-architect');
        expect(initJsContent).toContain('rules-ask');
        expect(initJsContent).toContain('rules-boomerang');
        expect(initJsContent).toContain('rules-code');
        expect(initJsContent).toContain('rules-debug');
        expect(initJsContent).toContain('rules-test');
    });
    
    test('source Roo files exist in assets directory', () => {
        // Verify that the source files for Roo integration exist
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roomodes'))).toBe(true);
        
        // Check for rule files
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules-architect'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules-ask'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules-boomerang'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules-code'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules-debug'))).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), 'assets', 'roocode', '.roo', 'rules-test'))).toBe(true);
    });
});
