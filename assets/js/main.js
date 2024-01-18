// Este script será executado dentro do próprio webview
// Ele não pode acessar as principais APIs do VS Code diretamente.
(function () {
    const vscode = acquireVsCodeApi();
    const oldState = vscode.getState();
    const body = document.body
    const chatTitle = document.getElementById('chatTitle');
    const form = document.getElementById('chatForm');
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');

    console.log('Estado inicial', oldState);

    let currentMessage = (oldState && oldState.message) || '';
    let current_conversation_id = (oldState && oldState.conversationId) || '';
    let messages = (oldState && oldState.messages) || [];

    // Restaura o estado do input
    if (input) input.value = currentMessage;

    // Trata as mensagens enviadas da extensão para o webview
    window.addEventListener('message', event => {
        const message = event.data; // Os dados json que a extensão enviou
        switch (message.command) {
            case 'updateChat':
                current_conversation_id = message.conversation.id;
                messages = message.conversation.messages;
                chatTitle.innerHTML = `Chat #${current_conversation_id}`
                chat.innerHTML = '';
                messages.forEach(msg => {
                    const li = document.createElement('li');
                    if (msg.role == "assistant") {
                        li.classList.add('assistant')
                    }
                    li.innerHTML = `<div class="container"><strong>${msg.role}:</strong><br/>${msg.content}</div>`
                    chat.appendChild(li);
                });

                // Scroll automático para baixo no #chat
                chat.scrollTop = chat.scrollHeight;
                // body.scrollTop = body.scrollHeight;
                break;
        }
    });

    form?.addEventListener('submit', (event)=>{        
        event.preventDefault();
        if (input && input.value) {
            const message = input.value;
            input.value = '';
            
            vscode.postMessage({
                command: 'sendMessage',
                conversation_id: current_conversation_id ?? null,
                role: 'user',
                content: message
            });            
        }
    });
}());
