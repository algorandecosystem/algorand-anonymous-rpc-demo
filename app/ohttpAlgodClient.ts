// @ts-ignore – ohttp-js package.json exports field prevents normal resolution
import { Client, PublicKeyConfig } from "ohttp-js";
// @ts-ignore – no declaration file for this internal bundle path
import { CipherSuite, Kdf, Aead } from "../node_modules/ohttp-js/esm/deps/deno.land/x/hpke@v0.18.2/mod.js";
import type {
  BaseHTTPClient,
  BaseHTTPClientResponse,
  Query,
} from "../node_modules/algosdk/dist/types/client/baseHTTPClient";

const KEY_CONFIG_URL = "https://ohttp.nodely.io/ohttp-configs";
const RELAY_URL = "https://relay.oblivious.network/great-apple-60";

async function buildOhttpClient(): Promise<Client> {
  const configResp = await fetch(KEY_CONFIG_URL);
  if (!configResp.ok) {
    throw new Error(
      `Failed to fetch OHTTP key config: ${configResp.status} ${configResp.statusText}`
    );
  }
  const config = new Uint8Array(await configResp.arrayBuffer());
  const keyId = config[0];
  const kemId = (config[1] << 8) | config[2];
  const suite = new CipherSuite({ kem: kemId, kdf: Kdf.HkdfSha256, aead: Aead.Aes128Gcm });
  const kemContext = await suite.kemContext();
  const publicKey = await kemContext.deserializePublicKey(
    config.slice(3, 3 + suite.kemPublicKeySize)
  );
  const offset = 3 + suite.kemPublicKeySize + 2;
  const kdfId = (config[offset] << 8) | config[offset + 1];
  const aeadId = (config[offset + 2] << 8) | config[offset + 3];
  return new Client(new PublicKeyConfig(keyId, kemId, kdfId, aeadId, publicKey));
}

function buildUrl(
  baseServer: string,
  relativePath: string,
  query?: Query<string>
): string {
  const url = new URL(relativePath, baseServer);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function ohttpFetch(
  client: Client,
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: Uint8Array
): Promise<BaseHTTPClientResponse> {
  const init: RequestInit = { method, headers };
  if (body && body.length > 0) init.body = body.buffer as ArrayBuffer;

  const request = new Request(url, init);
  const ctx = await client.encapsulateRequest(request);
  const relayResp = await fetch(ctx.request.request(RELAY_URL));

  if (!relayResp.ok) {
    const errBody = new Uint8Array(await relayResp.arrayBuffer());
    const errHeaders: Record<string, string> = {};
    relayResp.headers.forEach((v: string, k: string) => { errHeaders[k] = v; });
    const error: { response: BaseHTTPClientResponse } = {
      response: { body: errBody, status: relayResp.status, headers: errHeaders },
    };
    throw error;
  }

  const response = await ctx.decapsulateResponse(relayResp);
  const responseBody = new Uint8Array(await response.arrayBuffer());
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((v: string, k: string) => { responseHeaders[k] = v; });

  if (response.status !== 200) {
    const error: { response: BaseHTTPClientResponse } = {
      response: { body: responseBody, status: response.status, headers: responseHeaders },
    };
    throw error;
  }

  return { body: responseBody, status: response.status, headers: responseHeaders };
}

export class OhttpAlgodHTTPClient implements BaseHTTPClient {
  private baseServer: string;
  private clientPromise: Promise<Client>;

  constructor(baseServer: string) {
    this.baseServer = baseServer.endsWith("/") ? baseServer : baseServer + "/";
    this.clientPromise = buildOhttpClient();
  }

  async get(
    relativePath: string,
    query?: Query<string>,
    requestHeaders?: Record<string, string>
  ): Promise<BaseHTTPClientResponse> {
    const client = await this.clientPromise;
    const url = buildUrl(this.baseServer, relativePath.replace(/^\//, ""), query);
    return ohttpFetch(client, url, "GET", requestHeaders ?? {});
  }

  async post(
    relativePath: string,
    data: Uint8Array,
    query?: Query<string>,
    requestHeaders?: Record<string, string>
  ): Promise<BaseHTTPClientResponse> {
    const client = await this.clientPromise;
    const url = buildUrl(this.baseServer, relativePath.replace(/^\//, ""), query);
    return ohttpFetch(client, url, "POST", requestHeaders ?? {}, data);
  }

  async delete(
    relativePath: string,
    data?: Uint8Array,
    query?: Query<string>,
    requestHeaders?: Record<string, string>
  ): Promise<BaseHTTPClientResponse> {
    const client = await this.clientPromise;
    const url = buildUrl(this.baseServer, relativePath.replace(/^\//, ""), query);
    return ohttpFetch(client, url, "DELETE", requestHeaders ?? {}, data);
  }
}
