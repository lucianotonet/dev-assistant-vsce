import * as vscode from 'vscode'
import { getNonce, getWebviewOptions } from '../utils/Utilities';

export class DevAssistantChat {
    public static currentPanel: DevAssistantChat | undefined;
    public static readonly viewType = 'devAssistantChat'

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _conversationId: string | undefined = undefined;
    private _messages: { content: string, role: string }[] = [];
    private _messageInterval: NodeJS.Timeout | undefined = undefined;

    public static createOrShow(extensionUri: vscode.Uri, conversationId: string | undefined) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (DevAssistantChat.currentPanel) {
            DevAssistantChat.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            DevAssistantChat.viewType,
            'Dev Assistant',
            column || vscode.ViewColumn.Nine,
            getWebviewOptions(extensionUri),
        );

        DevAssistantChat.currentPanel = new DevAssistantChat(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        DevAssistantChat.currentPanel = new DevAssistantChat(panel, extensionUri);
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
                        vscode.window.showInformationMessage(`User message: ${message.content}`) // Debug notification with the user's message
                        this._updateMessages(); // Update only the messages part of the DOM
                        return;
                }
            },
            null,
            this._disposables
        );

        // Simulate assistant messages every 2 seconds
        this._messageInterval = setInterval(() => {
            this._messages.push({ content: 'Simulated assistant message ad fashg as adfasdgfa srhadasxg adtgh.', role: 'assistant' });
            this._updateMessages(); // Update only the messages part of the DOM
        }, 1000);
    }

    public doAction() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }

    public dispose() {
        DevAssistantChat.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }

        // Clear the message simulation interval
        if (this._messageInterval) {
            clearInterval(this._messageInterval);
        }
    }

    private _update() {
        const webview = this._panel.webview;        
        this._panel.webview.html = this._getHtmlForWebview(webview);
        return
    }

    private _updateMessages() {
        // Send a message to the webview with the updated messages
        // The webview script will handle updating the DOM
        // This approach avoids resetting the entire HTML content and preserves the input focus
        this._panel.webview.postMessage({ command: 'updateMessages', messages: this._messages });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
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
			</head>
			<body>
                <div class="">
                    <div class="container">
                        <h2>Chat #123</h2>
                    </div>

                    <ul id="chat"></ul>

                    <form id="chatForm">
                        <div class="container">
                            <input type="text" id="input" placeholder="Type here..." required>                        
                            <button type="submit">Send</button>
                        </div>
                    </form>
                </div>    
                <script nonce="${nonce}" src="${scriptUri}"></script>
                <script nonce="${nonce}">
                    <!-- insert script here -->
                </script>
			</body>
			</html>`;
    }
}
