import * as vscode from "vscode";
import { handleSplashCommand } from "./splashViewHandler";
import { AuthHandler } from "./authHandler";
import { handleChatCommand } from "./chatViewHandler";

export let extensionContext: vscode.ExtensionContext | undefined = undefined;
let loginHandler = AuthHandler.getInstance();

export async function activateExtension(context: vscode.ExtensionContext) {
    extensionContext = context;

    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        handleSplashCommand(context);
    });
    extensionContext?.subscriptions.push(splashDisposable);
}

function registerLoginCommand(iconPath: any) {
    let loginDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        loginHandler.handleLoginCommand(context);
    });
    extensionContext?.subscriptions.push(loginDisposable);
}

    // Register the chat command
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        handleChatCommand(context);
    });

    context.subscriptions.push(splashDisposable);
    context.subscriptions.push(loginDisposable);
    context.subscriptions.push(chatDisposable);
}