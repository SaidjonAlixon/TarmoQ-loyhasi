import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | {
    method: string;
    url?: string;
    body?: string;
  },
  options?: {
    method?: string;
    body?: unknown;
  }
): Promise<any> {
  let url: string;
  let method: string = 'GET';
  let data: any = undefined;

  // Handle both formats of parameters
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    if (options) {
      method = options.method || 'GET';
      data = options.body;
    }
  } else {
    url = urlOrOptions.url || '';
    method = urlOrOptions.method || 'GET';
    data = urlOrOptions.body;
  }

  console.log(`API Request: ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: typeof data === 'string' ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  try {
    const json = await res.json();
    return json;
  } catch (e) {
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
