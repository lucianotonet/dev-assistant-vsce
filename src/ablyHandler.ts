import * as vscode from 'vscode';
import * as Ably from 'ably';
import { machineIdSync } from 'node-machine-id';
import { ApiHandler } from './apiHandler';
import axios from 'axios';
import { CLIENT_ID, APP_URL, API_URL } from './utils';
import fetch from 'node-fetch';

interface TokenResponse {
    tokenRequest: string;
    // include other expected fields here, if any
}

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
        const response = await axios.get(`${API_URL}/auth/${deviceId}/ably`);
        return response.data;
    }

    public async initAbly(): Promise<void> {
        const deviceId = machineIdSync();
        const tokenRequest = await this.getTokenRequest(deviceId);
        this.ablyRealtime = new Ably.Realtime({ token: tokenRequest.token });
        if (!this.ablyRealtime) {
            vscode.window.showErrorMessage('Failed to initialize Ably.');
            return;
        }
        this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${deviceId}`);
        if (!this.ablyChannel) {
            vscode.window.showErrorMessage('Failed to initialize private channel.');
            return;
        }
        this.ablyChannel.subscribe(this.handleAblyMessage);
    }

    private handleAblyMessage(message: any): void {
        // Logging the received message (keep this for debugging)
        console.log('Received Ably message:', message.data);

        // Example: Insert text into the open file
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const position = editor.selection.active; // Get the cursor position
            editor.edit(editBuilder => {
                editBuilder.insert(position, message.data); // Insert the message text at the cursor position
            });
        } else {
            // Example: Display notification
            vscode.window.showInformationMessage('Received Ably message: \n' + message.data);
        }
    }

   
    // 1. Get the TOKEN REQUEST
    private async getAblyTokenRequest(): Promise<string> {
        const url = `${API_URL}/auth/${CLIENT_ID}/ably`;
        try {
            const response = await fetch(url);
            const data = await (response.json() as Promise<TokenResponse>);
            return data.tokenRequest;
        } catch (error) {
            console.error('Failed to get Ably token request:', error);
            throw error;
        }
    }

    // 2. Connect to Ably
    private async connectToAbly(token: string) {
        const ably = new Ably.Realtime({ token });
        const channelName = `private:dev-assistant-${CLIENT_ID}`;
        const channel = ably.channels.get(channelName);

        channel.subscribe((message) => {
            this.handleMessage(message);
        });
    }

    // 3. Handle Messages
    private handleMessage(message: any) {
        console.log('Received message:', message);
        // TODO: Add logic to handle the message and display it on the timeline
    }

    // Example of use
    private async initializeAbly() {
        try {
            const tokenRequest = await this.getAblyTokenRequest();
            this.connectToAbly(tokenRequest);
        } catch (error) {
            console.error('Failed to initialize Ably:', error);
        }
    }
}