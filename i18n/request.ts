import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * Resolve the active locale for this request.
 * Order matches mealprep_concept.md § Language preference:
 *   1. cookie `mealprep.lang` (set on first user choice)
 *   2. `users.preferred_language` (if logged in)
 *   3. Accept-Language header
 *   4. hard fallback: `de`
 */
async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('mealprep.lang')?.value;
  if (isLocale(fromCookie)) return fromCookie;

  // 2. users.preferred_language (if logged in)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .maybeSingle();
      if (isLocale(profile?.preferred_language)) return profile!.preferred_language as Locale;
    }
  } catch {
    // ignore — fall through to Accept-Language
  }

  // 3. Accept-Language
  const headerStore = await headers();
  const accept = headerStore.get('accept-language') ?? '';
  const ranked = accept
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';');
      const q = qPart && qPart.startsWith('q=') ? parseFloat(qPart.slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);
  if (ranked[0]?.tag.startsWith('en')) return 'en';

  // 4. hard fallback
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
