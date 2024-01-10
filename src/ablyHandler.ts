import * as vscode from 'vscode';
import * as Ably from 'ably';
import { machineIdSync } from 'node-machine-id';
import { ApiHandler } from './apiHandler';
import axios from 'axios';
import { CLIENT_ID, APP_URL, API_URL } from './utils';
import fetch from 'node-fetch';
import { AuthHandler } from './authHandler';

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

    public async getTokenRequest(context: vscode.ExtensionContext): Promise<any> {
        const apiHandler = ApiHandler.getInstance();
        const authHandler = AuthHandler.getInstance();
        
        const token = await authHandler.retrieveToken(context, 'devAssistant.client.accessToken');

        if (token) {
            const response = await apiHandler.getWithToken(`${APP_URL}/auth/clients/${CLIENT_ID}/ably`, token);
            return response.data;
        } else {
            throw new Error('Token is undefined');
        }
    }

    public async init(context: vscode.ExtensionContext): Promise<void> {
        vscode.window.showInformationMessage('Iniciando Ably...');

        const tokenRequest = await this.getTokenRequest(context);
        if (tokenRequest) {
            // Check if keyName is in token_request
            if (!tokenRequest.keyName) {
                vscode.window.showErrorMessage("An error occurred while initializing Ably: 'keyName' not found in token_request");
                return;
            }

            // Request token from Ably
            const tokenUrl = `https://rest.ably.io/keys/${tokenRequest.keyName}/requestToken`;
            const tokenResponse = await axios.post(tokenUrl, tokenRequest);

            // Check if response is not None
            let token;
            if (tokenResponse && tokenResponse.data) {
                token = tokenResponse.data.token;
            }

            // Initialize Ably with the received token
            try {
                if (token) {
                    this.ablyRealtime = new Ably.Realtime({ token });
                } else {
                    this.ablyRealtime = null;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`An error occurred while initializing Ably: ${error}`);
                return;
            }
        }
        this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${CLIENT_ID}`);
        if (!this.ablyChannel) {
            vscode.window.showErrorMessage('Failed to initialize private channel.');
            return;
        }
        this.ablyChannel.subscribe(this.handleAblyMessage);
        vscode.window.showInformationMessage('Dev Assistant is ready and listening for new instructions...');
    }

    private handleAblyMessage(message: any): void {
        vscode.window.showWarningMessage('Dev Assistant message: \n' + message.data);
        
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
        const url = `${API_URL}/auth/clients/${CLIENT_ID}/ably`;
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