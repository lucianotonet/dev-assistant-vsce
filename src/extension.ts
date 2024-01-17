import * as vscode from 'vscode';
import { capture } from './utils/Utilities';
import { AuthHandler } from './auth/AuthHandler';
import { CommandRegistrar } from './commands/CommandRegistrar';
import { ConversationsDataProvider } from './chat/ConversationsDataProvider';

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

    CommandRegistrar.registerAllCommands(context);

    
        
    await vscode.commands.executeCommand('dev-assistant-ai.auth');
    await vscode.commands.executeCommand('dev-assistant-ai.openChat');    
}

