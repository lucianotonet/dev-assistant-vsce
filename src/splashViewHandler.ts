import * as vscode from "vscode";
import { SplashView } from "./webviews/splashView";
import { WelcomeView } from "./webviews/welcomeView";
import { GoodbyeView } from "./webviews/goodbyeView";
import { AuthHandler } from "./authHandler";
import { APP_URL } from "./utils";

export function handleSplashCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('assets/img/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('assets/img/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.splashView', 'Welcome to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    const token = vscode.workspace.getConfiguration('devAssistant').get('authToken');

    panel.webview.html = SplashView.getWebviewContent(panel);
    panel.iconPath = iconPath;

    if (!token || token === '') {
        AuthHandler.getInstance().handleAuthCommand(context);
    }
}

export function handleWelcomeScreenCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('assets/img/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('assets/img/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.welcomeView', 'Welcome to Dev Assistant',
        vscode.ViewColumn.Active, { enableScripts: true }
    );

    const token = vscode.workspace.getConfiguration('devAssistant').get('authToken');

    panel.webview.html = WelcomeView.getWebviewContent(panel);
    panel.iconPath = iconPath;

    if (!token || token === '') {
        AuthHandler.getInstance().handleAuthCommand(context);
    } 
}
export function handleGoodbyeScreenCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('assets/img/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('assets/img/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.goodbyeView', 'Goodbye from Dev Assistant',
        vscode.ViewColumn.Active, { enableScripts: true }
    );

    const token = vscode.workspace.getConfiguration('devAssistant').get('authToken');

    panel.webview.html = GoodbyeView.getWebviewContent(panel);
    panel.iconPath = iconPath;

    if (!token || token === '') {
        AuthHandler.getInstance().handleAuthCommand(context);
    }
}