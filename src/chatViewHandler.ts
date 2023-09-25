import * as vscode from "vscode";
import { getChatWebviewContent } from "./webviews/chatView";
import { AuthHandler } from './authHandler';

export function handleChatCommand(context: vscode.ExtensionContext) {
    const token = vscode.workspace.getConfiguration('devAssistant').get('token');
    if (!token) {
        AuthHandler.getInstance().handleLoginCommand(context);
        return;
    }

    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('assets/img/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('assets/img/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.chatView', 'Dev Assistant Chat',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getChatWebviewContent();
    panel.iconPath = iconPath;
    return panel;
}