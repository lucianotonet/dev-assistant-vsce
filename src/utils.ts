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

// Check the environment and set the APP_URL accordingly
export const APP_URL = process.env.APP_URL ?? 'https://devassistant.tonet.dev';
export const API_URL = `${APP_URL}/api`;
export const CLIENT_ID = getUniqueId();

