import * as vscode from 'vscode';
import { capture } from './analytics';
import { AuthHandler } from "./authHandler";
import { AblyHandler } from "./ablyHandler";
import { ApiHandler } from './apiHandler';
import path = require('path');

const USER_NAME_KEY = 'devAssistant.user.name';
const USER_EMAIL_KEY = 'devAssistant.user.email';
const USER_ID_KEY = 'devAssistant.user.id';

class ChatDataProvider implements vscode.TreeDataProvider<Conversation> {
    getTreeItem(element: Conversation): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Conversation): Thenable<Conversation[]> {
        if (element) {
            // Return the children of the element here
            return Promise.resolve(element.children);
        } else {
            // Return the root elements here
            return Promise.resolve([
                new Conversation('Conversation 1', vscode.TreeItemCollapsibleState.None, 'id1'),
                new Conversation('Conversation 2', vscode.TreeItemCollapsibleState.None, 'id2'),
                // Add more conversations as needed
            ]);
        }
    }
}

class Conversation extends vscode.TreeItem {
    children: Conversation[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly id: string,
    ) {
        super(label, collapsibleState);
        this.children = [];
        this.command = {
            command: 'dev-assistant-ai.openConversation',
            title: 'Open Conversation',
            arguments: [this.id]
        };
    }
}


class SettingsDataProvider implements vscode.TreeDataProvider<SettingItem> {
    constructor(private context: vscode.ExtensionContext) {}

    getTreeItem(element: SettingItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SettingItem): Promise<SettingItem[]> {
        const token = await this.context.secrets.get('devAssistant.client.accessToken');
        if (token) {
            // Return user details
            return [
                new SettingItem('Nome do Usuário', 'user.name'),
                new SettingItem('E-mail', 'user.email'),
                new SettingItem('ID', 'user.id'),
                new SettingItem('Client ID', 'user.clientId'),
                // Adicione mais detalhes conforme necessário
            ];
        } else {
            // Retorne o botão de login
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

class SettingItem extends vscode.TreeItem {
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

// Function to activate the extension
export async function activate(context: vscode.ExtensionContext) {

    if (!context.globalState.get("hasBeenInstalled")) {
        context.globalState.update("hasBeenInstalled", true);
        // Capture install event
        capture({
            distinctId: AuthHandler.getInstance().getClientId(),
            event: "install",
            properties: {
                platform: process.platform,
                arch: process.arch,
                version: vscode.version,
            },
        });        
        
    }    

    let authDisposable = vscode.commands.registerCommand('dev-assistant-ai.auth', async () => {
        try {
            await AuthHandler.getInstance().handleAuthCommand(context);
        } catch (error) {
            console.error("Failed to handle auth command", error);
            vscode.window.showErrorMessage("Failed to handle auth command");
            return;
        }
        await AblyHandler.getInstance().init(context);
    });

    let callbackDisposable = vscode.commands.registerCommand('dev-assistant-ai.callback', async (uri: vscode.Uri) => {
        vscode.window.showInformationMessage('Callback...');        
    });

    let deauthDisposable = vscode.commands.registerCommand('dev-assistant-ai.deauth', async () => {
        vscode.window.showInformationMessage('Desautenticando...');
        await AuthHandler.getInstance().handleDeauthCommand(context);
    });

    context.subscriptions.push(authDisposable, callbackDisposable, deauthDisposable);

    const chatDataProvider = new ChatDataProvider();
    const settingsDataProvider = new SettingsDataProvider(context);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('dev-assistant-ai.chatView', chatDataProvider));
    context.subscriptions.push(vscode.window.registerTreeDataProvider('dev-assistant-ai.settingsView', settingsDataProvider));
    
    context.subscriptions.push(vscode.commands.registerCommand('dev-assistant-ai.openConversation', async (conversationId: string) => {
        vscode.window.showInformationMessage(`Abrindo conversa ${conversationId}`);
    }));


    // execute 'dev-assistant-ai.auth'
    vscode.commands.executeCommand('dev-assistant-ai.auth');    
}


export async function deactivate(context: vscode.ExtensionContext) {
    
}