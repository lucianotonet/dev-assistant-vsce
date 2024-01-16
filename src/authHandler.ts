import * as vscode from 'vscode';
import { DEV_ASSISTANT_SERVER } from './utils';
import { ApiHandler } from './ApiHandler';
import axios from 'axios';
const USER_NAME_KEY = 'devAssistant.user.name';
const USER_EMAIL_KEY = 'devAssistant.user.email';
const USER_ID_KEY = 'devAssistant.user.id';
export class AuthHandler {
    private apiHandler
    private clientId: string | undefined; // Adicionado para armazenar o clientId
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): AuthHandler {
        return new AuthHandler(context);
    }

    public getClientId(): string | undefined {
        return this.clientId;
    }

    public async handleAuthCommand(context: vscode.ExtensionContext): Promise<void> {
        const userToken = await this.retrieveToken('devAssistant.user.accessToken');
        const clientToken = await this.retrieveToken('devAssistant.client.accessToken');
        if (userToken && clientToken) {
            await this.fetchAndStoreUserDetails(context);
        } else {
            await this.authenticateExtension(context);
        }
    }

    public async handleDeauthCommand(context: vscode.ExtensionContext): Promise<void> {
        await this.deleteToken('devAssistant.user.accessToken');
        await this.deleteToken('devAssistant.user.refreshToken');
        await this.deleteToken('devAssistant.client.accessToken');
        await this.deleteToken('devAssistant.client.refreshToken');

        await context.secrets.delete('devAssistant');

        vscode.window.showInformationMessage('A extensão foi desconectada do servidor!');
    }

    private async authenticateExtension(context: vscode.ExtensionContext): Promise<void> {
        const appName = vscode.env.appName;
        const appType = 'vsce';
        let url = `${DEV_ASSISTANT_SERVER}/auth/vsce?app_type=${appType}&app_name=${appName}`;

        this.clientId = await this.retrieveToken('devAssistant.client.id');
        if (this.clientId) {
            url += `&client_id=${this.clientId}`;
        }

        vscode.env.openExternal(vscode.Uri.parse(url));
        await this.delay(2000);

        const inputToken = await vscode.window.showInputBox({
            prompt: 'Cole o token aqui',
            password: true,
            ignoreFocusOut: true
        });
        if (inputToken) {
            await this.storeToken('devAssistant.client.accessToken', inputToken);
            vscode.workspace.getConfiguration('devAssistant').update('client.accessToken', inputToken, vscode.ConfigurationTarget.Global);
            await this.fetchAndStoreUserDetails(context);
        }
    }

    private async fetchAndStoreUserDetails(context: vscode.ExtensionContext): Promise<void> {
        const clientToken = await this.retrieveToken('devAssistant.client.accessToken');
        if (!clientToken) {
            await this.authenticateExtension(context);
        }

        let clientAuthResponse: any;
        try {
            clientAuthResponse = await axios.post(`${DEV_ASSISTANT_SERVER}/api/auth/vsce`, {client_id: this.clientId}, {
                'headers': {
                    'Authorization': `Bearer ${clientToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao autenticar a extensão: ${error}`);
        } finally {
            const { access_token, refresh_token, client_id } = clientAuthResponse.data;
            this.clientId = client_id;
            await this.storeToken('devAssistant.client.id', client_id);
            await this.storeToken('devAssistant.user.accessToken', access_token);
            await this.storeToken('devAssistant.user.refreshToken', refresh_token);

            vscode.window.showInformationMessage(`Extenção autenticada com sucesso!`);
        }

        if (!clientAuthResponse) {
            return
        }

        let userAuthResponse: any;
        try {
            userAuthResponse = await this.apiHandler.get(`${DEV_ASSISTANT_SERVER}/api/user`);
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao buscar e armazenar detalhes do usuário: ${error}`);
        } finally {
            const userName = userAuthResponse.data.name;
            const userEmail = userAuthResponse.data.email;
            const userId = userAuthResponse.data.id;
            await context.secrets.store(USER_EMAIL_KEY, userEmail);
            await context.secrets.store(USER_ID_KEY, userId.toString());
            await context.secrets.store(USER_NAME_KEY, userName);

            vscode.window.showInformationMessage(`Bem-vindo ao Dev Assistant, ${userAuthResponse.data.name}!`);
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async storeToken(key: string, token: string): Promise<void> {
        await this.context.secrets.store(key, token);
    }

    public async retrieveToken(key: string): Promise<string | undefined> {
        return this.context.secrets.get(key);
    }

    private async deleteToken(key: string): Promise<void> {
        await this.context.secrets.delete(key);
    }
}
