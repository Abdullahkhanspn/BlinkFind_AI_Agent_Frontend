const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const synth = window.speechSynthesis;
const messagesDiv = document.getElementById('messages');
const textInput = document.getElementById('text-input');
let isChatbotCollapsed = false;

recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
    const query = event.results[0][0].transcript;
    addMessage(query, 'user');
    sendToRasa(query);
};

recognition.onerror = (event) => {
    addMessage('Voice input error: ' + event.error, 'ai');
};

function startListening() {
    recognition.start();
    addMessage('Listening...', 'ai', true);
}

function sendMessage() {
    const query = textInput.value.trim();
    if (query) {
        addMessage(query, 'user');
        sendToRasa(query);
        textInput.value = '';
    }
}

function sendToRasa(query) {
    addMessage('Typing...', 'ai', true);
    fetch('http://localhost:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user', message: query })
    })
    .then(response => {
        if (!response.ok) throw new Error('Server response: ' + response.status);
        return response.json();
    })
    .then(data => {
        messagesDiv.querySelector('.typing')?.remove();
        const reply = data[0]?.text || 'Sorry, I couldn’t process that.';
        addMessage(reply, 'ai');
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.pitch = 1;  // Neutral, professional tone
        utterance.rate = 1;   // Natural speed
        utterance.volume = 1;
        synth.speak(utterance);
    })
    .catch(error => {
        messagesDiv.querySelector('.typing')?.remove();
        addMessage('Error: ' + error.message, 'ai');
    });
}

function addMessage(text, type, isTyping = false) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.className = `message ${type} ${isTyping ? 'typing' : ''}`;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    isChatbotCollapsed = !isChatbotCollapsed;
    chatbot.classList.toggle('collapsed');
    document.querySelector('#chat-header .toggle-btn').textContent = isChatbotCollapsed ? '+' : '−';
}

// Initial greeting
setTimeout(() => {
    addMessage('Hello! I’m Blinkfind AI Agent, your assistant. How can I help you today?', 'ai');
}, 300);