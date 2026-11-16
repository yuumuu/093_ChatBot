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

        const response = await fetch(
            "httpsL//openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: "inclusionai/ling-3.2-flash:free",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: true
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error("OpenRouter Error: ", errorData);

            return res.status(response.status).json({
                error: errorData
            });
        }

        // Header untuk streaming
        res.setHeader("Content-Type", "text-event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, {
                strea: true
            });

            const lines = buffer.split("\n");

            // simpan bagian terakhir karena mungkin belum lengkap
            buffer = lines.pop();
        }
    } catch (err) {

    }
});