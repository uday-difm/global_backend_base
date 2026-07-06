import { proxy, config as proxyConfig } from "./proxy";

export async function middleware(request) {
  return proxy(request);
}

export const config = proxyConfig;
