import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { AuthForm } from '@/components/AuthForm';
import { LanguagePrompt } from '@/components/LanguagePrompt';

export default async function LoginPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

  const t = await getTranslations('auth');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="card space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-brand-800">{t('title')}</h1>
        <p className="text-sm text-gray-600">{t('subtitle')}</p>
      </div>
      <div className="card mt-4">
        <AuthForm />
      </div>
      <LanguagePrompt />
    </main>
  );
}
