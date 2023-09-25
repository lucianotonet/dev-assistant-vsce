import * as vscode from 'vscode';
import axios from 'axios';
import * as Ably from 'ably';
import { machineIdSync } from 'node-machine-id';
import { API_URL } from './utils';

export class LoginViewHandler {
    private static instance: LoginViewHandler;
    private ablyRealtime: any;
    private ablyChannel: any;

    public static getInstance(): LoginViewHandler {
        if (!LoginViewHandler.instance) {
            LoginViewHandler.instance = new LoginViewHandler();
        }
        return LoginViewHandler.instance;
    }

    public async getTokenRequest(): Promise<any> {
        try {
            const token = vscode.workspace.getConfiguration('devAssistant').get('token');
            if (!token) {
                vscode.window.showErrorMessage('Please login to DevAssistant first.');
                return null;
            }
            const response = await axios.post(`${API_URL}/ably-auth`, {}, {
                headers: {
                    'authorization': `Bearer ${token}`
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
            this.ablyRealtime = new Ably.Realtime(tokenRequest);
            this.ablyRealtime.connection.once('connected', () => {
                const deviceId = machineIdSync();
                this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${deviceId}`);
                this.ablyChannel.subscribe((message: any) => {
                    this.handleAblyMessage(message);
                });
            });
        }
    }

    private handleAblyMessage(message: any): void {
        console.log('Received message from Ably:', message);
    }

    public handleLoginCommand(context: vscode.ExtensionContext) {
        this.initAbly();
    }
}