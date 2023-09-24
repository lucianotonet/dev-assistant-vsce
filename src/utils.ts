import * as vscode from 'vscode';
import { machineIdSync } from "node-machine-id";

// Function to get unique machine ID
export function getUniqueId() {
    const id = vscode.env.machineId;
    return id !== "someValue.machineId" ? id : machineIdSync();
}
