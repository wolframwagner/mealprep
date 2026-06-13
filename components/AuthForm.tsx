'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/supabase/auth';
import { useLocaleOverride } from './I18nProvider';

export function AuthForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { locale } = useLocaleOverride();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set('locale', locale);
    startTransition(async () => {
      const action = mode === 'signin' ? signIn : signUp;
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {mode === 'signup' && (
        <div>
          <label className="label" htmlFor="name">
            {tCommon('name')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="input"
            autoComplete="name"
            required
          />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          {tCommon('email')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {tCommon('password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {mode === 'signin' ? t('signInCta') : t('signUpCta')}
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode(mode === 'signin' ? 'signup' : 'signin');
        }}
        className="w-full text-sm text-gray-600 hover:text-gray-800"
      >
        {mode === 'signin' ? t('noAccount') : t('haveAccount')}
      </button>
    </form>
  );
}
