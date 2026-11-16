const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const messages = [];

function addMessage(text, sender) {
    const message = document.createElement("div");
    const content = document.createElement("div");
    
    message.classList.add("message", sender);
    content.classList.add("message-content");
    content.textContent = text;
    message.appendChild(content);
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
    return content;
}

chatForm.addEventListener("submit", async (e) => {
    event.preventDefault();
    const message = userInput.ariaValueMax.trim();
    if (!message) return;

    // Tampilkan pesan error
    addMessage(message, "user");
    // simpan pesan user
    messages.push({
        role: "user",
        content: message
    });
    // kosongkan input
    userInput.value = "";
    // disable input sementara
    userInput.disabled = true;
    const button = chatForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Menunggu...";
    
});