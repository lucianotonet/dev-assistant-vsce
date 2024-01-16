import * as vscode from 'vscode';
import * as Ably from 'ably';
import { ApiHandler } from './ApiHandler';
import axios from 'axios';
import { DEV_ASSISTANT_SERVER, API_URL } from '../utils/Utilities'
import fetch from 'node-fetch';
import { InstructionHandler } from '../io/InstructionHandler';
import { AuthHandler } from '../auth/AuthHandler';


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
        const apiHandler = ApiHandler.getInstance(context);
        const authHandler = AuthHandler.getInstance(context);
        
        const token = await authHandler.getSecret('devAssistant.client.accessToken');
        const clientId = await authHandler.getSecret('devAssistant.client.id');

        if (!token || !clientId) {
            throw new Error('Token or clientId is undefined');
        }

        const response = await apiHandler.get(`${DEV_ASSISTANT_SERVER}/auth/clients/${clientId}/ably`);
        return response.data;
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
        } else {
            vscode.window.showErrorMessage('Failed to get token request.');
            return;
        }
        const authHandler = AuthHandler.getInstance(context);
        const clientId = await authHandler.getSecret('devAssistant.client.id');
        if (this.ablyRealtime) {
            this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${clientId}`);
            if (!this.ablyChannel) {
                vscode.window.showErrorMessage('Failed to initialize private channel.');
                return;
            }
            this.ablyChannel.subscribe(this.handleAblyMessage.bind(this, context));
            vscode.window.showInformationMessage('Dev Assistant is ready!');
        } else {
            vscode.window.showErrorMessage('Ably Realtime is not initialized.');
        }
    }

    private handleAblyMessage(context: vscode.ExtensionContext, message: any): void {
        // Verifica se message.data e message.data.feedback existem antes de tentar acessá-los
        if (message.data && message.data.feedback) {
            vscode.window.showInformationMessage('Dev Assistant: \n' + message.data.feedback);
        }
        const commandOrchestrator = InstructionHandler.getInstance(context);
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
        const authHandler = AuthHandler.getInstance(context);
        const clientId = await authHandler.getSecret('devAssistant.client.id');
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
    private async connectToAbly(context: vscode.ExtensionContext, token: string) {
        const ably = new Ably.Realtime({ token });
        const clientId = AuthHandler.getInstance(context).getClientId();
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
            this.connectToAbly(context, tokenRequest);
        } catch (error) {
            console.error('Failed to initialize Ably:', error);
        }
    }
}