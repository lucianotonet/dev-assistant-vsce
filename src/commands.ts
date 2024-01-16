import * as vscode from 'vscode';
import { AuthHandler } from './AuthHandler';
import { AblyHandler } from './AblyHandler';
import { AIInlineCompletionItemProvider } from './AIInlineCompletionItemProvider';
import { ApiHandler } from './ApiHandler';

export function registerCommands(context: vscode.ExtensionContext) {
    let authDisposable = vscode.commands.registerCommand('dev-assistant-ai.auth', async () => {
        try {
            await AuthHandler.getInstance(context).handleAuthCommand(context);
        } catch (error) {
            console.error("Failed to handle auth command", error);
            vscode.window.showErrorMessage("Failed to handle auth command");
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
    
    let chatDisposable = vscode.commands.registerCommand('dev-assistant-ai.openChat', async (conversationId: string) => {
        vscode.window.showInformationMessage('Abrindo chat...');
        
        // Verifica se o chatPanel foi disposed e o recria se necessário
        if(!chatPanel || !chatPanel.webview) {
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
        }, null, context.subscriptions);

        chatPanel.webview.html = `<html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                <h1>Dev Assistant Chat</h1>
            `;

        if (conversationId) {
            chatPanel.title = `Dev Assistant Chat # ${conversationId}`;
            chatPanel.webview.html += `
                <ul>
                    <li>Mensagem 1</li>
                    <li>Mensagem 2</li>
                    <li>Mensagem 3</li>
                </ul>
            `;
        }

        chatPanel.webview.html += `
            <form onsubmit="submitForm()">
                <input type="text" id="input" placeholder="Digite aqui...">
                <input type="submit" value="Enviar">
            </form>

            <script>
                const vscode = acquireVsCodeApi();
                function submitForm() {
                    const input = document.getElementById('input');
                    vscode.postMessage({
                        command: 'submit',
                        text: input.value
                    });
                    input.value = '';
                    event.preventDefault();
                }
            </script>
            </body>
        </html>`;

        chatPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'submit':
                        const userInput = message.text;
                        vscode.window.showInformationMessage(`Enviando mensagem: ${userInput}`);
                        // Fazendo um post request para a API
                        try {
                            let response: any;
                            if (conversationId)
                                response = await apiHandler.put(`/chat/${conversationId}`, { content: userInput, role: 'user' });
                            else 
                                response = await apiHandler.post(`/chat`, { content: userInput, role: 'user' });                            
                            
                            // Atualizando o ID da conversa com o valor retornado pela API
                            conversationId = response.data.conversation_id;
                            
                            vscode.window.showInformationMessage(`Recebendo retorno: ${response.data.content}`);
                        } catch (error) {
                            vscode.window.showErrorMessage(`Falha ao enviar a mensagem: ${error}`);
                        }
                        break;
                    default:
                        vscode.window.showInformationMessage(`Comando desconhecido: ${message.command}`);
                }
                vscode.commands.executeCommand('dev-assistant-ai.openChat', conversationId);
            },
            undefined,
            context.subscriptions
        );        
    });   

    context.subscriptions.push(authDisposable, callbackDisposable, deauthDisposable);
    context.subscriptions.push(ghostCompletionDisposable, chatDisposable);
}