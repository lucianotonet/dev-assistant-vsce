import * as vscode from 'vscode';
import { getNonce, getWebviewOptions } from '../utils/Utilities';

const cats = {
    'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    'Black Cat': 'https://i.giphy.com/tGw1AekOKUSWncbAqd.webp',
    'Pokerface Cat': 'https://i.giphy.com/SrAO8XBZ7mPSWzpERP.webp',
    'Sad Cat': 'https://i.giphy.com/71PLYtZUiPRg4.webp'
};

export class Chat {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: Chat | undefined;

    public static readonly viewType = 'devAssistant';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _messages: { content: string, role: string }[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (Chat.currentPanel) {
            Chat.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            Chat.viewType,
            'Dev Assistant',
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri),
        );

        Chat.currentPanel = new Chat(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        Chat.currentPanel = new Chat(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.content);
                        return;
                    case 'newMessage':
                        this._messages.push(message); // Update the messages list when a new message is received
                        vscode.window.showInformationMessage(message.content)
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public doAction() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }

    public dispose() {
        Chat.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;

        // Vary the webview's content based on where it is located in the editor.
        switch (this._panel.viewColumn) {
            case vscode.ViewColumn.Two:
                this._panel.title = 'Black Cat'
                this._panel.webview.html = this._getHtmlForWebview(webview, cats['Black Cat']);
                return;

            case vscode.ViewColumn.Three:
                this._panel.title = 'Sad Cat'
                this._panel.webview.html = this._getHtmlForWebview(webview, cats['Sad Cat']);
                return;

            case vscode.ViewColumn.One:
                this._panel.title = 'Coding Cat'
                this._panel.webview.html = this._getHtmlForWebview(webview, cats['Coding Cat']);
                return;

            default:
                this._panel.title = 'Pokerface Cat'
                this._panel.webview.html = this._getHtmlForWebview(webview, cats['Pokerface Cat']);
                return;
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, catGifPath: string) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'main.js');

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

        // Generate the chat messages HTML
        const chatMessagesHtml = this._messages.map(message => `<li><strong>${message.role}: </strong> ${message.content}</li>`).join('');

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

				<title>Dev Assistant</title>
                
                <script nonce="${nonce}" src="${scriptUri}"></script>
			</head>
			<body>
                <div class="">
                    <img src="${catGifPath}" width="100%" />
                    <h1 id="lines-of-code-counter">0</h1>
                    
                    <div id="chat">
                        ${chatMessagesHtml}
                    </div>

                    <div id="chatForm">
                        <input type="text" id="input" placeholder="Type here..." required>                        
                        <button type="submit" value="Send" onClick="sendMessage()">Enviar</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const oldState = vscode.getState();
                    const counter = document.getElementById('lines-of-code-counter');

                    console.log('Estado inicial', oldState);

                    let currentCount = (oldState && oldState.count) || 0;
                    counter.textContent = currentCount;

                    setInterval(() => {
                        counter.textContent = currentCount++;

                        // Atualiza o estado
                        vscode.setState({ count: currentCount });

                        // Alerta a extensão quando o gato introduz um bug
                        if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
                            // Envia uma mensagem de volta para a extensão
                            vscode.postMessage({
                                command: 'alert',
                                text: '🐛  na linha ' + currentCount
                            });
                        }
                    }, 100);

                    // Trata as mensagens enviadas da extensão para o webview
                    window.addEventListener('message', event => {
                        const message = event.data; // Os dados json que a extensão enviou
                        switch (message.command) {
                            case 'refactor':
                                currentCount = Math.ceil(currentCount * 0.5);
                                counter.textContent = currentCount;
                                break;
                        }
                    });

                    
                    
                    const chat = document.getElementById('chat');
                    console.log('Estado inicial', oldState);

                    let currentMessages = (oldState && oldState.messages) || [];
                    chat.innerHTML = currentMessages.join('<br>');

                    // Trata as mensagens enviadas da extensão para o webview
                    window.addEventListener('message', event => {
                        const message = event.data; // Os dados json que a extensão enviou
                        switch (message.command) {
                            case 'newMessage':
                                const newMessage = message.text;
                                currentMessages.push(newMessage);
                                chat.innerHTML = currentMessages.join('<br>');

                                // Atualiza o estado
                                vscode.setState({ messages: currentMessages });
                                break;
                            case 'clear':
                                currentMessages = [];
                                chat.innerHTML = '';
                                break;
                        }
                    });
                </script>
			</body>
			</html>`;
    }
}

