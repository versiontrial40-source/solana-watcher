import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";

/* ========================
   ENV VARIABLES (IMPORTANT)
======================== */
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

/* ========================
   SOLANA CONNECTION
======================== */
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const address = new PublicKey(WALLET_ADDRESS);

/* ========================
   GET STATE FROM GIST
======================== */
async function getState() {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();

    const file = data.files["state.json"].content;
    return JSON.parse(file);
}

/* ========================
   SAVE STATE TO GIST
======================== */
async function saveState(sig) {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${GH_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            files: {
                "state.json": {
                    content: JSON.stringify({ lastSig: sig })
                }
            }
        })
    });
}

/* ========================
   TELEGRAM MESSAGE
======================== */
async function sendMessage(text) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text
        })
    });
}

/* ========================
   CHECK TRANSACTIONS
======================== */
async function run() {
    const state = await getState();

    const sigs = await connection.getSignaturesForAddress(address, {
        limit: 5
    });

    if (!sigs.length) return;

    const latest = sigs[0].signature;

    if (state.lastSig === latest) {
        console.log("No new transaction");
        return;
    }

    console.log("🚨 NEW TX:", latest);

    await sendMessage(
        `🚨 New Solana Transaction:\nhttps://solscan.io/tx/${latest}`
    );

    await saveState(latest);
}

run().catch(console.error);
