const API_URL = process.env.NODE_ENV === 'production' ? 'https://devassistant.tonet.dev/api' : 'https://dev-assistant-server.test/api';

export function getChatWebviewContent(): string {
    return `
        <style>
            .message-container {
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                height: calc(100% - 50px);
                padding: 10px;
            }
            .message {
                max-width: 60%;
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 10px;
            }
            .human-message {
                align-self: flex-end;
                background-color: #0078D4;
                color: white;
            }
            .ai-message {
                align-self: flex-start;
                background-color: #E1E1E1;
                color: black;
            }
            .input-container {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                border-top: 1px solid #E1E1E1;
            }
            .input-container input {
                flex-grow: 1;
                margin-right: 10px;
            }
        </style>
        <div class="w-full h-full flex flex-col">
            <h1>Welcome to the Dev Assistant!</h1>
            <div id="chat">
                <div id="messages" class="message-container">
                    <!-- Messages will be inserted here -->
                </div>
                <div class="input-container">
                    <input type="text" id="message" placeholder="Type your message here...">
                    <button id="send">Send</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('send').addEventListener('click', async function() {
                    const messageInput = document.getElementById('message');
                    const message = messageInput.value;
                    const messagesDiv = document.getElementById('messages');
                    messagesDiv.innerHTML += '<div class="message human-message">' + message + '</div>';
                    messageInput.value = '';
                    const response = await fetch('${API_URL}/chat', {
                        method: 'POST',
                        body: JSON.stringify({ message: message }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (data.error) {
                        vscode.postMessage({
                            command: 'error',
                            text: data.error
                        });
                    } else {
                        vscode.postMessage({
                            command: 'response',
                            text: data.message
                        });
                        // Include the response in the list of displayed messages
                        messagesDiv.innerHTML += '<div class="message ai-message">' + data.message + '</div>';
                    }
                });
            </script>
        </div>
    `;
}