import * as vscode from 'vscode';
import * as Ably from 'ably';
import { machineIdSync } from 'node-machine-id';
import { ApiHandler } from './apiHandler';
import axios from 'axios';
import { API_URL } from './utils';
   

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

    public async getTokenRequest(deviceId: string): Promise<any> {
        const response = await axios.post(`${API_URL}/ably/token-request?device_id=${deviceId}`);
        return response.data;
    }

    public async initAbly(): Promise<void> {
        const deviceId = machineIdSync();
        const tokenRequest = await this.getTokenRequest(deviceId);
        this.ablyRealtime = new Ably.Realtime({ token: tokenRequest });
        if (!this.ablyRealtime) {
            vscode.window.showErrorMessage('Failed to initialize Ably.');
            return;
        }
        this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-vsce-${deviceId}`);
        if (!this.ablyChannel) {
            vscode.window.showErrorMessage('Failed to initialize private channel.');
            return;
        }
        this.ablyChannel.subscribe(this.handleAblyMessage);
    }

    private handleAblyMessage(message: any): void {
        vscode.window.showInformationMessage('Received Ably message: \n' + message.data);
        console.log('Received Ably message:', message.data);
    }
}