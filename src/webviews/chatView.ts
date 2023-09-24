export function getChatWebviewContent(): string {    
    return `
        <div class="w-full h-full flex items-center justify-center">
            <h1>Welcome to the Dev Assistant!</h1>
            <div id="chat">
                <input type="text" id="message" placeholder="Type your message here...">
                <button id="send">Enviar</button>
                <div id="messages">
                    <!-- Messages will be inserted here -->
                </div>
            </div>
            <script>
                document.getElementById('send').addEventListener('click', function() {
                    const message = document.getElementById('message').value;
                    const messagesDiv = document.getElementById('messages');
                    messagesDiv.innerHTML += '<div>' + message + '</div>';
                    setTimeout(function() {
                        messagesDiv.innerHTML += '<div>Simulated server response</div>';
                    }, 1000);
                });
            </script>
        </div>
    `;
}