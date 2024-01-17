// Este script será executado dentro do próprio webview
// Ele não pode acessar as principais APIs do VS Code diretamente.

(function () {
    const vscode = acquireVsCodeApi();
    const oldState = vscode.getState();
    const body = document.body
    const form = document.getElementById('chatForm');
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const counter = document.getElementById('counter');

    console.log('Estado inicial', oldState);

    let currentCount = (oldState && oldState.count) || 0;
    let currentMessage = (oldState && oldState.message) || '';
    let messages = (oldState && oldState.messages) || [];

    // Restaura o estado do input
    if (input) input.value = currentMessage;
    if (counter) counter.textContent = currentCount.toString();

    // Trata as mensagens enviadas da extensão para o webview
    window.addEventListener('message', event => {
        const message = event.data; // Os dados json que a extensão enviou
        switch (message.command) {
            case 'refactor':
                currentCount = Math.ceil(currentCount * 0.5);
                if (counter) counter.textContent = currentCount.toString();
                break;
            case 'updateMessages':
                messages = message.messages;
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
                // chat.scrollTop = chat.scrollHeight;
                body.scrollTop = body.scrollHeight;
                debugger
        }
    });

    form?.addEventListener('submit', (event)=>{
        event.preventDefault();
        if (input && input.value) {
            const message = input.value;
            input.value = '';
            vscode.postMessage({
                command: 'newMessage',
                role: 'user',
                content: message
            });
        }
    });
}());
