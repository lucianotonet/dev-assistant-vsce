import * as vscode from "vscode";
import { getLoginWebviewContent } from "./webviews/loginView";
import { getSplashWebviewContent } from "./webviews/splashView";
import { getChatWebviewContent } from "./webviews/chatView";

export function showSplashWebview(iconPath: any) {
    const panel = vscode.window.createWebviewPanel( 'dev-assistant.splashView', 'Welcome to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getSplashWebviewContent();
    panel.iconPath = iconPath;
}

export function showLoginWebview(iconPath: any) {
    const panel = vscode.window.createWebviewPanel( 'dev-assistant.loginView', 'Login to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getLoginWebviewContent();
    panel.iconPath = iconPath;
}

export function showChatWebview(iconPath: any) {
    const panel = vscode.window.createWebviewPanel( 'dev-assistant.chatView', 'Dev Assistant Chat',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getChatWebviewContent();
    panel.iconPath = iconPath;
}
