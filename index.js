import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.send("Solana watcher is running 👀");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Server is running");
});
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const address = new PublicKey(process.env.WALLET_ADDRESS);

// Send Telegram message
async function sendMessage(text) {
    try {
        const res = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text
                }),
                timeout: 10000
            }
        );

        if (!res.ok) {
            console.log("Telegram error:", await res.text());
        }

    } catch (err) {
        console.log("Failed to send message, retrying...", err.message);

        // simple retry
        setTimeout(() => {
            sendMessage(text);
        }, 5000);
    }
}
// Listen for transactions
connection.onLogs(address, async (logInfo) => {
    console.log("New transaction:", logInfo.signature);

    await sendMessage(
        `🚨 New transaction detected!\nhttps://solscan.io/tx/${logInfo.signature}`
    );
}, "confirmed");

console.log("👀 Watching wallet...");
