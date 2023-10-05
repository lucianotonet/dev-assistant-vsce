import * as vscode from "vscode";
import { handleSplashCommand, handleWelcomeScreenCommand, handleGoodbyeScreenCommand } from "./splashViewHandler";
import { AuthHandler } from "./authHandler";
import { AblyHandler } from "./ablyHandler";
import { handleChatCommand } from "./chatViewHandler";
import { timelineViewHandler } from "./timelineViewHandler";
import { CLIENT_ID } from "./utils";

let authHandler = AuthHandler.getInstance();
let ablyHandler = AblyHandler.getInstance();

export let extensionContext: vscode.ExtensionContext | undefined = undefined;

export async function activateExtension(context: vscode.ExtensionContext) {
    let statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = `$(beaker)`;
    statusBar.command = 'dev-assistant.showTimeline'; // Comando a ser executado quando o item da barra de status for clicado
    statusBar.show();

    try {
        await ablyHandler.initAbly();
    } catch (error) {
        console.error('Failed to initialize Ably:', error);
    }

    let showTimelineDisposable = vscode.commands.registerCommand('dev-assistant.showTimeline', () => {
        // Exibir view de timeline
        timelineViewHandler(context);
        
        // Exemplo: Exibir notificação
        vscode.window.showInformationMessage('Your CLIENT ID is: ' + CLIENT_ID);
    });


    extensionContext = context;

    // Register the auth command
    let authClientDisposable = vscode.commands.registerCommand('dev-assistant.auth', () => {
        authHandler.handleAuthCommand(context);
    });

    // Register the deauth command
    let deauthClientDisposable = vscode.commands.registerCommand('dev-assistant.deauth', () => {
        authHandler.handleDeauthCommand(context);
    });
    
    // Register the splash command
    let splashDisposable = vscode.commands.registerCommand('dev-assistant.splash', () => {
        handleSplashCommand(context);
    });
    
    // Register the chat command
    let chatDisposable = vscode.commands.registerCommand('dev-assistant.chat', () => {
        handleChatCommand(context);
    });

    // Register the URI handler
    let uriHandler = vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
            if (uri.path === '/auth/success') {
                const token = uri.query.split('=')[1];
                context.globalState.update('devAssistant.authToken', token);
                vscode.window.showInformationMessage('Token salvo com sucesso!');
            }
        }
    });

    extensionContext?.subscriptions.push(authClientDisposable);
    extensionContext?.subscriptions.push(deauthClientDisposable);
    extensionContext?.subscriptions.push(splashDisposable);
    extensionContext?.subscriptions.push(chatDisposable);
    extensionContext?.subscriptions.push(uriHandler);

    extensionContext?.subscriptions.push(showTimelineDisposable, statusBar);


    let welcomeScreenDisposable = vscode.commands.registerCommand('dev-assistant.welcome', () => {
        handleWelcomeScreenCommand(context);
    });

    let logoutScreenDisposable = vscode.commands.registerCommand('dev-assistant.goodbye', () => {
        handleGoodbyeScreenCommand(context);
    });

    extensionContext?.subscriptions.push(welcomeScreenDisposable);
    extensionContext?.subscriptions.push(logoutScreenDisposable);
}