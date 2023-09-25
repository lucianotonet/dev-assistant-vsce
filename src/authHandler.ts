import * as vscode from 'vscode';
import { APP_URL, API_URL } from './utils';

export class AuthHandler {
    private static instance: AuthHandler;

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
            if (selection === 'Login') {
                vscode.env.openExternal(vscode.Uri.parse(`${APP_URL}/login`));
                this.handleTokenInput();
            } else if (selection === 'Login with GitHub') {
                vscode.env.openExternal(vscode.Uri.parse(`${APP_URL}/github/login`));
                this.handleTokenInput();
            }
        });
    }

    public handleTokenInput() {
        vscode.window.showInputBox({ prompt: 'Enter your token' }).then((token) => {
            if (token) {
                vscode.workspace.getConfiguration('devAssistant').update('token', token, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('Token saved successfully.');
            }
        });
    }
}