import * as vscode from 'vscode';
import { SettingItem } from './SettingItem';

export class SettingsDataProvider implements vscode.TreeDataProvider<SettingItem> {
    constructor(private context: vscode.ExtensionContext) { }

    getTreeItem(element: SettingItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SettingItem): Promise<SettingItem[]> {
        const token = await this.context.secrets.get('devAssistant.client.accessToken');
        if (token) {
            return [
                new SettingItem('Nome do Usuário', 'user.name'),
                new SettingItem('E-mail', 'user.email'),
                new SettingItem('ID', 'user.id'),
                new SettingItem('Client ID', 'user.clientId'),
            ];
        } else {
            return Promise.resolve([
                new SettingItem('Login', 'login', {
                    command: 'dev-assistant-ai.auth',
                    title: 'Login',
                    arguments: []
                })
            ]);
        }
    }
}
