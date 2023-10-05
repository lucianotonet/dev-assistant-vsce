import * as vscode from "vscode";
import { TimelineView } from "./webviews/timelineView";
import { WelcomeView } from "./webviews/welcomeView";
import { GoodbyeView } from "./webviews/goodbyeView";
import { AuthHandler } from "./authHandler";
import { APP_URL } from "./utils";

export function timelineViewHandler(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('assets/img/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('assets/img/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.timelineView', 'Welcome to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    const token = vscode.workspace.getConfiguration('devAssistant').get('authToken');

    panel.webview.html = TimelineView.getWebviewContent(panel);
    panel.iconPath = iconPath;

    if (!token || token === '') {
        AuthHandler.getInstance().handleAuthCommand(context);
    }
}