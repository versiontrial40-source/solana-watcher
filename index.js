import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";

/* ========================
   ENV
======================== */
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

const GIST_ID = process.env.GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/* ========================
   SOLANA
======================== */
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const address = new PublicKey(WALLET_ADDRESS);

/* ========================
   GIST STATE
======================== */
async function getState() {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();

    const file = data.files["state.json"].content;
    return JSON.parse(file);
}

async function saveState(sig) {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
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
   TELEGRAM
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
   CORE CHECK
======================== */
async function checkOnce(state) {
    const sigs = await connection.getSignaturesForAddress(address, {
        limit: 5
    });

    if (!sigs.length) return state;

    const latest = sigs[0].signature;

    if (state.lastSig === latest) {
        console.log("No new tx");
        return state;
    }

    console.log("🚨 NEW TX:", latest);

    await sendMessage(
        `🚨 New Solana TX detected:\nhttps://solscan.io/tx/${latest}`
    );

    await saveState(latest);

    return { lastSig: latest };
}

/* ========================
   MAIN LOOP (FAST MODE)
======================== */
async function run() {
    let state = await getState();

    for (let i = 0; i < 6; i++) {
        state = await checkOnce(state);
        await new Promise(r => setTimeout(r, 10000)); // 10 sec
    }
}

run().catch(console.error);
