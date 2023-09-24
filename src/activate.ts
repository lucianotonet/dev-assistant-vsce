import * as vscode from "vscode";
import axios from 'axios';
import { getLoginWebviewContent } from "./webviews/loginView";
import { getSplashWebviewContent } from "./webviews/splashView";
import { getChatWebviewContent } from "./webviews/chatView";

export let extensionContext: vscode.ExtensionContext | undefined = undefined;

export async function activateExtension(context: vscode.ExtensionContext) {
    extensionContext = context;
    let iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('resources/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('resources/dark-icon.png'))
    };

    registerSplashCommand(iconPath);
    registerLoginCommand(iconPath);
    registerChatCommand(iconPath);
}

function registerSplashCommand(iconPath: any) {
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        const panel = vscode.window.createWebviewPanel('dev-assistant.splashView', 'Welcome to Dev Assistant', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = getSplashWebviewContent();
        panel.iconPath = iconPath;
    });
    extensionContext?.subscriptions.push(splashDisposable);
}

function registerLoginCommand(iconPath: any) {
    let loginDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        const panel = vscode.window.createWebviewPanel('dev-assistant.loginView', 'Login to Dev Assistant', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = getLoginWebviewContent();
        panel.iconPath = iconPath;
    });
    extensionContext?.subscriptions.push(loginDisposable);
}

function registerChatCommand(iconPath: any) {
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        const panel = vscode.window.createWebviewPanel('dev-assistant.chatView', 'Dev Assistant Chat', vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = getChatWebviewContent();
        panel.iconPath = iconPath;
        handleChatMessages(panel);
    });
    extensionContext?.subscriptions.push(chatDisposable);
}

function handleChatMessages(panel: vscode.WebviewPanel) {
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    break;
                case 'chat':
                    vscode.window.showInformationMessage(message.text);
                    break;
            }
        }
    );
}