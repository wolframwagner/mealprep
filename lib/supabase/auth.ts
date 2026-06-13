/**
 * Auth helpers for Supabase email + password auth.
 * Server actions for sign in / sign up / sign out.
 */
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createSupabaseServer } from './server';
import { isLocale, type Locale } from '@/i18n/config';

async function setLocaleCookie(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set('mealprep.lang', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const locale = isLocale(String(formData.get('locale') ?? ''))
    ? (String(formData.get('locale')) as Locale)
    : null;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  if (locale) await setLocaleCookie(locale);
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const locale = isLocale(String(formData.get('locale') ?? ''))
    ? (String(formData.get('locale')) as Locale)
    : null;

  if (password.length < 8) return { error: 'weakPassword' as const };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'unknown' };

  // Sync the profile row with the language preference if the user picked one.
  if (locale) {
    await setLocaleCookie(locale);
    await supabase
      .from('profiles')
      .update({ preferred_language: locale, name })
      .eq('id', data.user.id);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function updateLanguage(locale: Locale) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').update({ preferred_language: locale }).eq('id', user.id);
  }
  await setLocaleCookie(locale);
  revalidatePath('/', 'layout');
}
