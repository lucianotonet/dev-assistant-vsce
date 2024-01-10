// src/commandOrchestrator.ts
import * as vscode from 'vscode';

export class IOHandler {
    private static instance: IOHandler;

    private constructor() {
        // Construtor privado para o padrão Singleton
    }

    public static getInstance(): IOHandler {
        if (!IOHandler.instance) {
            IOHandler.instance = new IOHandler();
        }
        return IOHandler.instance;
    }

    public async executeCommand(operation: string, args: any[]): Promise<void> {
        switch (operation) {
            case 'insertText':
                await this.insertText(args[0], args[1]);
                break;
            case 'openFile':
                await this.openFile(args[0]);
                break;
            case 'showDiff':
                await this.showDiff(args[0], args[1]);
                break;
            default:
                vscode.window.showWarningMessage(`Comando não reconhecido: ${operation}`);
                break;
        }
    }

    private async insertText(text: string, position?: vscode.Position): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const insertPosition = position || editor.selection.active;
            await editor.edit(editBuilder => {
                editBuilder.insert(insertPosition, text);
            });
        }
    }

    private async openFile(filePath: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
    }

    private async showDiff(originalFilePath: string, modifiedFilePath: string): Promise<void> {
        const originalUri = vscode.Uri.file(originalFilePath);
        const modifiedUri = vscode.Uri.file(modifiedFilePath);
        await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri);
    }

    // Adicione mais métodos conforme necessário
}