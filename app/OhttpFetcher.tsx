"use client";

import { useState } from "react";
import { Algodv2 } from "algosdk";
import { OhttpAlgodHTTPClient } from "./ohttpAlgodClient";

const ALGOD_BASE_URL = "http://testnet-api.4160.nodely.dev";

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
      const httpClient = new OhttpAlgodHTTPClient(ALGOD_BASE_URL);
      const algod = new Algodv2(httpClient, ALGOD_BASE_URL);
      const nodeStatus = await algod.status().do();

      setResult(nodeStatus);
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
            {JSON.stringify(result, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
