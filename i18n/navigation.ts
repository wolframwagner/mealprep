import { createNavigation } from 'next-intl/navigation';
import { LOCALES } from './config';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({ locales: LOCALES, localePrefix: 'never' });
