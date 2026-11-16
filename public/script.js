const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const submitBtn = document.getElementById("submit-btn");
const clearBtn = document.getElementById("clear-chat");

let messages = [];

function addMessage(text, sender, isTyping = false) {
    const message = document.createElement("div");
    message.classList.add("message", sender);

    const meta = document.createElement("div");
    meta.classList.add("message-meta");
    const senderLabel = document.createElement("span");
    senderLabel.classList.add("sender-name");
    senderLabel.textContent = sender === "user" ? "Anda" : "Asisten AI";
    meta.appendChild(senderLabel);
    message.appendChild(meta);

    const content = document.createElement("div");
    content.classList.add("message-content");

    if (isTyping) {
        content.classList.add("typing");
        content.innerHTML = '<span class="typing-dots" aria-label="Sedang memproses respons"><span></span><span></span><span></span></span>';
    } else {
        content.textContent = text;
    }

    message.appendChild(content);
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    return { messageEl: message, contentEl: content };
}

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Tampilkan pesan pengguna
    addMessage(message, "user");

    // Simpan pesan user ke history
    messages.push({
        role: "user",
        content: message
    });

    // Reset input dan atur status form
    userInput.value = "";
    userInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Menunggu...";

    // Tampilkan bubble asisten dengan indikator loading
    const botMsg = addMessage("", "bot", true);
    let botResponse = "";
    let hasReceivedFirstToken = false;

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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server merespons dengan status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;
                if (!trimmedLine.startsWith("data:")) continue;

                const data = trimmedLine.slice(5).trim();
                if (data === "[DONE]") continue;

                try {
                    const token = JSON.parse(data);
                    if (typeof token === "string" && token.length > 0) {
                        if (!hasReceivedFirstToken) {
                            botMsg.contentEl.classList.remove("typing");
                            botMsg.contentEl.textContent = "";
                            hasReceivedFirstToken = true;
                        }

                        botResponse += token;
                        botMsg.contentEl.textContent = botResponse;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                } catch (err) {
                    console.error("Gagal membaca token:", err);
                }
            }
        }

        // Jika respons selesai tapi belum pernah menerima token (misalnya stream kosong)
        if (!hasReceivedFirstToken) {
            botMsg.contentEl.classList.remove("typing");
            botMsg.contentEl.classList.add("error");
            botMsg.contentEl.textContent = "Model tidak menghasilkan teks respons. Silakan coba kirim ulang pertanyaan Anda.";
        } else {
            // Simpan respons lengkap asisten ke histori obrolan
            messages.push({
                role: "assistant",
                content: botResponse
            });
        }
    } catch (err) {
        console.error("Error pada chat:", err);
        botMsg.contentEl.classList.remove("typing");
        botMsg.contentEl.classList.add("error");
        botMsg.contentEl.textContent = "Maaf, terjadi kesalahan: " + err.message;
    } finally {
        // Aktifkan kembali kontrol input
        userInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim";
        userInput.focus();
    }
});

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        messages = [];
        chatBox.innerHTML = `
            <div class="message bot">
                <div class="message-meta">
                    <span class="sender-name">Asisten AI</span>
                </div>
                <div class="message-content">
                    Riwayat percakapan telah dibersihkan. Silakan mulai pertanyaan baru.
                </div>
            </div>
        `;
        userInput.focus();
    });
}