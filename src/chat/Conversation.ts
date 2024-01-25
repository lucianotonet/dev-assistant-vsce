import * as vscode from 'vscode';

export class Conversation extends vscode.TreeItem {
    children: Conversation[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly id: string,
        public readonly iconPath?: { light: string; dark: string },
        public readonly description?: string,
        public readonly tooltip?: string
    ) {
        super(label, collapsibleState);
        this.children = [];
        this.iconPath = iconPath;
        this.description = description;
        this.tooltip = tooltip;
        this.command = {
            command: 'dev-assistant-ai.openChat',
            title: 'Open Conversation',
            arguments: [this.id]
        };
    }
}