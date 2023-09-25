import * as vscode from 'vscode';
import * as Ably from 'ably';
import { machineIdSync } from 'node-machine-id';
import { APP_URL, API_URL } from './utils';
import { ApiHandler } from './apiHandler';

export class AblyHandler {
    private static instance: AblyHandler;
    private ablyRealtime: any;
    private ablyChannel: any;

    public static getInstance(): AblyHandler {
        if (!AblyHandler.instance) {
            AblyHandler.instance = new AblyHandler();
        }
        return AblyHandler.instance;
    }

    public async initAbly(): Promise<void> {
        const deviceId = machineIdSync();
        const tokenRequest = await ApiHandler.getTokenRequest(deviceId);
        this.ablyRealtime = new Ably.Realtime({ token: tokenRequest });
        if (!this.ablyRealtime) {
            vscode.window.showErrorMessage('Failed to connect to Ably.');
            return;
        }
        this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${deviceId}`);
        if (!this.ablyChannel) {
            vscode.window.showErrorMessage('Failed to connect to private channel.');
            return;
        }
        this.ablyChannel.subscribe(this.handleAblyMessage);
    }

    private handleAblyMessage(message: any): void {
        vscode.window.showInformationMessage('Received Ably message: \n' + message.data);
        console.log('Received Ably message:', message.data);
    }
}