import * as vscode from 'vscode';
import OpenAI from 'openai';

// let openaiApiKey = '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'; // Replace with your OpenAI API key

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension Dev Assistant is now active!');

	let disposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
		// Create and show a new webview panel
		const panel = vscode.window.createWebviewPanel(
			'devAssistant',
			'Dev Assistant',
			vscode.ViewColumn.Two, // Open the panel in the sidebar
			{
				enableScripts: true // Allow scripts in the webview
			}
		);

		// Set the HTML content of the panel
		panel.webview.html = `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="UTF-8">
					<title>Dev Assistant</title>
				</head>
				<body>
					<h1>Welcome to the Dev Assistant!</h1>
				</body>				
			</html>
		`;

		// Set the icon for the primary sidebar
		panel.onDidChangeViewState(e => {
			if (e.webviewPanel.active) {
				panel.iconPath = {
					light: vscode.Uri.file(context.asAbsolutePath('resources/icon.svg')),
					dark: vscode.Uri.file(context.asAbsolutePath('resources/icon.svg'))
				};
			} else {
				panel.iconPath = {
					light: vscode.Uri.file(context.asAbsolutePath('resources/icon.svg')),
					dark: vscode.Uri.file(context.asAbsolutePath('resources/icon.svg'))
				};
			}
		});

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			}
		);
	});

	// Register a data provider for the view
	const dataProvider = {
		getChildren: () => {
			return ['Welcome to', 'Dev Assistant!'];
		},
		getTreeItem: (element: string | vscode.TreeItemLabel) => {
			return new vscode.TreeItem(element);
		}
	};

	vscode.window.registerTreeDataProvider('devAssistant', dataProvider);

	context.subscriptions.push(disposable);
}