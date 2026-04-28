import * as Linking from 'expo-linking';
import {
  getSupabaseAnonKey,
  getSupabaseClient,
  getSupabaseUrl,
  isSupabaseConfigured,
} from './supabase';

export interface AuthResult {
  ok: boolean;
  message: string;
}

export function getAuthRedirectUrl() {
  return Linking.createURL('auth/callback');
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('network request failed')) {
      return 'Network request failed. Check emulator/device internet, your Supabase URL, and that the URL does not include /rest/v1.';
    }

    return error.message;
  }

  return 'Something went wrong while contacting Supabase.';
}

export async function testSupabaseConnection(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: supabaseAnonKey as string,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Supabase responded with ${response.status}. Check the project URL and publishable key.`,
      };
    }

    return {
      ok: true,
      message: 'Supabase connection is reachable from this device.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return null;
    }

    return data.session;
  } catch {
    return null;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          display_name: displayName?.trim() || null,
        },
      },
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName?.trim() || null,
        updated_at: new Date().toISOString(),
      });
    }

    return {
      ok: true,
      message: data.session
        ? 'Account created and signed in.'
        : 'Account created. Check your email if confirmation is enabled.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function exchangeAuthCodeForSession(
  code: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message: 'Email confirmed and account session restored.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message: 'Signed in successfully.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message: 'Signed out successfully.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}
