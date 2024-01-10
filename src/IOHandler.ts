// src/commandOrchestrator.ts
import * as vscode from 'vscode';
import { ApiHandler } from './apiHandler';
import { DEV_ASSISTANT_SERVER } from './utils';

export class IOHandler {
    private static instance: IOHandler;
    private apiHandler: ApiHandler;

    private constructor() {
        // Private constructor for Singleton pattern
        // Construtor privado para o padrão Singleton
        this.apiHandler = ApiHandler.getInstance();
    }

    public static getInstance(): IOHandler {
        if (!IOHandler.instance) {
            IOHandler.instance = new IOHandler();
        }
        return IOHandler.instance;
    }

    public async executeCommand(context: vscode.ExtensionContext, instruction: any): Promise<void> {

        const instructionId: string = instruction.id;
        const operation: string = instruction.operation;
        const args: any[] = instruction.arguments;
        
        // Inform the server about the received instruction
        vscode.window.showInformationMessage(`Setting status to processing for instruction ${instructionId}`);
        await this.apiHandler.put(context, `${DEV_ASSISTANT_SERVER}/api/io/${instructionId}`, { status: 'processing' });
        vscode.commands.executeCommand('workbench.action.files.save');

        let response: any;

        try {
            switch (operation) {
                case 'insertText':
                    response = await this.insertText(args[0], args[1]);
                    break;
                case 'openFile':
                    response = await this.openFile(args[0]);
                    break;
                case 'showDiff':
                    response = await this.showDiff(args[0], args[1]);
                    break;
                case 'deleteText':
                    response = await this.deleteText(args[0]);
                    break;
                case 'saveFile':
                    response = await this.saveFile(args[0]);
                    break;
                default:
                    vscode.window.showWarningMessage(`Unrecognized command: ${operation}`);
                    break;
            }

            // Inform the server about the completed instruction
            await this.apiHandler.put(context, `${DEV_ASSISTANT_SERVER}/api/io/${instructionId}`, { status: 'completed', response: JSON.stringify(response) });
            vscode.window.showInformationMessage(`Instruction completed`);
        } catch (error) {
            // Inform the server about the failed instruction
            await this.apiHandler.put(context, `${DEV_ASSISTANT_SERVER}/api/io/${instructionId}`, { status: 'failed', response: JSON.stringify(error) });
            vscode.window.showErrorMessage(`Instruction failed with error: ${error}`);
        }
    }

    private async insertText(text: string, position?: vscode.Position): Promise<any> {
        const editor = vscode.window.activeTextEditor;
        let response: any;
        if (editor) {
            const insertPosition = position || editor.selection.active;
            await editor.edit(editBuilder => {
                editBuilder.insert(insertPosition, text);
            });
            response = { success: true, message: 'Text inserted successfully' };
        } else {
            response = { success: false, message: 'No active editor' };
        }
        return response;
    }

    private async deleteText(range: vscode.Range): Promise<any> {
        const editor = vscode.window.activeTextEditor;
        let response: any;
        if (editor) {
            await editor.edit(editBuilder => {
                editBuilder.delete(range);
            });
            response = { success: true, message: 'Text deleted successfully' };
        } else {
            response = { success: false, message: 'No active editor' };
        }
        return response;
    }

    private async openFile(filePath: string): Promise<any> {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        return { success: true, message: 'File opened successfully' };
    }

    private async saveFile(filePath: string): Promise<any> {
        const document = await vscode.workspace.openTextDocument(filePath);
        await document.save();
        return { success: true, message: 'File saved successfully' };
    }

    private async showDiff(originalFilePath: string, modifiedFilePath: string): Promise<any> {
        const originalUri = vscode.Uri.file(originalFilePath);
        const modifiedUri = vscode.Uri.file(modifiedFilePath);
        await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri);
        return { success: true, message: 'Diff displayed successfully' };
    }

    // Add more methods as needed
    // Adicione mais métodos conforme necessário
}