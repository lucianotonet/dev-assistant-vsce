import * as vscode from 'vscode';
import { Conversation } from '../chat/Conversation';
import { ApiHandler } from '../api/ApiHandler';

export class ConversationsDataProvider implements vscode.TreeDataProvider<Conversation> {
    private apiHandler: ApiHandler;
    private _onDidChangeTreeData: vscode.EventEmitter<Conversation | undefined> = new vscode.EventEmitter<Conversation | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Conversation | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: Conversation): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: Conversation): Promise<Conversation[]> {
        if (element) {
            // Aqui você pode buscar as mensagens da conversa específica, se necessário
            return Promise.resolve(element.children);
        } else {
            try {
                // Busca as conversas usando o ApiHandler
                const conversationsData = await this.apiHandler.fetchConversations();

                if (conversationsData.length > 0) {
                    // Mapeia os dados recebidos para o modelo Conversation
                    return conversationsData.map((conversation: any) =>
                        new Conversation(
                            conversation.id,
                            vscode.TreeItemCollapsibleState.None,
                            conversation.id
                        )
                    );
                }
            } catch (error: any) {
                if (error.response && error.response.status === 401) {
                    // Se houver um problema de autenticação, retorne uma lista vazia
                    return [];
                }
                vscode.window.showErrorMessage(`Failed to fetch conversations: ${error}`);
            }
            return [];            
        }
    }
}