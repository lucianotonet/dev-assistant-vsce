import * as vscode from 'vscode';
import { getNonce, getWebviewOptions } from '../utils/Utilities';
import { ApiHandler } from '../api/ApiHandler';
import { AuthHandler } from '../auth/AuthHandler';
import { marked } from 'marked'; // Import the marked library for Markdown parsing

export class DevAssistantChat {
    public static currentPanel: DevAssistantChat | undefined;
    public static readonly viewType = 'devAssistantChat';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _context: vscode.ExtensionContext;
    private _conversation: { id: string | null, messages: { content: string, role: string }[] } = { id: null, messages: [] };
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

    public static async createOrShow(context: vscode.ExtensionContext, conversationId: string | null) {
        const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : undefined;
        // Se o painel atual não existir, crie um novo
        if (!DevAssistantChat.currentPanel) {
            const panel = vscode.window.createWebviewPanel(
                DevAssistantChat.viewType,
                'Dev Assistant',
                column || vscode.ViewColumn.One,
                getWebviewOptions(context.extensionUri),                
            );

            DevAssistantChat.currentPanel = new DevAssistantChat(panel, context);
        } else {
            // Se o painel atual existir, revele-o na mesma coluna que estava antes
            DevAssistantChat.currentPanel._panel.reveal(DevAssistantChat.currentPanel._panel.viewColumn);
        }

        if (conversationId) {
            DevAssistantChat.currentPanel.loadConversation(context, conversationId);
        } else {
            // reset 
            DevAssistantChat.currentPanel._conversation.id = null;
            DevAssistantChat.currentPanel._conversation.messages = [];
        }
    }

    public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, conversationId: string | null) {        
        // Restaura o estado salvo, se houver
        const savedConversation = conversationId ? { id: conversationId, messages: [] } : context.workspaceState.get<{ id: string, messages: { content: string, role: string }[] }>('conversation');

        DevAssistantChat.currentPanel = new DevAssistantChat(panel, context);

        if (savedConversation) {
            DevAssistantChat.currentPanel._conversation = savedConversation;
        }

        // Atualiza as mensagens no webview
        DevAssistantChat.currentPanel.startCheckingConversationStatus();
        DevAssistantChat.currentPanel._updateChat();
    }

    public startCheckingConversationStatus() {
        let i = 0; // Inicializa o incrementável i

        const checkStatus = async () => {
            if (this._conversation.id) {
                const runs = await ApiHandler.getInstance(this._context).checkThreadRunsStatus(this._conversation.id);
                this._runs = runs.data;

                const status = this._runs[0].status;
                
                // vscode.window.showInformationMessage(`RUN STATUS CHECK ${i++}: ${status}`);
                this._panel.webview.postMessage({
                    command: 'updateStatus',
                    status: status
                });

                if (status === 'completed') {
                    this.loadConversation(this._context, this._conversation.id);
                    this._updateChat();
                }

                if (status !== 'in_progress' && status !== 'queued') {
                    return;
                }
                
            }

            // Aguarda 1 segundo antes de verificar novamente
            setTimeout(checkStatus, 1000);
        };

        // Inicia a verificação do status
        checkStatus();
    }

    public constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;

        // Define o ícone para o título do painel
        this._panel.iconPath = {
            light: vscode.Uri.joinPath(this._extensionUri, 'assets', 'img', 'light-icon.svg'),
            dark: vscode.Uri.joinPath(this._extensionUri, 'assets', 'img', 'dark-icon.svg')
        };

        // Restaura o estado salvo, se houver
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
                    this.startCheckingConversationStatus();
                    this._updateChat(); // Atualiza os dados da conversa no webview
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
                    case 'newMessage':
                        const authHandler = AuthHandler.getInstance(this._context);
                        const userToken = await authHandler.getSecret('devAssistant.user.accessToken');
                        
                        if (!userToken) {
                            vscode.window.showErrorMessage('To use Dev Assistant you need to set an API KEY');
                            this._conversation.id = null;
                            this._conversation.messages = [];
                            this._updateChat();
                            return;
                        }

                        if (!message.conversation_id) {
                            this._conversation.messages = [];
                        }

                        this._conversation.messages.push({
                            content: message.content,
                            role: message.role
                        });

                        this._updateChat();
                                                
                        const conversationId = await ApiHandler.getInstance(this._context).sendMessage(message);

                        if (conversationId) {                          
                            this._conversation.id = conversationId;
                            this.loadConversation(this._context, conversationId);
                        } else {
                            this._conversation.id = null;
                            this._conversation.messages = [];
                        }
                        
                        this.startCheckingConversationStatus();
                        this._updateChat();

                        vscode.commands.executeCommand('dev-assistant-ai.refreshConversations');                        
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

    public async loadConversation(context: vscode.ExtensionContext, conversationId: string) {                
        try {
            this._panel.webview.postMessage({
                command: 'updateStatus',
                status: 'in_progress',                
            });

            const messages = await ApiHandler.getInstance(this._context).fetchMessages(conversationId);
            this._conversation.id = conversationId;    
            
            this._conversation.messages = messages.map((message: any) => {
                return {
                    ...message,
                    html: marked(message.content[0].text.value)
                };
            });

            this._panel.webview.postMessage({
                command: 'updateStatus',
                status: 'completed'
            });

            this._updateChat();
            
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao carregar mensagens: ${error}`);
        }
    }

    public dispose() {
        // Salva o estado atual do chat
        this._context.workspaceState.update('conversation.id', this._conversation.id);
        this._context.workspaceState.update('conversation.messages', this._conversation.messages);

        DevAssistantChat.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        // Limpa o setInterval
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
                    messages: this._conversation.messages
                },
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
                        <div class="container">
                            <h3 id="chatTitle"></h3>
                            <small id="chatStatus"></small>
                        </div>
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
