import * as vscode from "vscode";
import { handleSplashCommand } from "./splashViewHandler";
import { handleLoginCommand } from "./loginViewHandler";
import { handleChatCommand } from "./chatViewHandler";

export let extensionContext: vscode.ExtensionContext | undefined = undefined;

export async function activateExtension(context: vscode.ExtensionContext) {
    extensionContext = context;

    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        handleSplashCommand(context);
    });

    // Register the login command
    let loginDisposable = vscode.commands.registerCommand('dev-assistant.login', () => {
        handleLoginCommand(context);
    });

    // Register the chat command
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        handleChatCommand(context);
    });

    context.subscriptions.push(splashDisposable);
    context.subscriptions.push(loginDisposable);
    context.subscriptions.push(chatDisposable);
}