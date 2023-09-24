import * as fs from 'fs';
import * as path from 'path';

export function getLoginWebviewContent(): string {
    const htmlPath = path.join(__dirname, 'loginView.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
}