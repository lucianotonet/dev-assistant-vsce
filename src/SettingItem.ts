import * as vscode from 'vscode';

export class SettingItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly command?: vscode.Command
    ) {
        super(label);
        this.id = id;
        this.command = command;
    }
}