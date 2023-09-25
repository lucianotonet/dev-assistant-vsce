import * as vscode from "vscode";
import { SplashView } from "./webviews/splashView";
import { APP_URL } from "./utils";

export function handleSplashCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('assets/img/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('assets/img/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.splashView', 'Welcome to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    const token = vscode.workspace.getConfiguration('devAssistant').get('token');

    panel.webview.html = SplashView.getWebviewContent(panel);
    panel.iconPath = iconPath;

    if (!token || token === '') {
        vscode.window.showInformationMessage(
            'Please login to Dev Assistant.',
            'Login',
            'Login with GitHub'
        ).then((selection) => {
            if (selection) {
                const url = selection === 'Login' ? `${APP_URL}/login` : `${APP_URL}/github/login`;
                vscode.env.openExternal(vscode.Uri.parse(url));
            }
        });
    }
}