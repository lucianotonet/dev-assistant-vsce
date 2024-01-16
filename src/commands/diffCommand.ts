import * as vscode from 'vscode';
import { ICommand } from './ICommand';

export class DiffCommand implements ICommand {
    constructor(private operation: string, private args: any[]) { }
    async execute(): Promise<any> {
        // Dynamic operation handling
        if (typeof (this as any)[this.operation] === 'function') {
            return (this as any)[this.operation](...this.args);
        } else {
            throw new Error(`Unrecognized diff operation: ${this.operation}`);
        }
    }

    // Possible methods
    private async compareFiles(file1: string, file2: string): Promise<any> {
        const file1Uri = vscode.Uri.file(file1);
        const file2Uri = vscode.Uri.file(file2);
        const file1Content = await vscode.workspace.fs.readFile(file1Uri);
        const file2Content = await vscode.workspace.fs.readFile(file2Uri);
        return { success: true, message: 'Files compared successfully', isEqual: file1Content.toString() === file2Content.toString() };
    }

    private async compareDirectories(dir1: string, dir2: string): Promise<any> {
        const dir1Files = await this.listFilesInDirectory(dir1);
        const dir2Files = await this.listFilesInDirectory(dir2);
        return { success: true, message: 'Directories compared successfully', isEqual: JSON.stringify(dir1Files) === JSON.stringify(dir2Files) };
    }

    private async listFilesInDirectory(directoryPath: string): Promise<any> {
        const uri = vscode.Uri.file(directoryPath);
        const files = await vscode.workspace.fs.readDirectory(uri);
        return files.map(file => file[0]);
    }
}
