import { Database } from '../types/supabase';
import { getCurrentUser } from './auth';
import { getSupabaseClient } from './supabase';

export type CloudProfile = Database['public']['Tables']['profiles']['Row'];

export interface CloudProfileResult {
  ok: boolean;
  message: string;
  profile: CloudProfile | null;
}

export async function getCloudProfile(): Promise<CloudProfileResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
      profile: null,
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: 'Sign in before loading your cloud profile.',
      profile: null,
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
      profile: null,
    };
  }

  if (data) {
    return {
      ok: true,
      message: 'Cloud profile loaded.',
      profile: data,
    };
  }

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: user.user_metadata?.display_name ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (createError) {
    return {
      ok: false,
      message: createError.message,
      profile: null,
    };
  }

  return {
    ok: true,
    message: 'Cloud profile created.',
    profile: createdProfile,
  };
}

export async function updateCloudProfile(
  displayName: string,
  username: string
): Promise<CloudProfileResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured yet.',
      profile: null,
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: 'Sign in before updating your cloud profile.',
      profile: null,
    };
  }

  const cleanDisplayName = displayName.trim();
  const cleanUsername = username.trim().toLowerCase();
  const usernamePattern = /^[a-z0-9_]{3,24}$/;

  if (cleanUsername && !usernamePattern.test(cleanUsername)) {
    return {
      ok: false,
      message: 'Username must be 3-24 characters using letters, numbers, or underscores.',
      profile: null,
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: cleanDisplayName || null,
      username: cleanUsername || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message,
      profile: null,
    };
  }

  return {
    ok: true,
    message: 'Cloud profile updated.',
    profile: data,
  };
}
