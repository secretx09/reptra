import { Database } from '../types/supabase';
import { getCurrentUser } from './auth';
import { getSupabaseClient } from './supabase';

export type CloudProfile = Database['public']['Tables']['profiles']['Row'];

export interface CloudProfileResult {
  ok: boolean;
  message: string;
  profile: CloudProfile | null;
}

export interface UsernameAvailabilityResult {
  ok: boolean;
  available: boolean;
  message: string;
}

const usernamePattern = /^[a-z0-9_]{3,24}$/;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function getProfileErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('duplicate') || lowerMessage.includes('unique')) {
    return 'That username is already taken. Try a different one.';
  }

  if (lowerMessage.includes('row-level security')) {
    return 'Supabase blocked this profile request. Re-run the latest schema.sql policies if you added username checks.';
  }

  return message;
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
  username: string,
  bio = '',
  trainingFocus = ''
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
  const cleanUsername = normalizeUsername(username);
  const cleanBio = bio.trim();
  const cleanTrainingFocus = trainingFocus.trim();

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
      bio: cleanBio || null,
      display_name: cleanDisplayName || null,
      training_focus: cleanTrainingFocus || null,
      username: cleanUsername || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return {
      ok: false,
      message: getProfileErrorMessage(error.message),
      profile: null,
    };
  }

  return {
    ok: true,
    message: 'Cloud profile updated.',
    profile: data,
  };
}

export async function checkUsernameAvailability(
  username: string
): Promise<UsernameAvailabilityResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      available: false,
      message: 'Supabase is not configured yet.',
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      available: false,
      message: 'Sign in before checking a username.',
    };
  }

  const cleanUsername = normalizeUsername(username);

  if (!cleanUsername) {
    return {
      ok: false,
      available: false,
      message: 'Enter a username first.',
    };
  }

  if (!usernamePattern.test(cleanUsername)) {
    return {
      ok: false,
      available: false,
      message:
        'Username must be 3-24 characters using letters, numbers, or underscores.',
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      available: false,
      message: getProfileErrorMessage(error.message),
    };
  }

  if (!data || data.id === user.id) {
    return {
      ok: true,
      available: true,
      message: `@${cleanUsername} is available.`,
    };
  }

  return {
    ok: true,
    available: false,
    message: `@${cleanUsername} is already taken.`,
  };
}
