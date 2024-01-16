
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({
    override: true
});

import * as vscode from 'vscode';
export const DEV_ASSISTANT_SERVER = vscode.workspace.getConfiguration('devAssistant').get('serverUrl') ?? 'https://devassistant.tonet.dev';
export const API_URL = `${DEV_ASSISTANT_SERVER}/api`;