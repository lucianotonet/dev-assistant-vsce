import * as vscode from "vscode";
import { SplashView } from "./webviews/splashView";
import { getChatWebviewContent } from "./webviews/chatView";

export function showSplashWebview(iconPath: any) {
    SplashView.getWebviewContent(iconPath);
}

export function showChatWebview(iconPath: any) {
    const panel = vscode.window.createWebviewPanel( 'dev-assistant.chatView', 'Dev Assistant Chat',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getChatWebviewContent();
    panel.iconPath = iconPath;
}

