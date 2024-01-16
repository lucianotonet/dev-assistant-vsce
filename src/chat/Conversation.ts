import * as vscode from 'vscode';

export class Conversation extends vscode.TreeItem {
    children: Conversation[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly id: string,
    ) {
        super(label, collapsibleState);
        this.children = [];
        this.command = {
            command: 'dev-assistant-ai.openChat',
            title: 'Open Conversation',
            arguments: [this.id]
        };
    }
}