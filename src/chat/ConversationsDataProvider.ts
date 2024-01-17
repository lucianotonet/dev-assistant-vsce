import * as vscode from 'vscode';
import { Conversation } from '../chat/Conversation';
import { ApiHandler } from '../api/ApiHandler';

export class ConversationsDataProvider implements vscode.TreeDataProvider<Conversation> {
    static refresh(): any {
        throw new Error('Method not implemented.');
    }
    private apiHandler: ApiHandler;
    onDidChangeTreeData: any;

    constructor(private context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
    
        
    }

    refresh(): void {
        this.onDidChangeTreeData.fire();
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