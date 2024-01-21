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
    
    const chatStatusFeedback = document.getElementById('chatStatusFeedback');
    const chatStatus = document.getElementById('chatStatus');
    
    const form = document.getElementById('chatForm');
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');

    let currentMessage = (oldState && oldState.message) || '';
    let current_conversation_id = (oldState && oldState.conversationId) || '';
    let messages = (oldState && oldState.messages) || [];

    if (input) input.value = currentMessage;
    
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
                        chatStatusFeedback.innerHTML = "Working ..."
                        form.disabled = true;
                        input.disabled = true
                        break;
                    case 'queud':
                        statusMessage = '🟠';
                        chatStatusFeedback.innerHTML = "Queued"
                        form.disabled = false;
                        input.disabled = false
                        break;
                    case 'completed':
                        statusMessage = '🟢';                      
                        chatStatusFeedback.innerHTML = "Ready"                        
                        form.disabled = false;
                        input.disabled = false
                        break;
                    case 'failed':
                        statusMessage = '🔴';
                        chatStatusFeedback.innerHTML = "Error!"
                        form.disabled = false;
                        input.disabled = false
                        break;
                    default:
                        statusMessage = '⚪';
                        chatStatusFeedback.innerHTML = ""
                        form.disabled = false;
                        input.disabled = false
                        break;
                }

                if (chatStatusLed) {
                    chatStatusLed.innerHTML = `${statusMessage}`;                    
                }

                break;
            
            case 'updateChat':
                current_conversation_id = message.conversation.id;
                var currentQtd = messages.length
                
                messages = message.conversation.messages;
                if (chatTitle) chatTitle.innerHTML = `Chat #${current_conversation_id}`
                if (chatBody) chatBody.innerHTML = '';
                
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

                    li.innerHTML = `<div class="container"><strong>${name}:</strong><br/>${msg.html}</div>`;

                    if (chatBody) chatBody.appendChild(li);
                });

                hljs.highlightAll();

                if (chatUI && currentQtd != message.conversation.messages.lenght) {
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
                        
            chatStatusLed.innerHTML = '🟡';
            chatStatusFeedback.innerHTML = "Sending ..."
            
            input.value = '';
            input.disabled = true
            vscode.postMessage({
                command: 'newMessage',
                conversation_id: current_conversation_id ?? null,
                role: 'user',
                content: message
            });            
        }
    });

}());
