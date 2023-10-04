import * as vscode from "vscode";
import { handleSplashCommand } from "./splashViewHandler";
import { AuthHandler } from "./authHandler";
import { handleChatCommand } from "./chatViewHandler";

export let extensionContext: vscode.ExtensionContext | undefined = undefined;
let authHandler = AuthHandler.getInstance();

export async function activateExtension(context: vscode.ExtensionContext) {
    extensionContext = context;

    // Register the auth command
    let authClientDisposable = vscode.commands.registerCommand('dev-assistant.auth', () => {
        authHandler.handleAuthCommand(context);
    });

    // Register the deauth command
    let deauthClientDisposable = vscode.commands.registerCommand('dev-assistant.deauth', () => {
        authHandler.handleDeauthCommand(context);
    });
    
    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        handleSplashCommand(context);
    });
    
    // Register the chat command
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        handleChatCommand(context);
    });

    // Register the URI handler
    let uriHandler = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
            if (uri.path === '/auth/success') {
                const token = uri.query.split('=')[1];
                context.globalState.update('devAssistant.authToken', token);
                vscode.window.showInformationMessage('Token salvo com sucesso!');
            }
        }
    });

    extensionContext?.subscriptions.push(authClientDisposable);
    extensionContext?.subscriptions.push(deauthClientDisposable);
    extensionContext?.subscriptions.push(splashDisposable);
    extensionContext?.subscriptions.push(chatDisposable);
    extensionContext?.subscriptions.push(uriHandler);
}