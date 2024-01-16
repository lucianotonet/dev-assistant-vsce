import * as vscode from 'vscode';
import { ChatDataProvider } from './ChatDataProvider';

export class ChatItem extends vscode.TreeItem {
    children: ChatItem[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly id: string,
    ) {
        super(label, collapsibleState);
        this.children = [];
        this.command = {
            command: 'dev-assistant-ai.openChat',
            title: 'Open Chat',
            arguments: [this.id]
        };
    }
}