import * as vscode from "vscode";
import { getLoginWebviewContent } from "./webviews/loginView";

const APP_URL = process.env.NODE_ENV === 'production' ? 'https://devassistant.tonet.dev' : 'https://dev-assistant-server.test';

export function handleLoginCommand(context: vscode.ExtensionContext) {
    displayLoginPanel(context);
    displayLoginMessage();
}

function displayLoginPanel(context: vscode.ExtensionContext) {
    const iconPath = {
        light: vscode.Uri.file(context.asAbsolutePath('resources/light-icon.png')),
        dark: vscode.Uri.file(context.asAbsolutePath('resources/dark-icon.png'))
    };

    const panel = vscode.window.createWebviewPanel('dev-assistant.loginView', 'Login to Dev Assistant',
        vscode.ViewColumn.Beside, { enableScripts: true }
    );

    panel.webview.html = getLoginWebviewContent();
    panel.iconPath = iconPath;

    panel.webview.onDidReceiveMessage(message => {
        if (message.type === 'token') {
            context.globalState.update('token', message.value);
        }
    });
}

function displayLoginMessage() {
    const loginMessage = 'Please login to continue.';
    const loginOptions = ['Login', 'Login with GitHub'];
    vscode.window.showInformationMessage(loginMessage, ...loginOptions).then(selection => {
        if (selection) {
            const loginUrl = selection === 'Login with GitHub' ? '/github/login' : '/login';
            vscode.env.openExternal(vscode.Uri.parse(APP_URL + loginUrl));
        }
    });
}

export function isAuthenticated(context: vscode.ExtensionContext): boolean {
    const token = context.globalState.get('token');
    return !!token;
}

export function ensureAuthenticated(context: vscode.ExtensionContext): void {
    if (!isAuthenticated(context)) {
        vscode.window.showInformationMessage('Please login to continue.', 'Login').then(selection => {
            if (selection === 'Login') {
                handleLoginCommand(context);
            }
        });
    }
}

export function authenticateRequest(request: any, context: vscode.ExtensionContext): any {
    const token = context.globalState.get('token');
    if (token) {
        request.headers = {
            ...request.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return request;
}