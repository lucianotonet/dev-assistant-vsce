import * as vscode from 'vscode';
import { ICommand } from './ICommand';

export class GitCommand implements ICommand {
    constructor(private operation: string, private args: any[]) { }

    async execute(): Promise<any> {
        // Git command logic here
    }
}