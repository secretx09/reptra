import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
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

export interface ParsedAuthLink {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: string | null;
  error: string | null;
  errorDescription: string | null;
}

export function getProductionAuthRedirectUrl() {
  return 'reptra://auth/callback';
}

export function getExpoGoAuthRedirectUrl() {
  return Linking.createURL('auth/callback');
}

export function getAuthRedirectUrl() {
  const configuredRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;

  if (configuredRedirectUrl) {
    return configuredRedirectUrl;
  }

  if (Constants.appOwnership === 'expo') {
    return getExpoGoAuthRedirectUrl();
  }

  return getProductionAuthRedirectUrl();
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

function getQueryPartsFromUrl(url: string) {
  const parts: string[] = [];
  const queryStart = url.indexOf('?');
  const hashStart = url.indexOf('#');

  if (queryStart >= 0) {
    const queryEnd = hashStart >= 0 ? hashStart : url.length;
    parts.push(url.slice(queryStart + 1, queryEnd));
  }

  if (hashStart >= 0) {
    parts.push(url.slice(hashStart + 1));
  }

  return parts.filter(Boolean);
}

function readUrlParam(url: string, key: string) {
  for (const part of getQueryPartsFromUrl(url)) {
    const params = new URLSearchParams(part);
    const value = params.get(key);

    if (value) {
      return value;
    }
  }

  return null;
}

export function parseAuthLink(url: string): ParsedAuthLink {
  const trimmedUrl = url.trim();

  return {
    code: readUrlParam(trimmedUrl, 'code'),
    accessToken: readUrlParam(trimmedUrl, 'access_token'),
    refreshToken: readUrlParam(trimmedUrl, 'refresh_token'),
    tokenHash:
      readUrlParam(trimmedUrl, 'token_hash') ?? readUrlParam(trimmedUrl, 'token'),
    type: readUrlParam(trimmedUrl, 'type'),
    error: readUrlParam(trimmedUrl, 'error'),
    errorDescription:
      readUrlParam(trimmedUrl, 'error_description') ??
      readUrlParam(trimmedUrl, 'errorDescription'),
  };
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
        : 'Account created. Check your email if confirmation is enabled. Expo Go links only work on devices with Expo Go; production builds use the reptra:// callback.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function resendConfirmationEmail(
  email: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message:
        'Confirmation email sent. Expo Go links only work on devices with Expo Go; production builds use the reptra:// callback.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function sendPasswordResetEmail(
  email: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl(),
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: true,
      message:
        'Password reset email sent. Open the link, return to Reptra, then set a new password while signed in. Expo Go links only work on devices with Expo Go.',
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
      message: 'Auth link confirmed and account session restored.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function exchangeAuthLinkForSession(
  authLink: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
    };
  }

  const parsedLink = parseAuthLink(authLink);

  if (parsedLink.error || parsedLink.errorDescription) {
    return {
      ok: false,
      message:
        parsedLink.errorDescription ??
        parsedLink.error ??
        'Supabase returned an auth link error.',
    };
  }

  if (parsedLink.code) {
    return exchangeAuthCodeForSession(parsedLink.code);
  }

  if (parsedLink.accessToken && parsedLink.refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: parsedLink.accessToken,
        refresh_token: parsedLink.refreshToken,
      });

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }

      return {
        ok: true,
        message: 'Auth link confirmed and account session restored.',
      };
    } catch (error) {
      return {
        ok: false,
        message: getAuthErrorMessage(error),
      };
    }
  }

  if (parsedLink.tokenHash && parsedLink.type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: parsedLink.tokenHash,
        type: parsedLink.type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
      });

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }

      return {
        ok: true,
        message: 'Auth link confirmed and account session restored.',
      };
    } catch (error) {
      return {
        ok: false,
        message: getAuthErrorMessage(error),
      };
    }
  }

  return {
    ok: false,
    message:
      'No usable auth code was found in that link. Try copying the full email link, including everything after ? or #.',
  };
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

export async function updateCurrentUserPassword(
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
    const { error } = await supabase.auth.updateUser({
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
      message: 'Password updated successfully.',
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
