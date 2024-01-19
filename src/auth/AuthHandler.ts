import * as vscode from 'vscode';
import { DEV_ASSISTANT_SERVER } from '../utils/Utilities';
import { ApiHandler } from '../api/ApiHandler'
import axios from 'axios';

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

    public async handleDeauthCommand(context: vscode.ExtensionContext): Promise<void> {
        await this.deleteSecret('devAssistant.user.accessToken');
        await this.deleteSecret('devAssistant.user.refreshToken');
        await this.deleteSecret('devAssistant.client.accessToken');
        await this.deleteSecret('devAssistant.client.refreshToken');

        vscode.window.showInformationMessage('A extensão foi desconectada do servidor!');
    }

    public async askForToken(context: vscode.ExtensionContext): Promise<void> {
        let userToken = await this.getSecret('devAssistant.user.accessToken');

        if (userToken) {
            await this.authenticateClient(context);
            return
        }

        const appName = vscode.env.appName;
        const appType = 'vsce';
        let url = `${DEV_ASSISTANT_SERVER}/auth/user/token?app_type=${appType}&app_name=${appName}`;

        this.clientId = await this.getSecret('devAssistant.client.id');
        if (this.clientId) {
            url += `&client_id=${this.clientId}`;
        }

        vscode.env.openExternal(vscode.Uri.parse(url));
        await this.delay(2000);

        // Pega o token do usuário
        let newUserToken = await vscode.window.showInputBox({
            prompt: 'Cole o token aqui',
            password: true,
            ignoreFocusOut: true
        });

        if (newUserToken) {
            await this.storeSecret('devAssistant.user.accessToken', newUserToken);
            await this.authenticateClient(context);
        }
        else {
            vscode.window.showErrorMessage('Token inválido!');
        }

    }

    private async authenticateClient(context: vscode.ExtensionContext): Promise<void> {
        let clientAuthResponse: any;        
        try {
            const userToken = await this.getSecret('devAssistant.user.accessToken');
            clientAuthResponse = await axios.post(`${DEV_ASSISTANT_SERVER}/api/auth/clients`, { client_id: this.clientId }, {
                'headers': {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        } catch (error: any) {
            await this.deleteSecret('devAssistant.user.accessToken');
            await this.deleteSecret('devAssistant.client.accessToken');
            vscode.window.showErrorMessage(`Erro ao autenticar a extensão: ${error}`);
            return;
        }

        this.clientId = clientAuthResponse.data.clientId;
        await this.storeSecret('devAssistant.client.id', clientAuthResponse.data.clientId);
        await this.storeSecret('devAssistant.client.accessToken', clientAuthResponse.data.accessToken);
        await this.storeSecret('devAssistant.client.refreshToken', clientAuthResponse.data.refreshToken);

        vscode.window.showInformationMessage(`Extenção autenticada com sucesso!`);

        this.fetchUser(context)
    }

    private async fetchUser(context: vscode.ExtensionContext): Promise<void> {
        let userAuthResponse: any;
        try {
            userAuthResponse = await this.apiHandler.get(`${DEV_ASSISTANT_SERVER}/api/user`);
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao buscar dados do usuário: ${error}`);
            return;
        }

        await context.secrets.store('devAssistant.user.name', userAuthResponse.data.name);
        await context.secrets.store('devAssistant.user.email', userAuthResponse.data.email);
        await context.secrets.store('devAssistant.user.id', userAuthResponse.data.id.toString());

        vscode.window.showInformationMessage(`Bem-vindo ao Dev Assistant, ${userAuthResponse.data.name}!`);
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async storeSecret(key: string, token: string): Promise<void> {
        await this.context.secrets.store(key, token);
    }

    public async getSecret(key: string): Promise<string | undefined> {
        return this.context.secrets.get(key);
    }

    private async deleteSecret(key: string): Promise<void> {
        await this.context.secrets.delete(key);
    }
}
