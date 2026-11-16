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
    e.preventDefault();
    const message = userInput.value.trim();
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

    // Buat bubble AI kosong
    const botContent = addMessage("", "bot");
    let botResponse = "";
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Terjadi kesalahan");
        }

        // Baca streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // decode data
            buffer += decoder.decode(value, {
                stream: true
            });
            // pisahkan berdasarkan newline
            const lines = buffer.split("\n");
            // simpan bagian yang belum lengkap
            buffer = lines.pop();
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                if (!trimmedLine.startsWith("data:")) continue;
                const data = trimmedLine.slice(5).trim();
                if (data === "[DONE]") continue;

                try {
                    const token = JSON.parse(data);
                    // tambahkan token
                    botResponse += token;
                    // update tampilan
                    botContent.textContent = botResponse;
                    // auto scroll
                    chatBox.scrollTop = chatBox.scrollHeight;
                } catch (err) {
                    console.error("Gagal membaca token: ", err);
                }
            }
        }
        // simpan response AI setelah streaming selesai
        if (botResponse) {
            messages.push({
                role: "assistant",
                content: botResponse
            });
        }
    } catch (err) {
        console.error(err);
        botContent.textContent = "Maaf, terjadi kesalahan: " + err.message;
    } finally {
        // aktifkan kembali input
        userInput.disabled = false;
        button.disabled = false;
        button.textContent = "Kirim";
        userInput.focus();
    }
});