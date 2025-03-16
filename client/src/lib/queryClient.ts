import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type ApiRequestOptions = {
  url: string;
  method: string;
  data?: unknown;
};

export async function apiRequest(
  options: ApiRequestOptions | string,
  method?: string,
  data?: unknown | undefined,
): Promise<Response> {
  let url, requestMethod, requestData;
  
  // Handle both styles of calling the function
  if (typeof options === 'object') {
    url = options.url;
    requestMethod = options.method;
    requestData = options.data;
  } else {
    url = options;
    requestMethod = method!;
    requestData = data;
  }
  
  const res = await fetch(url, {
    method: requestMethod,
    headers: requestData ? { "Content-Type": "application/json" } : {},
    body: requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});