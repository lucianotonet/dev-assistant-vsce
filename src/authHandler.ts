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
        vscode.window.showInformationMessage(loginMessage, 'Generate an API KEY').then((selection) => {
            if (selection) {
                this.redirectedFromLogin = true;
                const editor = vscode.env.appName.toLowerCase();
                const url = `${APP_URL}/auth/clients/${CLIENT_ID}?client_type=${editor}`;
                
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
        
    }

    private static async askForAuthToken(context: vscode.ExtensionContext) {
        const token = await vscode.window.showInputBox({
            prompt: 'Insira o token de autenticação do Dev Assistant',
            password: true
        });

        if (token) {
            await context.globalState.update('devAssistant.authToken', token);
            vscode.window.showInformationMessage('Token salvo com sucesso!');
            this.handleAuthCallback(vscode.Uri.parse(`${API_URL}/auth/clients/success?accessToken=${token}`), context);
        }
    }

    public static handleAuthCallback(uri: vscode.Uri, context: vscode.ExtensionContext) {
        const authToken = uri.query;
        context.globalState.update('devAssistant.authToken', authToken);
        vscode.window.showInformationMessage('Login efetuado com sucesso!');
    }
}