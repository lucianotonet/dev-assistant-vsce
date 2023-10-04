import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export function getUniqueId() {
    let id = vscode.workspace.getConfiguration().get('uniqueId');
    if (!id) {
        id = uuidv4();
        vscode.workspace.getConfiguration().update('uniqueId', id, vscode.ConfigurationTarget.Global);
    }
    return id;
}

// Export the URL of the API
let APP_URL: string;

// Check the environment and set the APP_URL accordingly
APP_URL = process.env.NODE_ENV === 'production' ? 'https://devassistant.tonet.dev' : (process.env.APP_URL ?? 'https://dev-assistant-server.test');

export { APP_URL };
export const API_URL = `${APP_URL}/api`;

export const CLIENT_ID = getUniqueId();