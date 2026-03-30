"use client";

import { useState } from "react";
import { Client, PublicKeyConfig } from "ohttp-js";
// CipherSuite is not re-exported by ohttp-js (exports field restricts subpaths),
// so we import it from the hpke bundle it ships internally.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – no declaration file for this internal bundle path
import { CipherSuite, Kdf, Aead } from "../node_modules/ohttp-js/esm/deps/deno.land/x/hpke@v0.18.2/mod.js";


// Workaround for missing export in ohttp-js
async function clientForConfig(config: Uint8Array): Promise<Client> {
  const keyId = config[0];
  const kemId = (config[1] << 8) | config[2];
  const suite = new CipherSuite({ kem: kemId, kdf: Kdf.HkdfSha256, aead: Aead.Aes128Gcm });
  const kemContext = await suite.kemContext();
  const publicKey = await kemContext.deserializePublicKey(config.slice(3, 3 + suite.kemPublicKeySize));
  const offset = 3 + suite.kemPublicKeySize + 2;
  const kdfId = (config[offset] << 8) | config[offset + 1];
  const aeadId = (config[offset + 2] << 8) | config[offset + 3];
  return new Client(new PublicKeyConfig(keyId, kemId, kdfId, aeadId, publicKey));
}

const KEY_CONFIG_URL = "https://ohttp.nodely.io/ohttp-configs";
const RELAY_URL = "https://relay.oblivious.network/great-apple-60";
const TARGET_URL = "http://testnet-api.4160.nodely.dev/v2/status";

type Status = "idle" | "loading" | "success" | "error";

export default function OhttpFetcher() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string>("");

  async function fetchViaOhttp() {
    setStatus("loading");
    setResult(null);
    setError("");

    try {
      const configResp = await fetch(KEY_CONFIG_URL);
      if (!configResp.ok) {
        throw new Error(`Failed to fetch key config: ${configResp.status} ${configResp.statusText}`);
      }
      const configBytes = new Uint8Array(await configResp.arrayBuffer());

      const client = await clientForConfig(configBytes);

      const request = new Request(TARGET_URL);
      const ctx = await client.encapsulateRequest(request);

      const relayRequest = ctx.request.request(RELAY_URL);
      const relayResp = await fetch(relayRequest);
      if (!relayResp.ok) {
        throw new Error(`Relay error: ${relayResp.status} ${relayResp.statusText}`);
      }

      const response = await ctx.decapsulateResponse(relayResp);
      const json = await response.json();

      setResult(json);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Algorand Testnet Status
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fetched via Oblivious HTTP &mdash; your IP is hidden from the API server
        </p>
      </div>

      <button
        onClick={fetchViaOhttp}
        disabled={status === "loading"}
        className="px-6 py-3 rounded-full bg-zinc-900 text-white font-medium text-sm
          hover:bg-zinc-700 active:bg-zinc-800 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {status === "loading" ? "Fetching..." : "Fetch Status"}
      </button>

      {status === "error" && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300 font-mono break-all">{error}</p>
        </div>
      )}

      {status === "success" && result !== null && (
        <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-auto">
          <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Response
            </span>
          </div>
          <pre className="p-4 text-sm text-zinc-800 dark:text-zinc-200 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
