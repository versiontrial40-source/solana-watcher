import express from "express";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";

/* ========================
   EXPRESS SERVER (KEEP ALIVE)
======================== */
const app = express();

app.get("/", (req, res) => {
    res.send("Solana watcher is running 👀");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Server is running");
});

/* ========================
   ENV VARIABLES
======================== */
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

/* ========================
   SOLANA CONNECTION
======================== */
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const address = new PublicKey(WALLET_ADDRESS);

/* ========================
   DUPLICATE PROTECTION
======================== */
const seen = new Set();

/* ========================
   TELEGRAM FUNCTION
======================== */
async function sendMessage(text) {
    try {
        const now = Date.now();

        const res = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text
                })
            }
        );

        const data = await res.json();

        if (!data.ok) {
            console.log("Telegram error:", data);
        }

    } catch (err) {
        console.log("Send error:", err.message);

        // retry after 5 sec
        setTimeout(() => sendMessage(text), 5000);
    }
}

/* ========================
   SOLANA LISTENER
======================== */
connection.onLogs(address, async (logInfo) => {
    try {
        const sig = logInfo.signature;

        // prevent duplicates
        if (seen.has(sig)) return;
        seen.add(sig);

        console.log("🚨 Transaction:", sig);

        await sendMessage(
            `🚨 New transaction detected!\nhttps://solscan.io/tx/${sig}`
        );

    } catch (err) {
        console.log("Listener error:", err.message);
    }
});

/* ========================
   HEARTBEAT (RAILWAY STABILITY)
======================== */
setInterval(() => {
    console.log("💓 alive heartbeat");
}, 25000);

/* ========================
   CRASH PROTECTION
======================== */
process.on("uncaughtException", (err) => {
    console.log("CRASH FIX:", err.message);
});

process.on("unhandledRejection", (err) => {
    console.log("PROMISE ERROR:", err);
});

console.log("👀 Watching wallet...");
