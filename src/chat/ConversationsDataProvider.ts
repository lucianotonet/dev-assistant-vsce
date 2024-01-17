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
            // Here you can fetch the messages of the specific conversation, if necessary
            return Promise.resolve(element.children);
        } else {
            try {
                // Fetch the conversations using the ApiHandler
                const conversationsData = await this.apiHandler.fetchConversations();

                if (conversationsData.length > 0) {
                    // Maps the received data to the Conversation model
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