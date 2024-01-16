import * as vscode from 'vscode';
import { capture } from './analytics';
import { AuthHandler } from './AuthHandler';
import { registerCommands } from './commands';
import { ChatDataProvider } from './ChatDataProvider';
import { ConversationsDataProvider } from './ConversationsDataProvider';
import { SettingsDataProvider } from './SettingsDataProvider';
import { ChatWebviewProvider } from './ChatWebViewProvider';
import { ConversationsWebviewProvider } from './ConversationsWebviewProvider';
import { SettingsWebviewViewProvider } from './SettingsWebviewViewProvider';

export async function activate(context: vscode.ExtensionContext) {

    if (!context.globalState.get("hasBeenInstalled")) {
        context.globalState.update("hasBeenInstalled", true);
        capture({
            distinctId: AuthHandler.getInstance(context).getClientId(),
            event: "install",
            properties: {
                platform: process.platform,
                arch: process.arch,
                version: vscode.version,
            },
        });
    }

    registerCommands(context);

    const chatDataProvider = new ChatDataProvider(context);
    const chatWebviewProvider = new ChatWebviewProvider();    

    const conversationsDataProvider = new ConversationsDataProvider(context);
    const conversationsWebviewProvider = new ConversationsWebviewProvider();

    const settingsDataProvider = new SettingsDataProvider(context);
    const settingsWebviewProvider = new SettingsWebviewViewProvider();
    
    context.subscriptions.push(vscode.window.registerTreeDataProvider('dev-assistant-ai.chat', chatDataProvider));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('dev-assistant-ai.chat', chatWebviewProvider));

    context.subscriptions.push(vscode.window.registerTreeDataProvider('dev-assistant-ai.conversations', conversationsDataProvider));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('dev-assistant-ai.conversations', settingsWebviewProvider));
        
    context.subscriptions.push(vscode.window.registerTreeDataProvider('dev-assistant-ai.settings', settingsDataProvider));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('dev-assistant-ai.settings', conversationsWebviewProvider));
        
    vscode.commands.executeCommand('dev-assistant-ai.auth').then(() => {
        const authHandler = AuthHandler.getInstance(context);
        if (authHandler.getClientId()) {
            vscode.commands.executeCommand('dev-assistant-ai.openChat');
        }
    });
}