const express = require("express");
const dotenv = require("dotenv");


dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));


app.get("/", (req, res) => {
    res.redirect("/index.html");
});

app.post("/api/chat", async (req, res) => {
    try {
        const messages = req.body.messages;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: "Messages harus berupa array"
            })
        }

        const modelsToTry = [
            process.env.MODEL || "inclusionai/ling-3.2-flash:free",
            "liquid/lfm-3-1.7b:free",
            "baidu/ernie-5.5-flash-preview:free",
            "nvidia/nemotron-3.5-lightning:free"
        ];

        let response = null;
        let lastErrorText = "";

        for (const model of modelsToTry) {
            response = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 1000,
                        stream: true
                    })
                }
            );

            if (response.ok) {
                break;
            }

            lastErrorText = await response.text();
            console.warn(`Model ${model} gagal (${response.status}):`, lastErrorText);

            const isRetryable =
                response.status === 429 ||
                response.status >= 500 ||
                lastErrorText.includes("Provider returned error") ||
                lastErrorText.includes("rate-limited");

            if (!isRetryable) {
                break;
            }
        }

        if (!response || !response.ok) {
            console.error("Semua model gagal merespons:", lastErrorText);
            let errorMessage = "Layanan AI sedang sibuk. Silakan coba sesaat lagi.";
            try {
                const parsed = JSON.parse(lastErrorText);
                if (parsed.error?.metadata?.raw) {
                    errorMessage = parsed.error.metadata.raw;
                } else if (parsed.error?.message) {
                    errorMessage = parsed.error.message;
                }
            } catch (e) {}

            return res.status(response ? response.status : 500).json({
                error: errorMessage
            });
        }

        // Header untuk streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
                stream: true
            });

            const lines = buffer.split("\n");

            // simpan bagian terakhir karena mungkin belum lengkap
            buffer = lines.pop();

            for (const line of lines) {
                const trimmedLine = line.trim();

                if (!trimmedLine) continue;
                if (!trimmedLine.startsWith("data:")) continue;
                const data = trimmedLine.slice(5).trim();
                if (data === "[DONE]") continue;

                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;

                    if (content) res.write(`data: ${JSON.stringify(content)}\n\n`);
                } catch (err) {
                    console.error("Gagal parsing streaming data:", err);
                }
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        console.error("Server Error: ", err);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Terjadi kesalahan pada server"
            });
        } else {
            res.write(
                `data: ${JSON.stringify(
                    "Terjadi kesalahan pada server"
                )}\n\n`
            );

            res.end();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
})