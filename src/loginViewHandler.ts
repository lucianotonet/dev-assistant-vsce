import * as vscode from "vscode";
import { getLoginWebviewContent } from "./webviews/loginView";

export function handleLoginCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('resources/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('resources/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.loginView', 'Login to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getLoginWebviewContent();
    panel.iconPath = iconPath;

    // Exibindo mensagem solicitando login
    const loginMessage = 'Por favor, faça login para continuar.';
    const loginOptions = ['Login', 'Login com GitHub'];
    vscode.window.showInformationMessage(loginMessage, ...loginOptions).then(selection => {
        if (selection) {
            vscode.env.openExternal(vscode.Uri.parse('https://devassistant.tonet.dev'));
        }
    });
}