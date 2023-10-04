import * as vscode from 'vscode';
import { APP_URL, API_URL } from '../utils';
const EDITOR = vscode.env.appName.toLowerCase();

export class SplashView {

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
                        font-family: "Consolas", "Liberation Mono", "Courier New", monospace;
                        gap: 20px;
                    }   
                    #logo {
                        display: flex;
                        font-family: "Consolas", "Liberation Mono", "Courier New", monospace;
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
                <div>
                    <!-- Conditional links for login or greeting if already logged in -->
                    <script>
                        const token = localStorage.getItem('token');
                        if (!token) {                            
                            document.write('<a href="${APP_URL}/login?redirect_to=${EDITOR}">Login</a> &nbsp;');
                            document.write('<a href="${APP_URL}/github/login?redirect_to=${EDITOR}">Login with GitHub</a>');
                        } else {
                            fetch('${API_URL}/user', {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token,
                                    'Accept': 'application/json'
                                }
                            })
                            .then(response => 
                                response.json()
                            )
                            .then(data => {
                                document.write('Hello, ' + data.name + ' <a href="/logout">Logout</a>');
                            });
                        }
                    </script>
                </div>                
            </body>
        </html>`;
    }
}