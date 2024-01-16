import * as vscode from 'vscode';
import { API_URL } from './utils';
import axios from 'axios';
import { AuthHandler } from './AuthHandler';

export class ApiHandler {
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): ApiHandler {
        return new ApiHandler(context);
    }

    private async constructHeaders(): Promise<any> {
        const clientToken = await AuthHandler.getInstance(this.context).retrieveToken('devAssistant.user.accessToken');
        if (!clientToken) {
            throw new Error('Token not found');
        }
        return {
            'Authorization': `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    public async post(url: string, data: any = null) {
        url = this.constructUrl(url);
        return axios.post(url, data, {
            headers: await this.constructHeaders()
        });
    }

    public async get(url: string) {
        url = this.constructUrl(url);
        return axios.get(url, {
            headers: await this.constructHeaders()
        });
    }

    public async put(url: string, data: any) {
        url = this.constructUrl(url);
        return axios.put(url, data, {
            headers: await this.constructHeaders()
        });
    }

    private constructUrl(url: string): string {
        return url.startsWith('http') ? url : `${API_URL}${url}`; // If url doesn't start with http or https, concatenate with API_URL
    }

    public async fetchConversations(conversationId?: string) {
        let endpoint = `${API_URL}/chat/`;
        if (conversationId) {
            endpoint += conversationId;
        }
        try {
            const response = await this.get(endpoint);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch conversations');
            return null;
        }
    }

    public async fetchMessages(conversationId: string) {
        const endpoint = `${API_URL}/chat/${conversationId}`;
        try {
            const response = await this.get(endpoint);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch messages');
            return null;
        }
    }

    public async getSuggestionsFromAI(requestPayload: any) {    
        const payload = JSON.stringify(requestPayload);
        const response = await this.post(`${API_URL}/ai/google/invoke`, payload);
        return [response.data.output.content];
    }
}