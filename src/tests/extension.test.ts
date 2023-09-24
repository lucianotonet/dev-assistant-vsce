import * as vscode from 'vscode';
import * as myExtension from '../extension';
import { expect } from 'chai';

describe('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting tests...');

    describe('activateExtension', () => {
        it('should activate the extension without errors', () => {
            const context: vscode.ExtensionContext = {
                subscriptions: [],
                workspaceState: {} as any,
                globalState: {} as any,
                extensionPath: '',
                asAbsolutePath: (relativePath: string) => '',
                storagePath: '',
                globalStoragePath: '',
                logPath: '',
                extensionUri: vscode.Uri.file(''),
                environmentVariableCollection: {} as any,
                secrets: {} as any,
                storageUri: vscode.Uri.file(''),
                globalStorageUri: vscode.Uri.file(''),
                logUri: vscode.Uri.file(''),
                extensionMode: vscode.ExtensionMode.Production,
                extension: {} as vscode.Extension<any>
            };
            expect(() => myExtension.activate(context)).to.not.throw();
        });
    });
});