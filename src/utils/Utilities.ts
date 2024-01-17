
import { config as dotenvConfig } from 'dotenv';
import { PostHog } from 'posthog-node';
dotenvConfig({
    override: true
});

import * as vscode from 'vscode';
export const DEV_ASSISTANT_SERVER = vscode.workspace.getConfiguration('devAssistant').get('serverUrl') ?? 'https://devassistant.tonet.dev';
export const API_URL = `${DEV_ASSISTANT_SERVER}/api`;


let client: PostHog | undefined = undefined;

// Function to capture events with PostHog
export async function capture(args: any) {
    console.log("Capturing posthog event: ", args);
    if (!client) {
        // Initialize PostHog client
        client = new PostHog(
            'phc_C6OoC4aFJT5MPFaiPXn03FTPHlRZpm7wu4LFOf6GzNg',
            { host: 'https://app.posthog.com' }
        );
    }
    
    // Capture the event
    client?.capture(args);
}

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'assets')]
    };
}

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}