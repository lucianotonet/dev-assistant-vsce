import * as vscode from 'vscode';
import { ICommand } from './ICommand';

export class VSCodeCommand implements ICommand {

    private operations: Map<string, (...args: any[]) => Promise<any>>;

    constructor(private operation: string, private args: any) {
        this.operations = new Map<string, (...args: any[]) => Promise<any>>([
            ['display_notification', this.displayNotification],
            // outros mapeamentos
        ]);
    }

    async execute(): Promise<any> {
        const operationFunc = this.operations.get(this.operation);
        if (operationFunc) {
            return operationFunc.apply(this, [this.args]);
        } else {
            return { error: true, message: `Unrecognized VSCode command: ${this.operation}` };
        }
    }

    private async displayNotification(args: { message: string, type: string }): Promise<any> {
        const { message, type } = args;
        if (typeof message !== 'string' || typeof type !== 'string') {
            throw new Error('Invalid argument type for message or type. Arguments need to be { message: string, type: string }');
        }

        switch (type) {
            case 'info':
                vscode.window.showInformationMessage(message);
                break;
            case 'warn':
                vscode.window.showWarningMessage(message);
                break;
            case 'error':
                vscode.window.showErrorMessage(message);
                break;
            default:
                throw new Error(`Unrecognized notification type: ${type}`);
        }

        return { success: true, message: 'Notification displayed successfully' };
    }
}