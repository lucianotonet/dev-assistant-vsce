import * as vscode from 'vscode';
import { APP_URL, API_URL, CLIENT_ID } from './utils';
import axios from 'axios';

export class AuthHandler {
    private static instance: AuthHandler;
    private redirectedFromLogin: boolean = false;

    public static getInstance(): AuthHandler {
        if (!AuthHandler.instance) {
            AuthHandler.instance = new AuthHandler();
        }
        return AuthHandler.instance;
    }

    public handleAuthCommand(context: vscode.ExtensionContext, loginMessage: string = 'We need an API KEY to connect VSCode to Dev Assistant.') {
        vscode.window.showInformationMessage(loginMessage, 'Generate API KEY').then((selection) => {
            if (selection) {
                this.redirectedFromLogin = true;
                const editor = vscode.env.appName.toLowerCase();
                const url = `${APP_URL}/auth/${CLIENT_ID}?client_type=${editor}`;
                
                const uri = vscode.Uri.parse(url);
                vscode.env.openExternal(uri);
            }
            vscode.window.onDidChangeWindowState(event => {
                if (event.focused && this.redirectedFromLogin) {
                    AuthHandler.askForAuthToken(context);
                    this.redirectedFromLogin = false;
                }
            });
        });
    }

    public handleDeauthCommand(context: vscode.ExtensionContext) {
        const token = context.globalState.get('devAssistant.authToken');
        if (token) {
            axios.post(`${APP_URL}/auth/deauthenticate`, {}, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(() => {
                    context.globalState.update('devAssistant.authToken', null);
                    vscode.window.showInformationMessage('Extension is now deauthenticated!');
                })
                .catch((error) => {
                    vscode.window.showErrorMessage(`Error on authenticate extension: ${error}`);
                });
        } else {
            vscode.window.showInformationMessage('Extension is not authenticated!');
        }
    }

    private static async askForAuthToken(context: vscode.ExtensionContext) {
        const token = await vscode.window.showInputBox({
            prompt: 'Insira o token de autenticação do Dev Assistant',
            password: true
        });

        if (token) {
            await context.globalState.update('devAssistant.authToken', token);
            vscode.window.showInformationMessage('Token salvo com sucesso!');
            this.handleAuthCallback(vscode.Uri.parse(`${API_URL}/auth/success?${token}`), context);
        }
    }

    public static handleAuthCallback(uri: vscode.Uri, context: vscode.ExtensionContext) {
        const authToken = uri.query;
        context.globalState.update('devAssistant.authToken', authToken);
        vscode.window.showInformationMessage('Login efetuado com sucesso!');
    }
}