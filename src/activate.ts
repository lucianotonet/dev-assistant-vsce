import * as vscode from "vscode";
import fetch from 'node-fetch';
import { getLoginWebviewContent } from "./webviews/loginView";
import { getSplashWebviewContent } from "./webviews/splashView";

export let extensionContext: vscode.ExtensionContext | undefined = undefined;

export async function activateExtension(context: vscode.ExtensionContext) {
    extensionContext = context;
    let iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('resources/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('resources/dark-icon.png'))
    };

    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        const panel = vscode.window.createWebviewPanel(
            'dev-assistant.splashView',
            'Welcome to Dev Assistant',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getSplashWebviewContent();
        panel.iconPath = iconPath;
    });

    // Register the login command
    let loginDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        const panel = vscode.window.createWebviewPanel(
            'dev-assistant.loginView',
            'Login to Dev Assistant',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = getLoginWebviewContent();
        panel.iconPath = iconPath;
    });

    const chatView = vscode.window.createTreeView('dev-assistant.chatView', {
        treeDataProvider: new ChatDataProvider(),
        showCollapseAll: true
    });
    
    
    // Register the settings command
    let settingsDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        const panel = vscode.window.createWebviewPanel(
            'dev-assistant.loginView',
            'Login to Dev Assistant',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = getLoginWebviewContent();
        panel.iconPath = iconPath;
    });

    const settingsView = vscode.window.createTreeView('dev-assistant.chatView', {
        treeDataProvider: new ChatSettingsDataProvider(),
        showCollapseAll: true
    });
    

    // Register the chat command
    // let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
    //     const panel = vscode.window.createWebviewPanel(
    //         'dev-assistant.chatView', // Identificador do painel. Deve ser único.
    //         'Dev Assistant Chat', // Título do painel exibido para o usuário.
    //         vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    //         {
    //             // Habilita scripts no painel webview
    //             enableScripts: true,

    //             // E aqui estão algumas opções de retenção de estado disponíveis.
    //             retainContextWhenHidden: true,
    //         }
    //     );

    //     panel.webview.html = getChatWebviewContent();
    //     panel.iconPath = iconPath;


    //     panel.webview.onDidReceiveMessage(
    //         message => {
    //             switch (message.command) {
    //                 case 'alert':
    //                     vscode.window.showErrorMessage(message.text);
    //                     break;
    //             }
    //         }
    //     );
    // });
    
    context.subscriptions.push(chatView);
    // context.subscriptions.push(chatDisposable);
    context.subscriptions.push(settingsDisposable);
    context.subscriptions.push(splashDisposable);
    context.subscriptions.push(loginDisposable);
}

class ChatDataProvider implements vscode.TreeDataProvider<string> {
    getTreeItem(element: string): vscode.TreeItem {
        return {
            label: element,
            collapsibleState: vscode.TreeItemCollapsibleState.None
        };
    }

    getChildren(element?: string): Thenable<string[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(['Chat Item 1', 'Chat Item 2']);
        }
    }
}

class ChatSettingsDataProvider implements vscode.TreeDataProvider<string> {
    getTreeItem(element: string): vscode.TreeItem {
        return {
            label: element,
            collapsibleState: vscode.TreeItemCollapsibleState.None
        };
    }

    getChildren(element?: string): Thenable<string[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve([
                'Chat Settings Item 1', 
                'Chat Settings Item 2'
            ]);
        }
    }
}