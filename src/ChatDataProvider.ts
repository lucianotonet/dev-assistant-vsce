import * as vscode from 'vscode';
import { ChatItem } from './ChatItem';

export class ChatDataProvider implements vscode.TreeDataProvider<ChatItem> {
    constructor(private context: vscode.ExtensionContext) { }

    getTreeItem(element: ChatItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ChatItem): Thenable<ChatItem[]> {
        if (element) {
            return Promise.resolve(element.children);
        } else {
            return Promise.resolve([
                new ChatItem('Chat 1', vscode.TreeItemCollapsibleState.None, 'id1'),
                new ChatItem('Chat 2', vscode.TreeItemCollapsibleState.None, 'id2'),
                new ChatItem('Chat 3', vscode.TreeItemCollapsibleState.None, 'id3'),
                new ChatItem('Chat 4', vscode.TreeItemCollapsibleState.None, 'id4'),
            ]);
        }
    }
}