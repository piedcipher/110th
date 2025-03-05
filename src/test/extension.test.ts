import * as assert from 'assert';
import * as vscode from 'vscode';
import { isValidLottieJson } from '../extension';

suite('Lottie Viewer Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('isValidLottieJson validates Lottie JSON correctly', () => {
        // Valid Lottie JSON
        const validJson = {
            v: "5.7.1",
            w: 500,
            h: 500,
            layers: []
        };
        assert.strictEqual(isValidLottieJson(validJson), true);

        // Invalid JSON cases
        assert.strictEqual(isValidLottieJson({}), false);
        assert.strictEqual(isValidLottieJson({ v: "5.7.1" }), false);
        assert.strictEqual(isValidLottieJson({ v: "5.7.1", w: 500, h: 500 }), false);
        assert.strictEqual(isValidLottieJson(null), false);
    });

    test('Extension commands are registered', async () => {
        // Wait for extension to activate
        await vscode.extensions.getExtension('piedcipher.110th')?.activate();
        const commands = await vscode.commands.getCommands();
        assert.strictEqual(commands.includes('lottieViewer.preview'), true);
    });
});
