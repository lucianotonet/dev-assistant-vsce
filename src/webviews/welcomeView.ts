import * as vscode from 'vscode';
import { APP_URL, API_URL } from '../utils';
const EDITOR = vscode.env.appName.toLowerCase();

export class WelcomeView {

    public static getWebviewContent(panel: vscode.WebviewPanel): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dev Assistant AI</title>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        flex-direction: column;
                        align-items: center;
                        height: 100vh;
                        font-family: "Fira Code", "Consolas", monospace;
                        gap: 20px;
                    }   
                    #logo {
                        display: flex;
                        font-family: "Fira Code", "Consolas", monospace;
                        justify-content: center;
                        align-items: center;                        
                    }  
                    #logo div{
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: start;
                        margin-left: 20px;                        
                    }                 
                    #logo h1 {
                        font-size: 2rem;
                        margin: 0;
                        line-height: 1.1;
                    }
                </style>                
            </head>
            <body>
                
                <div id="logo">
                    <img src="${panel.webview.asWebviewUri(vscode.Uri.file(vscode.extensions.getExtension('lucianotonet.dev-assistant-ai')!.extensionPath + '/assets/img/icon.png'))}" alt="Dev Assistant Icon" width="50" height="50">
                    <div>
                        <h1>Dev Assistant</h1>                 
                        <small>Your new AI development assistant</small>
                    </div>
                </div>                
                <h2>What do you want to do?</h2>
                <div>
                    <a href="${APP_URL}/auth" target="_blank">Authenticate</a>
                    <a href="${APP_URL}/chat" target="_blank">Chat</a>
                    <a href="${APP_URL}/dashboard" target="_blank">Dashboard</a>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const token = vscode.getState().token;
                    if (token) {
                        vscode.postMessage({ command: 'setToken', token: token });
                    }
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'setToken':
                                vscode.setState({ token: message.token });
                                break;
                        }
                    });
                </script>
            </body>
        </html>`;
    }
}