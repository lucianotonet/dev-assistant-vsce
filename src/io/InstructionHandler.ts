// src/commandOrchestrator.ts
import * as vscode from 'vscode';
import { ApiHandler } from '../api/ApiHandler';
import { DEV_ASSISTANT_SERVER } from '../utils/Utilities'; 
import { ICommand } from '../commands/ICommand';
import { EditorCommand } from '../commands/editorCommand';
import { DiffCommand } from '../commands/diffCommand';
import { GitCommand } from '../commands/gitCommand';
import { DevAssistantChat } from '../chat/DevAssistantChat';
import { VSCodeCommand } from '../commands/VSCodeCommand';

export class InstructionHandler {
    private static instance: InstructionHandler;
    private apiHandler: ApiHandler;

    private constructor(context: vscode.ExtensionContext) {
        // Private constructor for Singleton pattern
        // Construtor privado para o padrão Singleton
        this.apiHandler = ApiHandler.getInstance(context);
    }

    public static getInstance(context: vscode.ExtensionContext): InstructionHandler {
        if (!InstructionHandler.instance) {
            InstructionHandler.instance = new InstructionHandler(context);
        }
        return InstructionHandler.instance;
    }

    public async executeCommand(context: vscode.ExtensionContext, instruction: any): Promise<void> {

        const instructionId: string = instruction.id;
        const operation: string = instruction.operation;
        const args: any[] = instruction.arguments;
        
        // Inform the server about the received instruction
        // vscode.window.showInformationMessage(`Setting status to processing for instruction ${instructionId}`);
        await this.apiHandler.put(`${DEV_ASSISTANT_SERVER}/api/io/${instructionId}`, { status: 'processing' });
        vscode.commands.executeCommand('workbench.action.files.save');

        let response: any;

        try {
            const command = this.parseCommand(instruction);
            response = await command.execute();
        } catch (error: any) {
            // Inform the server about the failed instruction
            await this.apiHandler.put(`${DEV_ASSISTANT_SERVER}/api/io/${instructionId}`, { status: 'failed', response: {error: `${error}`} });            
            vscode.window.showErrorMessage(`Instruction failed with error: ${error}`);
            return;
        }

        // Inform the server about the instruction RESULT
        await this.apiHandler.put(`${DEV_ASSISTANT_SERVER}/api/io/${instructionId}`, { status: 'completed', response: response });
        vscode.window.showInformationMessage(`Instruction completed`);
    }

    private parseCommand(instruction: any): ICommand {
        const { module, operation, arguments: args } = instruction;
        switch (module) {
            case 'vsce':
                return new VSCodeCommand(operation, args);
            case 'vscode':
                return new VSCodeCommand(operation, args);
            case 'editor':
                return new EditorCommand(operation, args);
            case 'diff':
                return new DiffCommand(operation, args);
            case 'git':
                return new GitCommand(operation, args);            
            default:
                throw new Error(`Unrecognized module: ${module}`);
        }        
    }
}