import * as vscode from 'vscode';
import { API_URL } from './utils';
import axios from 'axios';
import { AuthHandler } from './authHandler';

export class ApiHandler {
    private static instance: ApiHandler;

    public static getInstance(): ApiHandler {
        if (!ApiHandler.instance) {
            ApiHandler.instance = new ApiHandler();
        }
        return ApiHandler.instance;
    }

    public async post(context: vscode.ExtensionContext, url: string, data: any) {
        const token = await AuthHandler.getInstance().retrieveToken(context, 'devAssistant.client.accessToken');
        if (!token) {
            throw new Error('Token not found');
        }
        url = this.constructUrl(url);
        return axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    public async get(context: vscode.ExtensionContext, url: string) {
        const token = await AuthHandler.getInstance().retrieveToken(context, 'devAssistant.client.accessToken');
        url = this.constructUrl(url);
        return axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    public async put(context: vscode.ExtensionContext, url: string, data: any) {
        const token = await AuthHandler.getInstance().retrieveToken(context, 'devAssistant.client.accessToken');
        url = this.constructUrl(url);
        return axios.put(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    private constructUrl(url: string): string {
        return url.startsWith('http') ? url : `${API_URL}${url}`; // If url doesn't start with http or https, concatenate with API_URL
    }

    public async postWithToken(url: string, token: string) {
        return axios.post(url, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    public async getWithToken(url: string, token: string) {
        return axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    public async fetchConversations(token: string, conversationId?: string) {
        let endpoint = `${API_URL}/chat/`;
        if (conversationId) {
            endpoint += conversationId;
        }
        try {
            const response = await this.getWithToken(endpoint, token);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch conversations');
            return null;
        }
    }

    public async fetchMessages(token: string, conversationId: string) {
        const endpoint = `${API_URL}/chat/${conversationId}`;
        try {
            const response = await this.getWithToken(endpoint, token);
            return response.data;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch messages');
            return null;
        }
    }
}

