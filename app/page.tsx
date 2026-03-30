import DynamicOhttp from "./DynamicOhttp";

function OhttpDiagram() {
  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-4 text-center">
        How it works
      </h2>

      {/* Flow diagram */}
      <div className="flex flex-col gap-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
        {/* Row 1: nodes */}
        <div className="grid grid-cols-5 items-center text-center gap-1">
          <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-2 py-2 col-span-1">
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] mb-0.5">your browser</div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">Client</div>
          </div>
          <div className="col-span-1 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-zinc-400">encrypted</span>
            <span className="text-zinc-400">──────&gt;</span>
          </div>
          <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-2 col-span-1">
            <div className="text-amber-500 text-[10px] mb-0.5">oblivious.network</div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">Fastly Relays</div>
          </div>
          <div className="col-span-1 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-zinc-400">forwarded</span>
            <span className="text-zinc-400">──────&gt;</span>
          </div>
          <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 px-2 py-2 col-span-1">
            <div className="text-blue-500 text-[10px] mb-0.5">nodely.io</div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">Gateways</div>
          </div>
        </div>

        {/* Row 2: return arrows */}
        <div className="grid grid-cols-5 items-center text-center gap-1">
          <div className="col-span-1" />
          <div className="col-span-1 flex flex-col items-center gap-0.5">
            <span className="text-zinc-400">&lt;──────</span>
            <span className="text-[10px] text-zinc-400">encrypted</span>
          </div>
          <div className="col-span-1" />
          <div className="col-span-1 flex flex-col items-center gap-0.5">
            <span className="text-zinc-400">&lt;──────</span>
            <span className="text-[10px] text-zinc-400">forwarded</span>
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <span className="text-zinc-400 text-[10px]">↕</span>
          </div>
        </div>

        {/* Row 3: algod node */}
        <div className="grid grid-cols-5 items-center text-center gap-1">
          <div className="col-span-4" />
          <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 px-2 py-2 col-span-1">
            <div className="text-green-500 text-[10px] mb-0.5">nodely.io/dev</div>
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">Algorand RPCs</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <ul className="mt-5 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 list-none">
        <li>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">1. Encrypt &amp; encapsulate</span>
          {" "}— the SDK request is wrapped in an HPKE-encrypted OHTTP message using the gateway&apos;s public key. The relay never sees the plaintext.
        </li>
        <li>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">2. Relay forwards</span>
          {" "}— the relay passes the opaque blob to the gateway. It only knows your IP, not what you are querying. To add extra separation, relays are operated by a 3rd party.
        </li>
        <li>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">3. Gateway decrypts &amp; proxies</span>
          {" "}— the gateway decrypts the message and calls algod on your behalf. It sees the query but not your IP.
        </li>
        <li>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">4. Response re-encrypted</span>
          {" "}— the reply travels back through the relay, still encrypted, and is decrypted only in your browser.
        </li>
        <li>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">5. Low traffic service</span>
          {" "}— the service is optimized for low volume but sensitive traffic - eg mobile/web wallets
        </li>
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 py-16 gap-16">
      <DynamicOhttp />
      <OhttpDiagram />
    </main>
  );
}
