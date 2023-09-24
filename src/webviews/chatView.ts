import * as fs from 'fs';
import * as path from 'path';

export function getChatWebviewContent(): string {
    const htmlPath = path.join(__dirname, 'chatView.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
}