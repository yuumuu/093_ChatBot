// Elemen DOM
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const submitBtn = document.getElementById("submit-btn");
const clearBtn = document.getElementById("clear-chat");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const modelSelect = document.getElementById("model-select");
const starterChips = document.getElementById("starter-chips");
const notesTextarea = document.getElementById("notes-textarea");
const notesCounter = document.getElementById("notes-counter");
const copyNotesBtn = document.getElementById("copy-notes-btn");
const clearNotesBtn = document.getElementById("clear-notes-btn");
const mobileTabBtns = document.querySelectorAll(".tab-btn");

let messages = [];

// ==========================================================================
// 1. Pengaturan Tema (Light / Dark Mode)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem("workspace_theme") || "dark";
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("workspace_theme", theme);
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    themeToggle.setAttribute("title", theme === "dark" ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap");
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
});

// ==========================================================================
// 2. Pengaturan Model AI
// ==========================================================================
function initModel() {
    const savedModel = localStorage.getItem("workspace_model");
    if (savedModel && modelSelect.querySelector(`option[value="${savedModel}"]`)) {
        modelSelect.value = savedModel;
    }
}

modelSelect.addEventListener("change", () => {
    localStorage.setItem("workspace_model", modelSelect.value);
});

// ==========================================================================
// 3. Tab Navigasi Mobile
// ==========================================================================
function initMobileTabs() {
    const chatPanel = document.getElementById("panel-chat");
    const notesPanel = document.getElementById("panel-notes");

    // Default di mobile: chat aktif
    if (window.innerWidth <= 900) {
        chatPanel.classList.add("active-panel");
    }

    mobileTabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            mobileTabBtns.forEach((b) => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });

            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");

            const targetId = btn.getAttribute("data-target");
            if (targetId === "panel-chat") {
                chatPanel.classList.add("active-panel");
                notesPanel.classList.remove("active-panel");
            } else {
                notesPanel.classList.add("active-panel");
                chatPanel.classList.remove("active-panel");
            }
        });
    });
}

// ==========================================================================
// 4. Panel Catatan & Workspace Scratchpad
// ==========================================================================
function initNotes() {
    const savedNotes = localStorage.getItem("workspace_notes") || "";
    notesTextarea.value = savedNotes;
    updateNotesCounter();
}

function updateNotesCounter() {
    const charCount = notesTextarea.value.length;
    notesCounter.textContent = `${charCount} karakter`;
}

notesTextarea.addEventListener("input", () => {
    localStorage.setItem("workspace_notes", notesTextarea.value);
    updateNotesCounter();
});

copyNotesBtn.addEventListener("click", async () => {
    if (!notesTextarea.value.trim()) return;
    try {
        await navigator.clipboard.writeText(notesTextarea.value);
        const originalText = copyNotesBtn.textContent;
        copyNotesBtn.textContent = "Tersalin!";
        setTimeout(() => {
            copyNotesBtn.textContent = originalText;
        }, 1500);
    } catch (err) {
        console.error("Gagal menyalin catatan:", err);
    }
});

clearNotesBtn.addEventListener("click", () => {
    if (notesTextarea.value.trim() && confirm("Kosongkan catatan di panel ini?")) {
        notesTextarea.value = "";
        localStorage.removeItem("workspace_notes");
        updateNotesCounter();
    }
});

function appendToNotes(text, label = "Snippet") {
    const current = notesTextarea.value;
    const separator = current.trim() ? "\n\n---\n\n" : "";
    const newEntry = `${separator}/* [${label}] */\n${text}`;
    notesTextarea.value = current + newEntry;
    localStorage.setItem("workspace_notes", notesTextarea.value);
    updateNotesCounter();

    // Beri indikasi visual bahwa catatan bertambah
    notesTextarea.scrollTop = notesTextarea.scrollHeight;
    notesCounter.textContent = "Catatan ditambahkan!";
    setTimeout(updateNotesCounter, 1800);
}

// ==========================================================================
// 5. Formatter Markdown Ringan & Aman (Zero Dependency)
// ==========================================================================
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderMarkdown(rawText) {
    if (!rawText) return "";

    // 1. Ekstrak code blocks terlebih dahulu agar tidak terpengaruh format inline
    const codeBlocks = [];
    let processed = rawText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push({
            language: lang.trim() || "code",
            code: code.replace(/\n$/, "")
        });
        return placeholder;
    });

    // 2. Escape HTML teks biasa
    processed = escapeHtml(processed);

    // 3. Format Inline
    // Inline code: `code`
    processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Bold: **text**
    processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic: *text*
    processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // 4. Paragraf & Baris Baru
    const paragraphs = processed.split(/\n\n+/);
    processed = paragraphs
        .map((p) => {
            const trimmed = p.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("__CODE_BLOCK_")) return trimmed;
            return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
        })
        .join("");

    // 5. Kembalikan Code Blocks dengan Kontrol Lengkap (Salin + Simpan ke Catatan)
    codeBlocks.forEach((block, idx) => {
        const placeholder = `__CODE_BLOCK_${idx}__`;
        const escapedCode = escapeHtml(block.code);
        const encodedCodeAttr = encodeURIComponent(block.code);

        const blockHtml = `
            <div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-language">${escapeHtml(block.language)}</span>
                    <div class="code-actions">
                        <button type="button" class="btn-send-to-notes" data-code="${encodedCodeAttr}" title="Simpan ke Catatan Workspace">
                            + Ke Catatan
                        </button>
                        <button type="button" class="btn-code-copy" data-code="${encodedCodeAttr}" title="Salin kode ke clipboard">
                            Salin
                        </button>
                    </div>
                </div>
                <pre><code>${escapedCode}</code></pre>
            </div>
        `;
        processed = processed.replace(placeholder, blockHtml);
    });

    return processed;
}

// Delegasi Event Klik untuk Tombol Salin & Kirim ke Catatan
chatBox.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest(".btn-code-copy");
    if (copyBtn) {
        const rawCode = decodeURIComponent(copyBtn.getAttribute("data-code") || "");
        if (rawCode) {
            try {
                await navigator.clipboard.writeText(rawCode);
                const originalText = copyBtn.textContent;
                copyBtn.textContent = "Tersalin!";
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 1500);
            } catch (err) {
                console.error("Gagal menyalin kode:", err);
            }
        }
        return;
    }

    const noteBtn = e.target.closest(".btn-send-to-notes");
    if (noteBtn) {
        const rawCode = decodeURIComponent(noteBtn.getAttribute("data-code") || "");
        if (rawCode) {
            appendToNotes(rawCode, "Cuplikan Kode");
            const originalText = noteBtn.textContent;
            noteBtn.textContent = "Tersimpan!";
            setTimeout(() => {
                noteBtn.textContent = originalText;
            }, 1500);
        }
    }
});

// ==========================================================================
// 6. Penanganan Obrolan & Streaming SSE
// ==========================================================================
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
        content.innerHTML = renderMarkdown(text);
    }

    message.appendChild(content);
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    return { messageEl: message, contentEl: content };
}

// Starter Chips: Klik chip untuk langsung mengirimkan pertanyaan
if (starterChips) {
    starterChips.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip-item");
        if (chip) {
            const prompt = chip.getAttribute("data-prompt");
            if (prompt) {
                userInput.value = prompt;
                handleChatSubmit();
            }
        }
    });
}

// Auto-expand textarea
userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
});

// Keyboard shortcut: Enter untuk kirim, Shift+Enter untuk baris baru
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
    }
});

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleChatSubmit();
});

async function handleChatSubmit() {
    const message = userInput.value.trim();
    if (!message) return;

    // Sembunyikan starter chips jika ada pesan pertama
    if (starterChips && starterChips.style.display !== "none") {
        starterChips.style.display = "none";
    }

    // Tampilkan pesan pengguna
    addMessage(message, "user");
    messages.push({
        role: "user",
        content: message
    });

    // Reset input
    userInput.value = "";
    userInput.style.height = "auto";
    userInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Menunggu...";

    // Siapkan bubble bot dengan typing indicator
    const botMsg = addMessage("", "bot", true);
    let botResponse = "";
    let hasReceivedFirstToken = false;

    try {
        const selectedModel = modelSelect.value;
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: selectedModel
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server merespons status ${response.status}`);
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
                            hasReceivedFirstToken = true;
                        }

                        botResponse += token;
                        botMsg.contentEl.innerHTML = renderMarkdown(botResponse);
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                } catch (err) {
                    console.error("Gagal membaca token streaming:", err);
                }
            }
        }

        if (!hasReceivedFirstToken) {
            botMsg.contentEl.classList.remove("typing");
            botMsg.contentEl.classList.add("error");
            botMsg.contentEl.textContent = "Model tidak menghasilkan teks respons. Silakan coba tanyakan kembali.";
        } else {
            messages.push({
                role: "assistant",
                content: botResponse
            });
        }
    } catch (err) {
        console.error("Error percakapan:", err);
        botMsg.contentEl.classList.remove("typing");
        botMsg.contentEl.classList.add("error");
        botMsg.contentEl.textContent = "Maaf, terjadi kesalahan: " + err.message;
    } finally {
        userInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim";
        userInput.focus();
    }
}

// Bersihkan riwayat percakapan
clearBtn.addEventListener("click", () => {
    messages = [];
    chatBox.innerHTML = `
        <div class="message bot">
            <div class="message-meta">
                <span class="sender-name">Asisten AI</span>
            </div>
            <div class="message-content">
                Riwayat percakapan telah dibersihkan. Anda dapat memulai topik obrolan baru di bawah.
            </div>
        </div>
    `;

    // Munculkan kembali starter chips
    if (starterChips) {
        starterChips.style.display = "block";
        chatBox.appendChild(starterChips);
    }

    userInput.focus();
});

// ==========================================================================
// Inisialisasi Saat Dokumen Siap
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initModel();
    initNotes();
    initMobileTabs();
});
