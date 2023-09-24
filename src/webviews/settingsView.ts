import * as fs from 'fs';
import * as path from 'path';

export function getSettingsWebviewContent(): string {
    const htmlPath = path.join(__dirname, 'settingsView.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
}