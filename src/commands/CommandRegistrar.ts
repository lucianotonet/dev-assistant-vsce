import * as vscode from 'vscode';
import { AuthHandler } from '../auth/AuthHandler';
import { AIInlineCompletionItemProvider } from '../completion/AIInlineCompletionItemProvider';
import { AblyHandler } from '../api/AblyHandler';
import { ConversationsDataProvider } from '../chat/ConversationsDataProvider';
import { DevAssistantChat } from '../chat/DevAssistantChat';
import { getWebviewOptions } from '../utils/Utilities';
import { ApiHandler } from '../api/ApiHandler';

export class CommandRegistrar {
    public static registerAllCommands(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('dev-assistant-ai.auth', async () => {
                try {
                    await AuthHandler.getInstance(context).askForToken(context);
                } catch (error) {
                    console.error("Failed to handle auth command", error);
                    vscode.window.showErrorMessage(`Failed to handle auth command: ${error}`);
                    return;
                }
                await AblyHandler.getInstance().init(context);
            }),
            vscode.commands.registerCommand('dev-assistant-ai.callback', async (uri: vscode.Uri) => {
                vscode.window.showInformationMessage('Callback...');
            }),
            vscode.commands.registerCommand('dev-assistant-ai.deauth', async () => {
                vscode.window.showInformationMessage('Desautenticando...');
                await AuthHandler.getInstance(context).handleDeauthCommand(context);
            }),
            vscode.commands.registerCommand('dev-assistant-ai.triggerGhostCompletion', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const provider = new AIInlineCompletionItemProvider(context);
                    const inlineCompletionContext: vscode.InlineCompletionContext = {
                        triggerKind: vscode.InlineCompletionTriggerKind.Invoke,
                        selectedCompletionInfo: undefined
                    };

                    const items = await provider.provideInlineCompletionItems(
                        editor.document,
                        editor.selection.active,
                        inlineCompletionContext,
                        new vscode.CancellationTokenSource().token
                    );
                    if (items) {
                        vscode.window.showInformationMessage('Ghost completion aplicada.');
                    } else {
                        vscode.window.showInformationMessage('Nenhuma ghost completion disponível.');
                    }
                } else {
                    vscode.window.showInformationMessage('Nenhum editor ativo.');
                }
            })
        );

        const conversationsDataProvider = new ConversationsDataProvider(context);
        vscode.window.registerTreeDataProvider('dev-assistant-ai.conversations', conversationsDataProvider);

        context.subscriptions.push(
            vscode.commands.registerCommand('dev-assistant-ai.openChat', async (conversationId: string) => {                
                await DevAssistantChat.createOrShow(context, conversationId);                
            }),
            vscode.commands.registerCommand('dev-assistant-ai.doAction', () => {
                if (DevAssistantChat.currentPanel) {
                    DevAssistantChat.currentPanel.doAction();
                }
            }),
            vscode.commands.registerCommand('dev-assistant-ai.refreshConversations', () => {
                conversationsDataProvider.refresh();
            })
        );

        // Extensions that support reviving should have an "onWebviewPanel:viewType" activation event and make sure that registerWebviewPanelSerializer is called during activation.
        // Only a single serializer may be registered at a time for a given viewType.
        // if (vscode.window.registerWebviewPanelSerializer) {
        //     // Make sure we register a serializer in activation event
        //     vscode.window.registerWebviewPanelSerializer(DevAssistantChat.viewType, {
        //         async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        //             console.log(`Dev Assistant AI got state: ${state}`);
        //             // Reset the webview options so we use latest uri for `localResourceRoots`.
        //             webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        //             // Use the conversationId from the state
        //             const conversationId = state.conversation.id;                    
        //             DevAssistantChat.revive(webviewPanel, context, conversationId);
        //         }
        //     });
        // }
    }
}