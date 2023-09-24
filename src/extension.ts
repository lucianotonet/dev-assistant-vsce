import * as vscode from 'vscode';
import { capture } from './analytics';
import { getUniqueId } from './utils';
import { activateExtension } from "./activate";

// Function to activate the extension
export async function activate(context: vscode.ExtensionContext) {
    if (!context.globalState.get("hasBeenInstalled")) {
        context.globalState.update("hasBeenInstalled", true);
        // Capture install event
        capture({
            distinctId: getUniqueId(),
            event: "install",
            properties: {
                platform: process.platform,
                arch: process.arch,
                version: vscode.version,
            },
        });
    }

    try {
        await activateExtension(context);
    } catch (e) {
        console.log("Error activating extension: ", e);
        // Show error message and provide options to view logs or retry
        vscode.window
            .showInformationMessage(
                "Error activating Dev Assistant AI extension.",
                "View Logs",
                "Retry"
            )
            .then((selection) => {
                if (selection === "View Logs") {
                    vscode.commands.executeCommand("dev-assistant.viewLogs");
                } else if (selection === "Retry") {
                    // Reload VS Code window
                    vscode.commands.executeCommand("workbench.action.reloadWindow");
                }
            });
    }
}
