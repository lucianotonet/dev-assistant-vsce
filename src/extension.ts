import * as vscode from 'vscode';
import { machineIdSync } from "node-machine-id";
import { PostHog } from 'posthog-node';

let client: PostHog | undefined = undefined;

// Function to capture events with PostHog
export async function capture(args: any) {
	console.log("Capturing posthog event: ", args);
	if (!client) {
		// Initialize PostHog client
		client = new PostHog(
			'phc_C6OoC4aFJT5MPFaiPXn03FTPHlRZpm7wu4LFOf6GzNg',
			{ host: 'https://app.posthog.com' }
		);
	}
	
	// Capture the event
	client?.capture(args);
}

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

	const { activateExtension } = await import("./activate");

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

// Function to get unique machine ID
export function getUniqueId() {
    const id = vscode.env.machineId;
    return id !== "someValue.machineId" ? id : machineIdSync();
}