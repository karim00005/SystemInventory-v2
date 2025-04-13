import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Base URL for the API
export const API_BASE_URL = "http://localhost:5000";

// Utility function to get the full URL for API requests with cache busting
export function getFullApiUrl(url: string): string {
  // Add timestamp parameter only when necessary
  if (url.startsWith('http')) {
    return url;
  }
  
  return `${API_BASE_URL}${url}`;
}

// Check if response is OK and throw error if not
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(`${res.status}: ${errorData.message || res.statusText}`);
    } catch (e) {
      const text = await res.text() || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
  retries = 1
): Promise<any> {
  try {
    // Get the full URL for the API request
    const fullUrl = getFullApiUrl(url);
    
    const headers = {
      "Content-Type": "application/json", 
      "Accept": "application/json",
      "Cache-Control": "no-cache"
    };
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // Check if response is HTML (which would indicate a problem)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error(`API Error: Received HTML response instead of JSON`);
    }
    
    await throwIfResNotOk(res);
    if (res.status === 204) {
      // No content
      return null;
    }
    
    return await res.json();
  } catch (error) {
    if (retries > 0 && (
      error instanceof TypeError || // Network error
      (error instanceof Error && error.message.startsWith('5')) // 5xx error
    )) {
      // Wait for a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 300));
      return apiRequest(url, method, data, retries - 1);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const fullUrl = getFullApiUrl(queryKey[0] as string);
      
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 60 seconds instead of 5 seconds
      retry: 1,
      retryDelay: 1000,
      networkMode: 'offlineFirst',
      gcTime: 300000, // 5 minutes 
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst'
    },
  },
});
