import * as vscode from 'vscode';
import { APP_URL, API_URL } from './utils';

export class AuthHandler {
    private static instance: AuthHandler;
    private redirectedFromLogin: boolean = false;

    public static getInstance(): AuthHandler {
        if (!AuthHandler.instance) {
            AuthHandler.instance = new AuthHandler();
        }
        return AuthHandler.instance;
    }

    public handleLoginCommand(context: vscode.ExtensionContext) {
        vscode.window.showInformationMessage(
            'Please login to Dev Assistant.',
            'Login',
            'Login with GitHub'
        ).then((selection) => {
            if (selection) {
                this.redirectedFromLogin = true;
                const url = selection === 'Login' ? `${APP_URL}/login` : `${APP_URL}/github/login`;
                vscode.env.openExternal(vscode.Uri.parse(url));
            }
            vscode.window.onDidChangeWindowState(event => {
                if (event.focused && this.redirectedFromLogin) {
                    AuthHandler.askForAuthToken();
                    this.redirectedFromLogin = false;
                }
            });
        });
    }

    private static async askForAuthToken() {
        const token = await vscode.window.showInputBox({
            prompt: 'Insira o token de autenticação do Dev Assistant',
            password: true
        });

        if (token) {
            await vscode.workspace.getConfiguration().update('devAssistant.authToken', token, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Token salvo com sucesso!');
        }
    }
}