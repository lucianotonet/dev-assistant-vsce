import * as vscode from 'vscode';
import * as Ably from 'ably';
import { ApiHandler } from './ApiHandler';
import axios from 'axios';
import { DEV_ASSISTANT_SERVER, API_URL } from '../utils/Utilities';
import fetch from 'node-fetch';
import { InstructionHandler } from '../io/InstructionHandler';
import { AuthHandler } from '../auth/AuthHandler';
import { DevAssistantChat } from '../chat/DevAssistantChat';


interface TokenResponse {
    tokenRequest: string;
    // include other expected fields here, if any
}

export class AblyHandler {
    private static instance: AblyHandler;
    private ablyRealtime: any;
    private apiHandler: any;
    private authHandler: any;
    private ablyChannel: any;
    private context: vscode.ExtensionContext;
    private typingIndicator: vscode.StatusBarItem;

    private constructor(context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
        this.authHandler = AuthHandler.getInstance(context);
        this.context = context;
        this.typingIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }

    public static getInstance(context: vscode.ExtensionContext): AblyHandler {
        return AblyHandler.instance ?? new AblyHandler(context);
    }

    public async getTokenRequest(): Promise<any> {
        const token = await this.authHandler.getSecret('devAssistant.client.accessToken');
        const clientId = await this.authHandler.getSecret('devAssistant.client.id');

        if (!token || !clientId) {
            throw new Error('Ably error: Token or clientId is undefined');
        }

        const response = await this.apiHandler.get(`${DEV_ASSISTANT_SERVER}/auth/clients/${clientId}/ably`);
        return response.data;
    }

    public async init(): Promise<void> {
        const tokenRequest = await this.getTokenRequest();
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
        const clientId = await this.authHandler.getSecret('devAssistant.client.id');
        if (this.ablyRealtime) {
            this.ablyChannel = this.ablyRealtime.channels.get(`private:dev-assistant-${clientId}`);
            if (!this.ablyChannel) {
                vscode.window.showErrorMessage('Failed to initialize private channel.');
                return;
            }
            this.ablyChannel.subscribe(this.handleAblyMessage.bind(this, this.context));
            // this.ablyChannel.subscribe(this.handleTypingIndicator.bind(this));
            
            // vscode.window.showInformationMessage('Dev Assistant is ready!');
            
        } else {
            vscode.window.showErrorMessage('Ably Realtime is not initialized.');
        }
    }

    private async handleAblyMessage(context: vscode.ExtensionContext, message: any): Promise<void> {
        // Verifica se message.data e message.data.feedback existem antes de tentar acessá-los
        // if (message.data && message.data.feedback) {
        //     vscode.window.showInformationMessage('Dev Assistant: \n' + message.data.feedback);
        // }        

        this.handleTypingIndicator(message)

        const commandOrchestrator = InstructionHandler.getInstance(context);
        // Envie para o chat
        if (message.data.content || message.data.chunk) {
            this.typingIndicator.hide(); // Hide typing indicator when a message is received
            await DevAssistantChat.instance?.processMessage(message.data);
            return;
        }

        // or

        // execute a command
        if (message.data.module && message.data.operation) {
            const instruction = message.data;
            commandOrchestrator.executeCommand(context, instruction);
        }
    }

    private handleTypingIndicator(message: any): void {
        if (message.data.typing) {
            DevAssistantChat.instance?.handleTypingIndicator(true);
        } else {
            DevAssistantChat.instance?.handleTypingIndicator(false);
        }
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
}