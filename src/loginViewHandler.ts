import * as vscode from 'vscode';
import axios from 'axios';
import Ably from 'ably';

export class LoginViewHandler {
    private static instance: LoginViewHandler;
    private ablyRealtime: any;

    private constructor() {}

    public static getInstance(): LoginViewHandler {
        if (!LoginViewHandler.instance) {
            LoginViewHandler.instance = new LoginViewHandler();
        }
        return LoginViewHandler.instance;
    }

    public async getTokenRequest(): Promise<any> {
        try {
            const token = vscode.workspace.getConfiguration('devAssistant').get('token');
            const response = await axios.post('https://devassistant.tonet.dev/api/ably-auth', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to get Ably token request from server.');
            return null;
        }
    }

    public async initAbly(): Promise<void> {
        const tokenRequest = await this.getTokenRequest();
        if (tokenRequest) {
            this.ablyRealtime = new Ably.Realtime({ tokenRequest });
        }
    }

    // ... rest of the code ...
}