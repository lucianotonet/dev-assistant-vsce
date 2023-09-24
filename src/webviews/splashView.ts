import * as fs from 'fs';
import * as path from 'path';

export function getSplashWebviewContent(): string {
    const htmlPath = path.join(__dirname, 'splashView.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
}