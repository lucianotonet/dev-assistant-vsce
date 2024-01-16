import * as vscode from 'vscode';
import { Conversation } from './Conversation';
import { ApiHandler } from './ApiHandler';

export class ConversationsDataProvider implements vscode.TreeDataProvider<Conversation> {
    private apiHandler: ApiHandler;

    constructor(private context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
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
                    // Mapeia os dados recebidos para o modelo de Conversation
                    return conversationsData.map((conversation: any) =>
                        new Conversation(
                            conversation.id,
                            vscode.TreeItemCollapsibleState.None,
                            conversation.id
                        )
                    );
                }
                return [];
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to fetch conversations: ${error}`);
                return [];
            }
        }
    }
}