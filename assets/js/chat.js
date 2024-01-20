// @ts-nocheck
// Este script será executado dentro do próprio webview
// Ele não pode acessar as principais APIs do VS Code diretamente.
(function () {
    const vscode = acquireVsCodeApi();
    const oldState = vscode.getState();
    const chatUI = document.getElementById('chatUI');
    const chatBody = document.getElementById('chatBody');
    const chatHeading = document.getElementById('chatHeading');
    const chatTitle = document.getElementById('chatTitle');   
    const chatStatus = document.getElementById('chatStatus');
    const form = document.getElementById('chatForm');
    
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');

    console.log('Estado inicial', oldState);

    let currentRunStatus = (oldState && oldState.status) || '';
    let currentMessage = (oldState && oldState.message) || '';
    let current_conversation_id = (oldState && oldState.conversationId) || '';
    let messages = (oldState && oldState.messages) || [];

    if (input) input.value = currentMessage;
    if (chatStatus) chatStatus.innerHTML = currentRunStatus

    // Trata as mensagens enviadas da extensão para o webview
    window.addEventListener('message', event => {
        const message = event.data; // Os dados json que a extensão enviou
        switch (message.command) {
            case 'updateStatus':
                var status = message.status;
                var statusMessage = '⚪';
                chatStatus.classList.remove('loading')

                // Monta uma mensagem apropriada conforme o status
                switch (status) {
                    case 'in_progress':
                        statusMessage = '🟡';
                        chatStatus.classList.add('loading')
                        break;
                    case 'queud':
                        statusMessage = '🟠';
                        break;
                    case 'completed':
                        statusMessage = '🟢';
                        break;
                    case 'failed':
                        statusMessage = '🔴';
                        break;
                    default:
                        statusMessage = '⚪';
                        break;
                }

                if (chatStatus) {
                    chatStatus.innerHTML = `${statusMessage}`;                    
                }

                break;
            
            case 'updateChat':
                current_conversation_id = message.conversation.id;
                messages = message.conversation.messages;
                
                if (chatTitle) chatTitle.innerHTML = `Chat #${current_conversation_id}`
                if (chatBody) chatBody.innerHTML = '';

                
                messages.forEach(msg => {
                    const li = document.createElement('li');
                    li.classList.add(msg.role);

                    let name = msg.role == "assistant" ? "Dev Assistant" : "You"

                    li.innerHTML = `<div class="container"><strong>${name}:</strong><br/>${msg.html}</div>`;

                    if (chatBody) chatBody.appendChild(li);
                });

                hljs.highlightAll();

                // Scroll automático para baixo no #chat
                if (chatUI) {
                    chatUI.scrollTo({
                        top: chatUI.scrollHeight,
                        behavior: 'smooth'
                    });
                }
                break;
        }
    });

    form?.addEventListener('submit', (event)=>{        
        event.preventDefault();
        
        if (input && input.value) {
            
            const message = input.value;
            
            if (chatStatus) {
                chatStatus.innerHTML = '🟡';
                chatStatus.classList.add('loading')
            }
            
            input.value = '';
            input.disable
            vscode.postMessage({
                command: 'newMessage',
                conversation_id: current_conversation_id ?? null,
                role: 'user',
                content: message
            });            
        }
    });

}());
