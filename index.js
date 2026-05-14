import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";
import fs from "fs";

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
   STATE STORAGE (IMPORTANT)
======================== */
const STATE_FILE = "state.json";

function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    } catch {
        return { lastSig: null };
    }
}

function saveState(sig) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastSig: sig }));
}

/* ========================
   TELEGRAM
======================== */
async function sendMessage(text) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text
            })
        });
    } catch (err) {
        console.log("Telegram error:", err.message);
    }
}

/* ========================
   MAIN CHECK FUNCTION
======================== */
async function checkTransactions() {
    const state = loadState();

    const signatures = await connection.getSignaturesForAddress(address, {
        limit: 5
    });

    if (!signatures || signatures.length === 0) return;

    const latest = signatures[0].signature;

    // no new tx
    if (state.lastSig === latest) {
        console.log("No new transactions");
        return;
    }

    console.log("🚨 New transaction detected:", latest);

    await sendMessage(
        `🚨 New Solana transaction:\nhttps://solscan.io/tx/${latest}`
    );

    saveState(latest);
}

/* ========================
   RUN
======================== */
checkTransactions().catch(console.error);
