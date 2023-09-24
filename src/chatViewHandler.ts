import * as vscode from "vscode";
import { getChatWebviewContent } from "./webviews/chatView";

export function handleChatCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('resources/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('resources/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.chatView', 'Dev Assistant Chat',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getChatWebviewContent();
    panel.iconPath = iconPath;
    return panel;
}