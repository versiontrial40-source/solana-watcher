import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

const RPC_URL = "https://api.mainnet-beta.solana.com";

/* ========================
   GIST STATE
======================== */
async function getState() {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    const data = await res.json();
    return JSON.parse(data.files["state.json"].content);
}

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
   SOLANA RPC (RAW)
======================== */
async function getSignatures() {
    const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getSignaturesForAddress",
            params: [WALLET_ADDRESS, { limit: 5 }]
        })
    });

    const data = await res.json();
    return data.result || [];
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
   MAIN
======================== */
async function run() {
    const state = await getState();
    const sigs = await getSignatures();

    if (!sigs.length) return;

    const latest = sigs[0].signature;

    if (state.lastSig === latest) {
        console.log("No new tx");
        return;
    }

    console.log("NEW TX:", latest);

    await sendMessage(
        `🚨 New Solana Transaction:\nhttps://solscan.io/tx/${latest}`
    );

    await saveState(latest);
}

run().catch(console.error);
