import * as vscode from "vscode";
import { showSplashWebview, showLoginWebview, showChatWebview } from './webviews';

export function registerCommands(context: vscode.ExtensionContext, iconPath: any) {
    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        showSplashWebview(iconPath);
    });

    // Register the login command
    let loginDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        showLoginWebview(iconPath);
    });

    // Register the chat command
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        showChatWebview(iconPath);
    });

    // Add to context subscriptions
    context.subscriptions.push(splashDisposable, loginDisposable, chatDisposable);
}
