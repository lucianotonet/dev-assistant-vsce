import * as vscode from "vscode";
import { showSplashWebview, showChatWebview } from './webviews';
import { AuthHandler } from './authHandler';

export function registerCommands(context: vscode.ExtensionContext, iconPath: any) {
    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        showSplashWebview(iconPath);
    });

    // Register the chat command
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        showChatWebview(iconPath);
    });

    // Register the login command
    let loginDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        AuthHandler.getInstance().handleLoginCommand(context);
    });

    // Add to context subscriptions
    context.subscriptions.push(splashDisposable, chatDisposable, loginDisposable);
}

