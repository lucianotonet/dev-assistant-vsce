import { join } from 'path';
import { APP_URL, API_URL } from '../utils';
import { readFileSync } from 'fs';

export function getChatWebviewContent(): string {
    const filePath = join(__dirname, 'chat.html');
    return readFileSync(filePath, 'utf8');
}