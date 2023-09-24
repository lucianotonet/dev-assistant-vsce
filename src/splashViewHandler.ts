import * as vscode from "vscode";
import { getSplashWebviewContent } from "./webviews/splashView";

export function handleSplashCommand(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('resources/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('resources/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.splashView', 'Welcome to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getSplashWebviewContent();
    panel.iconPath = iconPath;
}