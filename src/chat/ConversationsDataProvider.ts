import * as vscode from 'vscode';
import { Conversation } from '../chat/Conversation';
import { ApiHandler } from '../api/ApiHandler';

export class ConversationsDataProvider implements vscode.TreeDataProvider<Conversation> {
    private apiHandler: ApiHandler;
    private _extensionUri
    private _onDidChangeTreeData: vscode.EventEmitter<Conversation | undefined> = new vscode.EventEmitter<Conversation | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Conversation | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
        this._extensionUri = context.extensionUri;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: Conversation): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
        // treeItem.id = element.id;
        treeItem.iconPath = new vscode.ThemeIcon('comment');
        // treeItem.description = "Descrição da conversa"; // Add the conversation description here
        treeItem.tooltip = element.tooltip;
        treeItem.command = element.command;
        treeItem.contextValue = 'conversation'; // Used to show context-specific actions, like delete
        return treeItem;
    }

    async getChildren(element?: Conversation): Promise<Conversation[]> {
        if (element) {
            // Aqui você pode buscar as mensagens da conversa específica, se necessário
            return Promise.resolve(element.children);
        } else {
            try {
                // Busca as conversas usando o ApiHandler
                let conversationsData = await this.apiHandler.fetchConversations();

                if (conversationsData.length > 0) {
                    // Mapeia os dados recebidos para o modelo Conversation
                    return conversationsData.map((conversation: any) =>
                        new Conversation(
                            conversation.title ?? conversation.id,
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