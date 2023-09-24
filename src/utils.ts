import * as vscode from 'vscode';
import { machineIdSync } from "node-machine-id";

// Function to get unique machine ID
export function getUniqueId() {
    const id = vscode.env.machineId;
    return id !== "someValue.machineId" ? id : machineIdSync();
}

// Export the URL of the API
export const APP_URL = process.env.NODE_ENV === 'production' ? 'https://devassistant.tonet.dev' : 'https://dev-assistant-server.test';
export const API_URL = `${APP_URL}/api`;