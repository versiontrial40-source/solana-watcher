import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const address = new PublicKey(process.env.WALLET_ADDRESS);

// Send Telegram message
async function sendMessage(text) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text
        })
    });
}

// Listen for transactions
connection.onLogs(address, async (logInfo) => {
    console.log("New transaction:", logInfo.signature);

    await sendMessage(
        `🚨 New transaction detected!\nhttps://solscan.io/tx/${logInfo.signature}`
    );
}, "confirmed");

console.log("👀 Watching wallet...");