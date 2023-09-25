import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { handleChatCommand } from '../chatViewHandler';

describe('Chat View Tests', () => {
    let context: ExtensionContext;

    before(() => {
        const extension = vscode.extensions.getExtension('dev-assistant-vsce');
        if (extension) {
            extension.activate().then((ext) => {
                context = ext;
            });
        }
    });

    it('should display chat interface', async () => {
        const panel = handleChatCommand(context);
        assert.strictEqual(panel?.title, 'Dev Assistant Chat');
        assert.strictEqual(panel?.viewType, 'dev-assistant.chatView');
        assert.strictEqual(panel?.visible, true);
    });
});