import { supabase } from './supabase';

/**
 * Get the current access token from Supabase session
 * Automatically refreshes if expired
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Get session from Supabase (this handles token refresh automatically)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      localStorage.removeItem('supabase.auth.token');
      return null;
    }

    if (session?.access_token) {
      // Update localStorage with fresh token
      localStorage.setItem('supabase.auth.token', session.access_token);
      return session.access_token;
    }

    // No session found
    localStorage.removeItem('supabase.auth.token');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Get auth headers for API calls
 * Automatically refreshes token if needed
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

/**
 * Make an authenticated fetch request
 * Automatically handles token refresh on 401 errors
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // If we get a 401, try refreshing the token and retry once
  if (response.status === 401) {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.access_token) {
        localStorage.setItem('supabase.auth.token', session.access_token);
        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
    }
  }

  return response;
}
