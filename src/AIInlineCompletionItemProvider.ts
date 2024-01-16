import * as vscode from 'vscode';
import { ApiHandler } from './ApiHandler';

export class AIInlineCompletionItemProvider implements vscode.InlineCompletionItemProvider {
    private apiHandler: ApiHandler;

    constructor(context: vscode.ExtensionContext) {
        this.apiHandler = ApiHandler.getInstance(context);
    }

    public async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | undefined> {
        // Get the full document context
        const fullText = document.getText();
        const cursorPosition = document.offsetAt(position);
        const languageId = document.languageId;
        const fileName = document.fileName;
        const uri = document.uri.toString();

        // Get the user settings
        const userSettings = vscode.workspace.getConfiguration();

        // Get the current theme color
        const themeColor = vscode.workspace.getConfiguration('workbench.colorTheme');

        const start = position.translate(0, -1);
        const end = position.translate(0, 1);

        // Create an InlineCompletionItem
        const inlineCompletionItem = new vscode.InlineCompletionItem(
            'Texto sugerido 4 ...',
            new vscode.Range(start, end),
        );

        // Return an array of InlineCompletionItems
        return [inlineCompletionItem];

        if (
            fullText.length > 1000 ||
            fullText.trim().length === 0 ||
            userSettings.get('devAssistant.inlineCompletion.enabled') === false 
        ) {
            return;
        }

        // Prepare the request payload with full context, user settings, theme color and other options
        const requestPayload = {
            input: `Você é uma extensão para VSCode. Com base no código do usuário, retorne apenas o código de sugestão para autocompletar ou nada.
                Informações extras: {cursorPosition: ${cursorPosition}, languageId: ${languageId}, fileName: ${fileName}}.
                Código do usuário: ${fullText}`,
        };

        
        // Get the AI suggestion with the full context and other options
        const suggestions = await this.apiHandler.getSuggestionsFromAI(requestPayload);    
        
        vscode.window.showInformationMessage(`Sugestões: ${suggestions}`);
        
        // If there are suggestions, return the first one as an inline completion
        if (suggestions.length > 0) {
            const firstSuggestion = suggestions[0];
            return [{
                range: new vscode.Range(position, position.translate(0, firstSuggestion.length)),
                insertText: firstSuggestion
            }];
        }
    }

    async getDiffs(document: vscode.TextDocument): Promise<vscode.TextDocumentChangeEvent[]> {
        // Your logic to check for diffs
        debugger
        return [];
    }
}