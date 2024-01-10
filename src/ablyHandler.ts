import * as vscode from 'vscode';
import * as Ably from 'ably';
import { machineIdSync } from 'node-machine-id';
import { ApiHandler } from './apiHandler';
import axios from 'axios';
import { DEV_ASSISTANT_SERVER, API_URL } from './utils';
import fetch from 'node-fetch';
import { AuthHandler } from './authHandler';
import { IOHandler } from './IOHandler';


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
        const clientId = await authHandler.retrieveToken(context, 'devAssistant.client.id');

        if (!token || !clientId) {
            throw new Error('Token or clientId is undefined');
        }

        if (token) {
            const response = await apiHandler.getWithToken(`${DEV_ASSISTANT_SERVER}/auth/clients/${clientId}/ably`, token);
            return response.data;
        } else {
            throw new Error('Token is undefined');
        }
    }

    public async init(context: vscode.ExtensionContext): Promise<void> {
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
        const authHandler = AuthHandler.getInstance();
        const clientId = await authHandler.retrieveToken(context, 'devAssistant.client.id');
        this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${clientId}`);
        if (!this.ablyChannel) {
            vscode.window.showErrorMessage('Failed to initialize private channel.');
            return;
        }
        this.ablyChannel.subscribe(this.handleAblyMessage.bind(this, context));
        vscode.window.showInformationMessage('Dev Assistant is ready!');
    }

    private handleAblyMessage(context: vscode.ExtensionContext, message: any): void {
        vscode.window.showInformationMessage('Dev Assistant: \n' + message.data.feedback);
        const commandOrchestrator = IOHandler.getInstance();
        const instruction = message.data;
        commandOrchestrator.executeCommand(context, instruction);
    }

    public async sendInstruction(instruction: string): Promise<void> {
        if (this.ablyChannel) {
            this.ablyChannel.publish({ data: instruction });
        } else {
            vscode.window.showErrorMessage('Ably channel is not initialized.');
        }
    }
   
    // 1. Get the TOKEN REQUEST
    private async getAblyTokenRequest(context: vscode.ExtensionContext): Promise<string> {
        const authHandler = AuthHandler.getInstance();
        const clientId = await authHandler.retrieveToken(context, 'devAssistant.client.id');
        const url = `${API_URL}/auth/clients/${clientId}/ably`;
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
        const clientId = AuthHandler.getInstance().getClientId();
        const channelName = `private:dev-assistant-${clientId}`;
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
    private async initializeAbly(context: vscode.ExtensionContext) {
        try {
            const tokenRequest = await this.getAblyTokenRequest(context);
            this.connectToAbly(tokenRequest);
        } catch (error) {
            console.error('Failed to initialize Ably:', error);
        }
    }
}