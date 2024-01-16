import * as vscode from 'vscode';
import { ICommand } from './ICommand';

export class EditorCommand implements ICommand {
    
    private operations: Map<string, (...args: any[]) => Promise<any>>;

    constructor(private operation: string, private args: any) {
        this.operations = new Map<string, (...args: any[]) => Promise<any>>([
            ['insertText', this.insertText],
            ['deleteText', this.deleteText],
            // outros mapeamentos
        ]);
    }

    async execute(): Promise<any> {
        const operationFunc = this.operations.get(this.operation);
        if (operationFunc) {
            return operationFunc.apply(this, [this.args]);
        } else {
            return { error: true, message: `Unrecognized editor operation: ${this.operation}` };
        }
    }

    private async insertText(args: { text: string, position?: vscode.Position }): Promise<any> {
        const { text, position } = args;
        if (typeof text !== 'string') {
            throw new Error('Invalid argument type for text. Os argumentos precisam ser { text: string, position?: vscode.Position }');
        }

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const insertPosition = position || editor.selection.active;
            await editor.edit(editBuilder => {
                editBuilder.insert(insertPosition, text);
            });
            return { success: true, message: 'Text inserted successfully' };
        } else {
            return { success: false, message: 'No active editor' };
        }
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

    // Abrir arquivos
    private async openFile(filePath: string): Promise<any> {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        return { success: true, message: 'File opened successfully' };
    }

    // Criar arquivos
    private async createFile(filePath: string): Promise<any> {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, new Uint8Array());
        return { success: true, message: 'File created successfully' };
    }

    // Ler arquivos
    private async readFile(filePath: string): Promise<any> {
        const uri = vscode.Uri.file(filePath);
        const fileData = await vscode.workspace.fs.readFile(uri);
        const fileContent = fileData.toString();
        return { success: true, message: 'File read successfully', content: fileContent };
    }

    // Escrever em arquivos
    private async writeFile(filePath: string, content: string): Promise<any> {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
        return { success: true, message: 'File written successfully' };
    }

    // Salvar arquivos
    // Já implementado como saveFile

    // Renomear arquivos
    private async renameFile(oldFilePath: string, newFilePath: string): Promise<any> {
        const oldUri = vscode.Uri.file(oldFilePath);
        const newUri = vscode.Uri.file(newFilePath);
        await vscode.workspace.fs.rename(oldUri, newUri);
        return { success: true, message: 'File renamed successfully' };
    }

    // Deletar arquivos
    private async deleteFile(filePath: string): Promise<any> {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.delete(uri);
        return { success: true, message: 'File deleted successfully' };
    }

    // Copiar arquivos
    private async copyFile(sourceFilePath: string, destinationFilePath: string): Promise<any> {
        const sourceUri = vscode.Uri.file(sourceFilePath);
        const destinationUri = vscode.Uri.file(destinationFilePath);
        await vscode.workspace.fs.copy(sourceUri, destinationUri);
        return { success: true, message: 'File copied successfully' };
    }

    // Listar arquivos em um diretório
    private async listFilesInDirectory(directoryPath: string): Promise<any> {
        const uri = vscode.Uri.file(directoryPath);
        const files = await vscode.workspace.fs.readDirectory(uri);
        return { success: true, message: 'Files listed successfully', files: files.map(file => file[0]) };
    }

    // Criar diretórios
    private async createDirectory(directoryPath: string): Promise<any> {
        const uri = vscode.Uri.file(directoryPath);
        await vscode.workspace.fs.createDirectory(uri);
        return { success: true, message: 'Directory created successfully' };
    }

    // Renomear diretórios
    // Similar ao renomear arquivos, use renameFile

    // Deletar diretórios
    // Similar ao deletar arquivos, use deleteFile

    // Observar mudanças em arquivos/diretórios
    // Isso geralmente é feito usando vscode.workspace.onDidChangeTextDocument para arquivos
    // e vscode.workspace.onDidChangeWorkspaceFolders para diretórios

    // Comparar o conteúdo de arquivos (diff)
    // Já implementado como showDiff

    // Buscar arquivos/diretórios com padrões específicos (glob patterns)
    private async findFiles(pattern: string): Promise<any> {
        const files = await vscode.workspace.findFiles(pattern);
        return { success: true, message: 'Files found successfully', files: files.map(file => file.fsPath) };
    }

    // Você precisará integrar esses métodos na lógica de execução de comandos existente.
}