import * as vscode from 'vscode';
import { AuthHandler } from '../auth/AuthHandler';
import { AIInlineCompletionItemProvider } from '../completion/AIInlineCompletionItemProvider';
import { ApiHandler } from '../api/ApiHandler';
import { AblyHandler } from '../api/AblyHandler';
import { Chat } from '../chat/Chat';
import { ConversationsDataProvider } from '../chat/ConversationsDataProvider';

export class CommandRegistrar {
    public static registerAllCommands(context: vscode.ExtensionContext) {
        let authDisposable = vscode.commands.registerCommand('dev-assistant-ai.auth', async () => {
            try {
                await AuthHandler.getInstance(context).askForToken(context);
            } catch (error) {
                console.error("Failed to handle auth command", error);
                vscode.window.showErrorMessage(`Failed to handle auth command: ${error}`);
                return;
            }
            await AblyHandler.getInstance().init(context);
        });

        let callbackDisposable = vscode.commands.registerCommand('dev-assistant-ai.callback', async (uri: vscode.Uri) => {
            vscode.window.showInformationMessage('Callback...');
        });

        let deauthDisposable = vscode.commands.registerCommand('dev-assistant-ai.deauth', async () => {
            vscode.window.showInformationMessage('Desautenticando...');
            await AuthHandler.getInstance(context).handleDeauthCommand(context);
        });

        let ghostCompletionDisposable = vscode.commands.registerCommand('dev-assistant-ai.triggerGhostCompletion', async () => {
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
        });


        /**
         * CHAT
         */

        let chatPanel: vscode.WebviewPanel | undefined;
        let apiHandler = ApiHandler.getInstance(context);
        let messages: any

        let chatDisposable = vscode.commands.registerCommand('dev-assistant-ai.openChat', async (conversationId: string) => {
            vscode.window.showInformationMessage('Abrindo chat...');

            // Verifica se o chatPanel foi disposed e o recria se necessário
            if (!chatPanel || !chatPanel.webview) {
                chatPanel = vscode.window.createWebviewPanel(
                    'dev-assistant-ai.chat',
                    'Dev Assistant Chat',
                    vscode.ViewColumn.Nine,
                    {
                        enableScripts: true
                    }
                );
            }

            // Ouvinte para quando o painel é descartado
            chatPanel.onDidDispose(() => {
                chatPanel = undefined;
                messages = undefined
            }, null, context.subscriptions);

            let template = `<html>
            <head>
                <style>
                    body, * {
                        font-family: monospace, serif;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                 <h1>Dev Assistant Chat # ${conversationId ?? ''}</h1>
            `;


            if (conversationId) {
                chatPanel.title = `Dev Assistant Chat # ${conversationId}`;
                template += `
                    <ul>
                        <li><strong>Dev Assistant: </strong> Como posso ajudá-lo hoje?</li>
                        <li><strong>User: </strong> Como posso você poderia me ajudar hoje?</li>
                        <li><strong>Dev Assistant: </strong> Como posso ajudá-lo hoje?</li>
                        <li><strong>User: </strong> Como posso você poderia me ajudar hoje?</li>
                        <li><strong>Dev Assistant: </strong> Como posso ajudá-lo hoje?</li>
                        <li><strong>User: </strong> Como posso você poderia me ajudar hoje?</li>
                        <li><strong>Dev Assistant: </strong> Como posso ajudá-lo hoje?</li>
                        <li><strong>User: </strong> Como posso você poderia me ajudar hoje?</li>
                    </ul>
                `;
            }

            template += `
            <form id="chatForm">
                <input type="text" id="input" placeholder="Digite aqui...">
                <input type="submit" value="Enviar">
            </form>

            <script>
                const vscode = acquireVsCodeApi();
                const oldState = vscode.getState();
                const form = document.getElementById('chatForm');
                const input = document.getElementById('input');

                if (oldState) {
                    input.value = oldState;
                }

                form.addEventListener('submit', function(event) {
                    vscode.postMessage({
                        command: 'submit',
                        text: input.value
                    });
                    vscode.setState(input.value);
                    input.value = '';
                    event.preventDefault();
                });
            </script>
            </body>
        </html>`;

            chatPanel.webview.html = template

            chatPanel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'submit':
                            const userInput = message.text;
                            // vscode.window.showInformationMessage(`Enviando mensagem: ${userInput}`);
                            // Fazendo um post request para a API
                            try {
                                let response: any;
                                if (conversationId)
                                    response = await apiHandler.put(`/chat/${conversationId}`, { content: userInput, role: 'user' });
                                else
                                    response = await apiHandler.post(`/chat`, { content: userInput, role: 'user' });

                                const newConversationId = response.data.conversation_id;
                                if (newConversationId != conversationId)
                                    chatPanel?.dispose()
                                vscode.commands.executeCommand('dev-assistant-ai.openChat', newConversationId);

                                vscode.window.showInformationMessage(`Mensagem do Dev Assistant: ${response.data.content}`);
                            } catch (error) {
                                vscode.window.showErrorMessage(`Falha ao enviar a mensagem: ${error}`);
                            }
                            break;
                        default:
                            vscode.window.showInformationMessage(`Comando desconhecido: ${message.command}`);
                    }

                },
                undefined,
                context.subscriptions
            );
        });

        context.subscriptions.push(authDisposable, callbackDisposable, deauthDisposable);
        context.subscriptions.push(ghostCompletionDisposable, chatDisposable);


        context.subscriptions.push(
            vscode.commands.registerCommand('dev-assistant-ai.start', () => {
                Chat.createOrShow(context.extensionUri);
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('dev-assistant-ai.doAction', () => {
                if (Chat.currentPanel) {
                    Chat.currentPanel.doAction();
                }
            })
        );

        if (vscode.window.registerWebviewPanelSerializer) {
            // Make sure we register a serializer in activation event
            vscode.window.registerWebviewPanelSerializer(Chat.viewType, {
                async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                    console.log(`Got state: ${state}`);
                    // Reset the webview options so we use latest uri for `localResourceRoots`.
                    webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                    Chat.revive(webviewPanel, context.extensionUri);
                }
            });
        }

        const conversationsDataProvider = new ConversationsDataProvider(context);
        context.subscriptions.push(vscode.window.registerTreeDataProvider('dev-assistant-ai.conversations', conversationsDataProvider));
    }
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    throw new Error('Function not implemented.');
}
