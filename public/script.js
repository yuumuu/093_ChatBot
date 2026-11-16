const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const submitBtn = document.getElementById("submit-btn");
const clearBtn = document.getElementById("clear-chat");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");
const modelSelect = document.getElementById("model-select");
const starterChips = document.getElementById("starter-chips");
const notesTextarea = document.getElementById("notes-textarea");
const notesCounter = document.getElementById("notes-counter");
const copyNotesBtn = document.getElementById("copy-notes-btn");
const clearNotesBtn = document.getElementById("clear-notes-btn");
const mobileNavBtns = document.querySelectorAll(".mobile-nav-btn");

let messages = [];

// ==========================================================================
// 1. Pengaturan Tema (Light & Dark Mode)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem("workspace_theme") || "dark";
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("workspace_theme", theme);
    if (themeLabel) {
        themeLabel.textContent = theme === "dark" ? "Mode Terang" : "Mode Gelap";
    }
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
});

// ==========================================================================
// 2. Pemilihan Model Bahasa
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
// 3. Navigasi Panel Mobile
// ==========================================================================
function initMobileNavigation() {
    const chatPane = document.getElementById("panel-chat");
    const notesPane = document.getElementById("panel-notes");

    if (window.innerWidth <= 900) {
        chatPane.classList.add("active-panel");
    }

    mobileNavBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            mobileNavBtns.forEach((b) => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });

            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");

            const target = btn.getAttribute("data-target");
            if (target === "panel-chat") {
                chatPane.classList.add("active-panel");
                notesPane.classList.remove("active-panel");
            } else {
                notesPane.classList.add("active-panel");
                chatPane.classList.remove("active-panel");
            }
        });
    });
}

// ==========================================================================
// 4. Catatan Sesi Kerja (Scratchpad)
// ==========================================================================
function initNotes() {
    const saved = localStorage.getItem("workspace_notes") || "";
    notesTextarea.value = saved;
    refreshNotesCounter();
}

function refreshNotesCounter() {
    const length = notesTextarea.value.length;
    notesCounter.textContent = `${length} karakter`;
}

notesTextarea.addEventListener("input", () => {
    localStorage.setItem("workspace_notes", notesTextarea.value);
    refreshNotesCounter();
});

copyNotesBtn.addEventListener("click", async () => {
    if (!notesTextarea.value.trim()) return;
    try {
        await navigator.clipboard.writeText(notesTextarea.value);
        const originalText = copyNotesBtn.textContent;
        copyNotesBtn.textContent = "Tersalin";
        setTimeout(() => {
            copyNotesBtn.textContent = originalText;
        }, 1400);
    } catch (err) {
        console.error("Gagal menyalin catatan:", err);
    }
});

clearNotesBtn.addEventListener("click", () => {
    if (notesTextarea.value.trim() && confirm("Kosongkan seluruh teks catatan sesi?")) {
        notesTextarea.value = "";
        localStorage.removeItem("workspace_notes");
        refreshNotesCounter();
    }
});

function appendToNotes(text, label = "Snippet") {
    const existing = notesTextarea.value;
    const padding = existing.trim() ? "\n\n" : "";
    notesTextarea.value = `${existing}${padding}[${label}]\n${text}`;
    localStorage.setItem("workspace_notes", notesTextarea.value);
    refreshNotesCounter();
    notesTextarea.scrollTop = notesTextarea.scrollHeight;

    const original = notesCounter.textContent;
    notesCounter.textContent = "Catatan ditambahkan";
    setTimeout(() => {
        refreshNotesCounter();
    }, 1500);
}

// ==========================================================================
// 5. Parser Markdown Ringkas dan Aman
// ==========================================================================
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseMarkdown(source) {
    if (!source) return "";

    const codeBlocks = [];
    let text = source.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const key = `__SNIPPET_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push({
            lang: lang.trim() || "text",
            code: code.replace(/\n$/, "")
        });
        return key;
    });

    text = escapeHtml(text);

    // Inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code class="inline-snippet">$1</code>');
    // Bold: **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic: *text*
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Paragraf
    const blocks = text.split(/\n\n+/);
    text = blocks
        .map((block) => {
            const clean = block.trim();
            if (!clean) return "";
            if (clean.startsWith("__SNIPPET_BLOCK_")) return clean;
            return `<p>${clean.replace(/\n/g, "<br>")}</p>`;
        })
        .join("");

    // Kembalikan blok kode dengan tombol aksi
    codeBlocks.forEach((block, index) => {
        const key = `__SNIPPET_BLOCK_${index}__`;
        const escapedSource = escapeHtml(block.code);
        const encodedData = encodeURIComponent(block.code);

        const html = `
            <div class="code-container">
                <div class="code-bar">
                    <span class="code-lang-tag">${escapeHtml(block.lang)}</span>
                    <div class="code-buttons">
                        <button type="button" class="snippet-btn btn-add-note" data-code="${encodedData}">
                            Simpan ke Catatan
                        </button>
                        <button type="button" class="snippet-btn btn-copy-code" data-code="${encodedData}">
                            Salin
                        </button>
                    </div>
                </div>
                <pre><code>${escapedSource}</code></pre>
            </div>
        `;
        text = text.replace(key, html);
    });

    return text;
}

// Delegasi klik tombol blok kode
chatBox.addEventListener("click", async (e) => {
    const copyTarget = e.target.closest(".btn-copy-code");
    if (copyTarget) {
        const raw = decodeURIComponent(copyTarget.getAttribute("data-code") || "");
        if (raw) {
            try {
                await navigator.clipboard.writeText(raw);
                const original = copyTarget.textContent;
                copyTarget.textContent = "Tersalin";
                setTimeout(() => {
                    copyTarget.textContent = original;
                }, 1400);
            } catch (err) {
                console.error("Gagal menyalin kode:", err);
            }
        }
        return;
    }

    const noteTarget = e.target.closest(".btn-add-note");
    if (noteTarget) {
        const raw = decodeURIComponent(noteTarget.getAttribute("data-code") || "");
        if (raw) {
            appendToNotes(raw, "Cuplikan Kode");
            const original = noteTarget.textContent;
            noteTarget.textContent = "Tersimpan";
            setTimeout(() => {
                noteTarget.textContent = original;
            }, 1400);
        }
    }
});

// ==========================================================================
// 6. Penanganan Percakapan dan Streaming
// ==========================================================================
function appendMessageRow(text, sender, isLoading = false) {
    const row = document.createElement("div");
    row.classList.add("chat-row", sender);

    const header = document.createElement("div");
    header.classList.add("row-header");
    const label = document.createElement("span");
    label.classList.add("author-label");
    label.textContent = sender === "user" ? "Pengguna" : "Asisten";
    header.appendChild(label);
    row.appendChild(header);

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    if (isLoading) {
        bubble.classList.add("loading");
        bubble.innerHTML = '<span class="stream-loading-dots" aria-label="Menunggu respons"><span></span><span></span><span></span></span>';
    } else {
        bubble.innerHTML = parseMarkdown(text);
    }

    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;

    return { rowEl: row, bubbleEl: bubble };
}

// Topic Cards click handler
if (starterChips) {
    starterChips.addEventListener("click", (e) => {
        const card = e.target.closest(".topic-card");
        if (card) {
            const prompt = card.getAttribute("data-prompt");
            if (prompt) {
                userInput.value = prompt;
                executeChatSubmit();
            }
        }
    });
}

// Auto-expand input
userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
});

// Keyboard submission
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        executeChatSubmit();
    }
});

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    executeChatSubmit();
});

async function executeChatSubmit() {
    const text = userInput.value.trim();
    if (!text) return;

    if (starterChips && starterChips.style.display !== "none") {
        starterChips.style.display = "none";
    }

    appendMessageRow(text, "user");
    messages.push({
        role: "user",
        content: text
    });

    userInput.value = "";
    userInput.style.height = "auto";
    userInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";

    const botMessage = appendMessageRow("", "bot", true);
    let fullResponse = "";
    let receivedToken = false;

    try {
        const model = modelSelect.value;
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: model
            })
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            throw new Error(errorPayload.error || `Server merespons kode status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split("\n");
            streamBuffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data:")) continue;

                const payload = trimmed.slice(5).trim();
                if (payload === "[DONE]") continue;

                try {
                    const token = JSON.parse(payload);
                    if (typeof token === "string" && token.length > 0) {
                        if (!receivedToken) {
                            botMessage.bubbleEl.classList.remove("loading");
                            receivedToken = true;
                        }

                        fullResponse += token;
                        botMessage.bubbleEl.innerHTML = parseMarkdown(fullResponse);
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                } catch (parseError) {
                    console.error("Gagal membaca payload stream:", parseError);
                }
            }
        }

        if (!receivedToken) {
            botMessage.bubbleEl.classList.remove("loading");
            botMessage.bubbleEl.classList.add("error-state");
            botMessage.bubbleEl.textContent = "Model tidak mengembalikan respons teks. Silakan ajukan ulang pertanyaan Anda.";
        } else {
            messages.push({
                role: "assistant",
                content: fullResponse
            });
        }
    } catch (err) {
        console.error("Kendala transmisi obrolan:", err);
        botMessage.bubbleEl.classList.remove("loading");
        botMessage.bubbleEl.classList.add("error-state");
        botMessage.bubbleEl.textContent = "Terjadi kesalahan: " + err.message;
    } finally {
        userInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim";
        userInput.focus();
    }
}

clearBtn.addEventListener("click", () => {
    messages = [];
    chatBox.innerHTML = `
        <div class="chat-row bot">
            <div class="row-header">
                <span class="author-label">Asisten</span>
            </div>
            <div class="message-bubble">
                Riwayat pesan telah dibersihkan. Anda dapat memulai sesi percakapan baru.
            </div>
        </div>
    `;

    if (starterChips) {
        starterChips.style.display = "block";
        chatBox.appendChild(starterChips);
    }

    userInput.focus();
});

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initModel();
    initNotes();
    initMobileNavigation();
});
