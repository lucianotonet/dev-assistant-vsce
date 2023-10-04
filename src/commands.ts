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
    let authDisposable = vscode.commands.registerCommand('dev-assistant.auth', () => {
        AuthHandler.getInstance().handleAuthCommand(context);
    });

    // Register the logout command
    let deauthDisposable = vscode.commands.registerCommand('dev-assistant.deauth', () => {
        AuthHandler.getInstance().handleAuthCommand(context);
    });

    // Add to context subscriptions
    context.subscriptions.push(splashDisposable, chatDisposable, authDisposable, deauthDisposable);
}

