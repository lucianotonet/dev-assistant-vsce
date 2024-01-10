import * as vscode from 'vscode';
import { API_URL } from './utils';
import axios from 'axios';

export class ApiHandler {
    private static instance: ApiHandler;
    
    public static getInstance(): ApiHandler {
        if (!ApiHandler.instance) {
            ApiHandler.instance = new ApiHandler();
        }
        return ApiHandler.instance;
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

