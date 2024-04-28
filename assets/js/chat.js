// @ts-nocheck
// This script will be executed within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();
    const oldState = vscode.getState();
    const chatUI = document.getElementById('chatUI');
    const chatBody = document.getElementById('chatBody');
    const chatTitle = document.getElementById('chatTitle');
    const chatTokenUsage = document.getElementById('chatTokenUsage');

    const chatStatusFeedback = document.getElementById('chatStatusFeedback');
    const chatStatus = document.getElementById('chatStatus');

    const form = document.getElementById('chatForm');
    const input = document.getElementById('input');

    let currentMessage = (oldState && oldState.message) || '';
    let current_conversation_id = (oldState && oldState.conversationId) || '';
    let messages = (oldState && oldState.messages) || [];
    let editingMessageId = null;

    if (input)
        input.value = currentMessage;

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data;
        // The json data that the extension sent
        switch (message.command) {
            case 'updateStatus':
                var status = message.status;
                var statusMessage = '⚪';
                chatStatus.classList.remove('loading')

                // Build an appropriate message according to the status
                switch (status) {
                    case 'in_progress':
                        chatStatusLed.innerHTML = '🟡';
                        chatStatus.classList.add('loading')
                        chatStatusFeedback.innerHTML = "Working ..."
                        form.disabled = true;
                        input.disabled = true
                        break;
                    case 'queued':
                        chatStatusLed.innerHTML = '🟠';
                        chatStatusFeedback.innerHTML = "Queued"
                        form.disabled = false;
                        input.disabled = false
                        break;
                    case 'completed':
                        chatStatusLed.innerHTML = '🟢';
                        chatStatusFeedback.innerHTML = "Ready"
                        form.disabled = false;
                        input.disabled = false
                        input.focus()
                        break;
                    case 'failed':
                        chatStatusLed.innerHTML = '🔴';
                        chatStatusFeedback.innerHTML = "Error!"
                        form.disabled = false;
                        input.disabled = false
                        break;
                    case 'typing': // New case for typing indicator
                        chatStatusLed.innerHTML = '🟡';
                        chatStatus.classList.add('loading')
                        chatStatusFeedback.innerHTML = "Dev Assistant is typing...";
                        break;
                    default:
                        chatStatusLed.innerHTML = '';
                        chatStatusFeedback.innerHTML = ""
                        form.disabled = false;
                        input.disabled = false
                        break;
                }

                break;

            case 'updateChat':
                current_conversation_id = message.conversation.id;
                var currentQtd = messages.length

                messages = message.conversation.messages;
                chatBody.innerHTML = '';

                messages.forEach(msg => {
                    const li = document.createElement('li');

                    if (msg.id) {
                        li.id = msg.id;
                        li.classList.remove('placeholder');
                    } else {
                        li.classList.add('placeholder');
                    }

                    li.classList.add(msg.role);

                    let name = msg.role == "assistant" ? "Dev Assistant" : "You"
                    let tokenUsage
                    if (msg.usage) {
                        tokenUsage = `
                            <div>${msg.usage.promptTokens}</div>
                            <div>${msg.usage.completionTokens}</div>
                            <div>${msg.usage.totalTokens}</div>
                        `
                    }
                    let actions = `
                        <span class="delete-message" data-msg-id="${msg.id}" title="Delete this message">×</span>
                    `

                    li.innerHTML = `<div class="container">
                        <div class="msgHeading">
                            <strong>${name}:</strong>
                            <small class="msgActions">${actions}</small>
                        </div>
                        <div class="msgContent">
                            ${msg.html}
                        </div>
                    </div>`;

                    chatBody.appendChild(li);
                }
                );

                hljs.highlightAll();

                // Scroll to the bottom if new messages are added
                if (chatUI && currentQtd != messages.length) {
                    chatUI.scrollTo({
                        top: chatUI.scrollHeight,
                        behavior: 'smooth'
                    });
                }

                // Tokens usage count
                // chatTokenUsage.innerHTML = messages.length

                // Add event listeners for delete actions
                document.querySelectorAll('.delete-message').forEach(button => {
                    button.addEventListener('click', function (event) {
                        event.preventDefault();
                        const messageId = this.getAttribute('data-msg-id');
                        let li = document.getElementById(messageId)
                        li.classList.add('placeholder')
                        vscode.postMessage({
                            command: 'deleteMessage',
                            messageId: messageId
                        });
                    });
                }
                );
                break;

            case 'inputValue':
                if (input)
                    input.value = message.value;
                setTimeout(() => input.focus(), 1);
                break;

            default:
                break;
        }
    }
    );

    form?.addEventListener('submit', (event) => {
        event.preventDefault();

        if (input && input.value) {
            const messageContent = input.value;

            chatStatusLed.innerHTML = '🟡'
            chatStatusFeedback.innerHTML = "Sending ..."

            input.value = '';
            input.disabled = true

            if (editingMessageId) {
                vscode.postMessage({
                    command: 'editMessage',
                    messageId: editingMessageId,
                    content: messageContent
                });
                editingMessageId = null;
            } else {
                vscode.postMessage({
                    command: 'newMessage',
                    conversation_id: current_conversation_id ?? null,
                    role: 'user',
                    content: messageContent
                });
            }
        }
    }
    );

}());
