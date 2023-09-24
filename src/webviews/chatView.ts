export function getChatWebviewContent(): string {    
    return `
        <div class="w-full h-full flex items-center justify-center">
            <h1>Welcome to the Dev Assistant!</h1>
            <div id="chat">
                <input type="text" id="message" placeholder="Type your message here...">
                <button id="send">Enviar</button>
                <div id="messages"></div>
            </div>
        </div>
    `;
}