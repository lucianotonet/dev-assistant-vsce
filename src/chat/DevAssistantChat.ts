import * as vscode from 'vscode';
import { getNonce, getWebviewOptions } from '../utils/Utilities';
import { ApiHandler } from '../api/ApiHandler';
import { AuthHandler } from '../auth/AuthHandler';
import { marked } from 'marked'; // Import the marked library for Markdown parsing

export class DevAssistantChat {
    public static instance: DevAssistantChat;
    public static readonly viewType = 'devAssistantChat';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _conversation: {
        id: string | null,
        title: string | null,
        messages:
        {
            id: string | null,
            content: any,
            role: string,
            html: string | null
        }[]
    } = { id: null, title: 'New chat', messages: [] };
    private _intervalId: any;
    private _runs: {
        id: string,
        object: string,
        createdAt: number,
        threadId: string,
        status: string,
        requiredAction: any,
        lastError: any,
        expiresAt: any,
        startedAt: number,
        cancelledAt: any,
        failedAt: any,
        completedAt: number,
        model: string,
        instructions: string,
        tools: any[],
        fileIds: any[],
        metadata: any[]
    }[] = [];
    private _apiType: 'assistant' | 'chat' = 'chat'; // Define a API de chat como padrão

    public static async createOrShow(context: vscode.ExtensionContext, conversationId: string | null) {
        const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : undefined;
        // If the current panel does not exist, create a new one
        if (!DevAssistantChat.instance) {
            const panel = vscode.window.createWebviewPanel(
                DevAssistantChat.viewType,
                'Dev Assistant',
                column || vscode.ViewColumn.One,
                getWebviewOptions(context.extensionUri),
            );

            DevAssistantChat.instance = new DevAssistantChat(context, panel);
        } else {
            // If the current panel exists, reveal it in the same column as before
            DevAssistantChat.instance._panel.reveal(DevAssistantChat.instance._panel.viewColumn);
        }

        if (conversationId) {
            DevAssistantChat.instance.loadConversation(context, conversationId);
        } else {
            // reset 
            DevAssistantChat.instance._conversation.id = null;
            DevAssistantChat.instance._conversation.title = ''
            DevAssistantChat.instance._conversation.messages = [];
        }
    }

    public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, conversationId: string | null) {
        // Restaura o estado salvo, se houver
        const savedConversation = conversationId ? { id: conversationId, title: '', messages: [] } : context.workspaceState.get<{ id: string, title: string, messages: { id: string, content: any, role: string, html: any | null }[] }>('conversation');

        DevAssistantChat.instance = new DevAssistantChat(context, panel);

        if (savedConversation) {
            DevAssistantChat.instance._conversation = savedConversation;
            DevAssistantChat.instance.loadConversation(context, savedConversation.id);
        }

        // Atualiza as mensagens no webview
        if (DevAssistantChat.instance._apiType === 'assistant') {
            DevAssistantChat.instance.startCheckingConversationStatus();
        }
        DevAssistantChat.instance._updateChat();
    }

    public startCheckingConversationStatus() {
        if (this._apiType !== 'assistant') {
            return;
        }

        let i = 0; // Initialize the incrementable i

        const checkStatus = async () => {
            if (this._conversation.id) {
                const runs = await ApiHandler.getInstance(this._context).checkThreadRunsStatus(this._conversation.id);
                this._runs = runs.data;

                const status = this._runs[0].status;

                if (status === 'completed') {
                    this.loadConversation(this._context, this._conversation.id);
                }

                // vscode.window.showInformationMessage(`RUN STATUS CHECK ${i++}: ${status}`);
                this._panel.webview.postMessage({
                    command: 'updateStatus',
                    status: status
                });

                if (status !== 'in_progress' && status !== 'queued') {
                    return;
                }
            }

            // Wait 1 second before checking again
            setTimeout(checkStatus, 1000);
        };

        // Start checking the status
        checkStatus();
    }

    public handleTypingIndicator(typing: boolean) {
        this._panel.webview.postMessage({
            command: 'updateStatus',
            status: typing ? 'typing' : 'completed'
        });
    }

    public constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;

        // Set the icon for the panel title
        this._panel.iconPath = {
            light: vscode.Uri.joinPath(this._extensionUri, 'assets', 'img', 'light-icon.svg'),
            dark: vscode.Uri.joinPath(this._extensionUri, 'assets', 'img', 'dark-icon.svg')
        };

        // Restore the saved state, if any
        // const savedConversation = context.workspaceState.get<{ id: string, messages: { content: string, role: string }[] }>('conversation');

        // if (savedConversation) {
        //     this._conversation = savedConversation;
        //     this.loadConversation(this._context, savedConversation.id);
        // }
        this._context.workspaceState.update('conversation.id', null);
        this._context.workspaceState.update('conversation.messages', []);

        // Set the webview's initial html content
        this._renderChat();

        this._panel.onDidDispose(() => {
            this.dispose();
        }, null, this._disposables);

        this._panel.onDidChangeViewState(
            e => {
                if (e.webviewPanel.visible) {
                    if (this._apiType === 'assistant') {
                        this.startCheckingConversationStatus();
                    }
                    this._updateChat(); // Update the conversation data in the webview
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.content);
                        return;
                    case 'deleteMessage':
                        if (this._conversation.id && message.messageId) {
                            const userConfirmation = await vscode.window.showWarningMessage(
                                'Do you want to delete this message?',
                                'Yes', 'No');
                            var response
                            if (userConfirmation === 'Yes') {

                                this._panel.webview.postMessage({ command: 'updateStatus', status: 'in_progress' });

                                response = await ApiHandler.getInstance(this._context).deleteMessage(this._conversation.id, message.messageId)

                                if (response.success) {
                                    this._conversation.messages = this._conversation.messages.filter(msg => msg.id !== message.messageId);
                                    this._updateChat();
                                    this.loadConversation(this._context, this._conversation.id)
                                }
                                return
                            }
                            this._updateChat();
                        }
                        return;
                    case 'newMessage':
                        const authHandler = AuthHandler.getInstance(this._context);
                        const userToken = await authHandler.getSecret('devAssistant.user.accessToken');

                        if (!userToken) {
                            vscode.window.showErrorMessage('To use Dev Assistant you need to set an API KEY');
                            this._conversation.id = null;
                            this._conversation.messages = [];
                            this._updateChat();
                            authHandler.handleDeauthCommand()
                            return;
                        }

                        let markedContent = await marked(message.content);
                        this._conversation.messages.push({
                            id: null, // to show semitransparent
                            html: markedContent,
                            role: 'user',
                            content: message.content
                        })

                        this._updateChat();
                        let nextConversationId;

                        nextConversationId = await ApiHandler.getInstance(this._context).sendMessage({
                            clientId: await AuthHandler.getInstance(this._context).getClientId(),
                            conversationId: this._conversation.id,
                            content: message.content,
                            role: message.role
                        });
                        
                        if (!nextConversationId) {
                            // Revert removing the placeholder messages and putting the user message on the input value again
                            this._conversation.messages.pop();
                            this._updateChat();

                            this._panel.webview.postMessage({ command: 'inputValue', value: message.content });
                            this._panel.webview.postMessage({ command: 'updateStatus', status: 'completed' });
                            vscode.window.showErrorMessage('Failed to send message. Please try again later.');
                            return;
                        }

                        if (nextConversationId) {
                            this._conversation.id = nextConversationId;

                            this._updateChat();
                            this.loadConversation(this._context, this._conversation.id)
                            if (this._apiType === 'assistant') {
                                this.startCheckingConversationStatus();
                            }

                            vscode.commands.executeCommand('dev-assistant-ai.refreshConversations');
                        } else {
                            this._conversation.id = null;
                            this._conversation.messages = [];
                        }

                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public doAction() {
        // Send a message to the webview webview.
        this._panel.webview.postMessage({ command: 'refactor' });
    }

    // Will load just the new messages if any
    public async loadConversation(context: vscode.ExtensionContext, conversationId: string) {
        if (this._conversation.id !== conversationId) {
            this._conversation.id = null;
            this._conversation.messages = [];
            this._updateChat();
        }

        this._conversation.id = conversationId;
        this._panel.webview.postMessage({
            command: 'updateStatus',
            status: 'in_progress',
        });

        try {
            // Fetch only new messages using the 'after' parameter with the ID of the last message
            const lastMessageId = this._conversation.messages.length > 0 ? this._conversation.messages[this._conversation.messages.length - 1].id : null;
            let conversation = await ApiHandler.getInstance(this._context).fetchMessages(conversationId, {
                limit: null,
                after: lastMessageId,
                before: null
            });
            
            // Fill the title
            this._conversation.title = conversation.title;

            // Remove placeholders
            this._conversation.messages = this._conversation.messages.filter(message => message.id);
            // Add only new messages to the conversation
            let newMessages = conversation.messages

            newMessages.forEach((message: any) => {
                if (!this._conversation.messages.find(m => m.id === message.id)) {
                    this._conversation.messages.push({
                        ...message,
                        // html: marked(message.content[0].text.value)
                        html: marked(message.content ?? "ERRO AQUI!!!"),
                    });
                }
            });

            this._panel.webview.postMessage({
                command: 'updateStatus',
                status: 'completed'
            });
            this._updateChat();
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'updateStatus',
                status: 'failed'
            });
            vscode.window.showErrorMessage(`Error loading messages: ${error}`);
        }
    }

    public async processMessage(payload: any) {
        const { id } = payload;
        
        const existingMessageIndex = this._conversation.messages.findIndex(m => m.id === id);
        const isExistingMessage = existingMessageIndex !== -1;
        const role = payload.chunk?.role || payload.role || 'assistant';
        let messageContent;
        let htmlContent;

        if (payload.chunk) {
            if (isExistingMessage) {
                messageContent = this._conversation.messages[existingMessageIndex]?.content + payload.chunk.delta?.content;
                htmlContent = await marked(messageContent ?? '<br/>');
                this._conversation.messages[existingMessageIndex].content = messageContent;
                this._conversation.messages[existingMessageIndex].html = htmlContent;
            } else {
                // If the message does not exist, we create one
                messageContent = payload.chunk.delta.content;
                htmlContent = await marked(messageContent);
                this._conversation.messages.push({
                    id: id,
                    content: messageContent,
                    role: role,
                    html: htmlContent
                });
            }
        } else {
            messageContent = payload.content;
            htmlContent = await marked(messageContent ?? '<br/>');
            if (isExistingMessage) {
                this._conversation.messages[existingMessageIndex].role = role;
                this._conversation.messages[existingMessageIndex].content = messageContent;
                this._conversation.messages[existingMessageIndex].html = htmlContent;
            } else {
                this._conversation.messages.push({
                    id: id,
                    content: messageContent,
                    role: role,
                    html: htmlContent
                });
            }
        }

        // Send an update to refresh the UI
        this._updateChat();
    }

    public dispose() {
        // Save the current state of the chat
        this._context.workspaceState.update('conversation.id', this._conversation.id);
        this._context.workspaceState.update('conversation.title', this._conversation.title);
        this._context.workspaceState.update('conversation.messages', this._conversation.messages);

        // Clean up our resources
        this._panel.dispose();

        // Clear the setInterval
        clearInterval(this._intervalId);

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _renderChat() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _updateChat() {
        if (!this._panel.webview) {
            return;
        }

        if (!!this._conversation.id) {
            this._panel.webview.postMessage({
                command: 'updateChat',
                conversation: {
                    id: this._conversation.id,
                    title: this._conversation.title,
                    messages: this._conversation.messages,
                }
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {

        // Local path to main script run in the webview
        const highlightJsScriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'highlight.js', 'highlight.min.js');
        // Obtenha a preferência de tema do usuário
        const userThemePreference = vscode.workspace.getConfiguration('workbench').get('colorTheme') as string;
        const theme = userThemePreference.includes('light') ? 'light' : 'dark';

        const highlightJsStylesPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'highlight.js', `atom-one-${theme}.min.css`);

        const highlightJsScriptUri = webview.asWebviewUri(highlightJsScriptPathOnDisk);
        const highlightJsStylesUri = webview.asWebviewUri(highlightJsStylesPathOnDisk);

        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'chat.js');

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'main.css');

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        // Caminho local para o ícone do DevAssistant
        const iconeDevAssistantPath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'img', 'icon.png');

        // E a uri que usamos para carregar este ícone no webview
        const iconeDevAssistantUri = webview.asWebviewUri(iconeDevAssistantPath);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <link href="${stylesResetUri}" rel="stylesheet">
                <link href="${stylesMainUri}" rel="stylesheet">
                
                <!-- Highlight.js CSS -->
                <link href="${highlightJsStylesUri}" rel="stylesheet">                

                <title>Dev Assistant</title>
            </head>
            <body>
                <div id="chatUI">
                    <div id="chatHeading">
                        <div class="container"></div>
                    </div>

                    <ul id="chatBody">
                        <div class="container">
                            <div class="logo">
                                <img src="${iconeDevAssistantUri}" height="34px"/>
                                <span>
                                    <h2>Dev Assistant</h2>
                                    <small>Just another AI dev tool</small>
                                </span>
                            </div>
                        </div>
                    </ul>

                    <form id="chatForm" action="#" method="POST">
                        <div class="container">
                            <div id="chatStatus">
                                <small id="chatStatusLed"></small>
                                <span id="chatStatusFeedback"></span>
                            </div>
                            <input type="text" id="input" placeholder="Type here..." required>                        
                            <button type="submit" id="sendButton">Send</button>
                        </div>
                    </form>
                </div>    

                <!-- Highlight.js -->
                <script nonce="${nonce}" src="${highlightJsScriptUri}"></script>

                <!-- Inicialização do Highlight.js -->
                <script nonce="${nonce}">
                    document.addEventListener('DOMContentLoaded', (event) => {
                        hljs.highlightAll();
                    });
                </script>

                <!-- Chat -->
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

