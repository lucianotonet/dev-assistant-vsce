import * as vscode from 'vscode';
import { API_URL } from '../utils/Utilities'; 
import axios from 'axios';
import { AuthHandler } from '../auth/AuthHandler';

export class ApiHandler {
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): ApiHandler {
        return new ApiHandler(context);
    }

    private async constructClientHeaders(): Promise<any> {
        const clientToken = await AuthHandler.getInstance(this.context).getSecret('devAssistant.client.accessToken');
        if (!clientToken) {
            throw new Error('Client Token not found');
        }
        return {
            'authorization': `Bearer ${clientToken}`,
            'contentType': 'application/json',
            'accept': 'application/json'
        };
    }

    private async constructHeaders(): Promise<any> {
        const userToken = await AuthHandler.getInstance(this.context).getSecret('devAssistant.user.accessToken');
        if (!userToken) {
            throw new Error('User Token not found');
        }
        return {
            'authorization': `Bearer ${userToken}`,
            'contentType': 'application/json',
            'accept': 'application/json'
        };
    }

    public async post(url: string, data: any = null) {
        url = this.constructUrl(url);
        return axios.post(url, data, {
            headers: await this.constructHeaders()
        });
    }

    public async get(url: string, params: any = {}) {
        url = this.constructUrl(url);
        return axios.get(url, {
            headers: await this.constructHeaders(),
            params: params
        });
    }

    public async put(url: string, data: any) {
        url = this.constructUrl(url);
        return axios.put(url, data, {
            headers: await this.constructHeaders()
        });
    }

    public async delete(url: string) {
        url = this.constructUrl(url)
        return axios.delete(url, {
            headers: await this.constructHeaders()
        })
    }

    private constructUrl(url: string): string {
        return url.startsWith('http') ? url : `${API_URL}${url}`; // If url doesn't start with http or https, concatenate with API_URL
    }

    public async fetchConversations() {
        let endpoint = `${API_URL}/chat`;
        try {
            const response = await this.get(endpoint);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch conversations');
            return null;
        }
    }

    public async fetchMessages(conversationId: string, parameters: {limit: number|null, after:string|null, before:string|null}) {
        const endpoint = `${API_URL}/chat/${conversationId}`;
        const params = {
            limit: parameters.limit,
            after: parameters.after,
            before: parameters.before
        };
        try {
            const response = await this.get(endpoint, params);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch messages');
            return null;
        }
    }

    public async sendMessage(message: {clientId: string|undefined, conversationId: string|null, content:string, role:string}): Promise<void|null> {
        let endpoint = `${API_URL}/chat/`;
        if (message.conversationId) {
            endpoint += message.conversationId;
        }

        let messages = [
            {
                role: message.role,
                content: message.content
            }
        ]

        try {
            let response;
            if (message.conversationId) {
                response = await this.put(endpoint, {
                    messages: messages,
                    clientId: message.clientId,
                    conversationId: message.conversationId
                });
            } else {
                response = await this.post(endpoint, {
                    messages: messages,
                    clientId: message.clientId,
                    conversationId: message.conversationId 
                });
            }
            return response.data;
            // Handle the API response here, for example, updating the chat view
        } catch (error) {
            vscode.window.showErrorMessage(`Error sending message: ${error}`);
            return null;
        }
    }

    public async deleteMessage(conversationId: string, messageId: string) {
        let endpoint = `${API_URL}/chat/${conversationId}/${messageId}`;
        try {
            const response = await this.delete(endpoint);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage(`Error deleting message: ${error}`);
            return null;
        }
    }

    public async deleteConversation(conversationId: string) {
        let endpoint = `${API_URL}/chat/${conversationId}`;
        try {
            const response = await this.delete(endpoint);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage(`Error deleting conversation: ${error}`);
            return null;
        }
    }

    public async checkThreadRunsStatus(conversationId: string) {
        let endpoint = `${API_URL}/chat/${conversationId}/runs`;
        try {
            const response = await this.get(endpoint);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage(`Error checking thread run status: ${error}`);
            return null;
        }
    }

    public async getSuggestionsFromAI(requestPayload: any) {    
        const payload = JSON.stringify(requestPayload);
        const response = await this.post(`${API_URL}/ai/google/invoke`, payload);
        return [response.data.output.content];
    }
}