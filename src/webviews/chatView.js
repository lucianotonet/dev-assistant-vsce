const vscode = acquireVsCodeApi();
const messages = document.getElementById('messages');
const messageInput = document.getElementById('message');
function sendMessage() {
    const message = messageInput.value;
    messageInput.value = '';
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
    vscode.postMessage({
        command: 'chat',
        text: message
    });
}
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'response':
            const responseElement = document.createElement('div');
            responseElement.textContent = message.text;
            messages.appendChild(responseElement);
            break;
    }
});