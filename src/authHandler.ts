import * as vscode from 'vscode';
import { APP_URL, CLIENT_ID } from './utils';
import { ApiHandler } from './apiHandler';

const USER_NAME_KEY = 'devAssistant.user.name';
const USER_EMAIL_KEY = 'devAssistant.user.email';
const USER_ID_KEY = 'devAssistant.user.id';
export class AuthHandler {
    private static instance: AuthHandler = new AuthHandler();
    private apiHandler: ApiHandler;

    private constructor() {
        this.apiHandler = ApiHandler.getInstance();
    }

    public static getInstance(): AuthHandler {
        return AuthHandler.instance;
    }

    public async handleAuthCommand(context: vscode.ExtensionContext): Promise<void> {
        const userToken = await this.retrieveToken(context, 'devAssistant.user.accessToken');
        const clientToken = await this.retrieveToken(context, 'devAssistant.user.clientToken');
        if (clientToken) {
            await this.fetchAndStoreUserDetails(context);
        } else {
            await this.authenticateUser(context);
        }
    }

    public async handleDeauthCommand(context: vscode.ExtensionContext): Promise<void> {
        await this.deleteToken(context, 'devAssistant.user.accessToken');
        await this.deleteToken(context, 'devAssistant.user.refreshToken');
        await this.deleteToken(context, 'devAssistant.client.accessToken');
        
        await context.secrets.delete('devAssistant');

        vscode.window.showInformationMessage('Extensão desconectada com sucesso!');
    }

    private async validateToken(context: vscode.ExtensionContext, token: string): Promise<boolean> {
        try {
            const response = await this.apiHandler.getWithToken(`${APP_URL}/api/user`, token);
            return response.status === 200;
        } catch (error: any) {
            if (error.response?.status === 401) {
                await this.deleteToken(context, 'devAssistant.user.accessToken');
                await this.deleteToken(context, 'devAssistant.user.refreshToken');
                await this.deleteToken(context, 'devAssistant.client.accessToken');
                vscode.window.showInformationMessage('Token inválido, por favor, reautentique.');
            }
            return false;
        }
    }

    private async authenticateUser(context: vscode.ExtensionContext): Promise<void> {
        const url = this.getAuthUrl();
        vscode.env.openExternal(vscode.Uri.parse(url));
        await this.delay(2000);

        const inputToken = await vscode.window.showInputBox({
            prompt: 'Cole o token aqui',
            password: true,
            ignoreFocusOut: true
        });
        if (inputToken) {
            await this.storeToken(context, 'devAssistant.client.accessToken', inputToken);
            await this.fetchAndStoreUserDetails(context);
        }
    }

    private getAuthUrl(): string {
        const appName = vscode.env.appName;
        const appType = 'vsce';
        return `${APP_URL}/auth/vsce?client_id=${CLIENT_ID}&app_type=${appType}&app_name=${appName}`;
    }

    private async fetchAndStoreUserDetails(context: vscode.ExtensionContext): Promise<void> {
        const clientToken = await this.retrieveToken(context, 'devAssistant.client.accessToken');
        if (!clientToken) {
            throw new Error('Token is undefined');
        }

        try {
            const response = await this.apiHandler.postWithToken(`${APP_URL}/api/auth/vsce`, clientToken);
            const { access_token, refresh_token } = response.data;

            await this.storeToken(context, 'devAssistant.user.accessToken', access_token);
            await this.storeToken(context, 'devAssistant.user.refreshToken', refresh_token);

            const userDataResponse = await this.apiHandler.getWithToken(`${APP_URL}/api/user`, access_token);
            const userName = userDataResponse.data.name;
            const userEmail = userDataResponse.data.email;
            const userId = userDataResponse.data.id;
            await context.secrets.store(USER_EMAIL_KEY, userEmail);
            await context.secrets.store(USER_ID_KEY, userId.toString());
            await context.secrets.store(USER_NAME_KEY, userName);

            vscode.window.showInformationMessage(`Bem-vindo ao Dev Assistant, ${userName}!`);
        } catch (error) {
            console.error('Erro ao buscar e armazenar detalhes do usuário:', error);
            vscode.window.showErrorMessage('Erro durante a recuperação dos detalhes do usuário. Por favor, tente novamente.');
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async storeToken(context: vscode.ExtensionContext, key: string, token: string): Promise<void> {
        await context.secrets.store(key, token);
    }

    public async retrieveToken(context: vscode.ExtensionContext, key: string): Promise<string | undefined> {
        return context.secrets.get(key);
    }

    private async deleteToken(context: vscode.ExtensionContext, key: string): Promise<void> {
        await context.secrets.delete(key);
    }
}
