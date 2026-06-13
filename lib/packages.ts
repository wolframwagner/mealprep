import type { I18nString } from './supabase/types';

export type PackUnit =
  | 'pack'
  | 'can'
  | 'jar'
  | 'bottle'
  | 'bag'
  | 'piece'
  | 'bunch'
  | 'block'
  | 'tub';

export type PackInfo = {
  size_g: number;
  unit: PackUnit;
};

export type PackBreakdown = {
  count: number;
  unit: PackUnit;
  size_g: number;
  total_g: number;
};

type PackMap = Record<string, PackInfo>;

const DENNS: PackMap = {
  Naturtofu: { size_g: 200, unit: 'block' },
  Räuchertofu: { size_g: 200, unit: 'block' },
  Seitan: { size_g: 200, unit: 'block' },
  Sojagranulat: { size_g: 250, unit: 'bag' },
  'Edamame (TK)': { size_g: 500, unit: 'bag' },
  Tahini: { size_g: 350, unit: 'jar' },
  Sojasauce: { size_g: 250, unit: 'bottle' },
  'Mie-Nudeln': { size_g: 250, unit: 'pack' },
  Sesamöl: { size_g: 250, unit: 'bottle' },
  Erdnussmus: { size_g: 350, unit: 'jar' },
  Sesam: { size_g: 250, unit: 'bag' },
};

const REWE: PackMap = {
  'Tomaten (Dose)': { size_g: 400, unit: 'can' },
  'Schwarze Bohnen (Dose)': { size_g: 400, unit: 'can' },
  'Weiße Bohnen (Dose)': { size_g: 400, unit: 'can' },
  'Mais (Dose)': { size_g: 285, unit: 'can' },
  'Basmati-Reis': { size_g: 1000, unit: 'bag' },
  Reis: { size_g: 1000, unit: 'bag' },
  Bulgur: { size_g: 500, unit: 'pack' },
  'Rote Linsen': { size_g: 500, unit: 'pack' },
  'Gelbe Linsen': { size_g: 500, unit: 'pack' },
  Olivenöl: { size_g: 500, unit: 'bottle' },
  Pflanzenmargarine: { size_g: 250, unit: 'tub' },
  Senf: { size_g: 200, unit: 'jar' },
  Avocado: { size_g: 200, unit: 'piece' },
  Zitrone: { size_g: 100, unit: 'piece' },
  Limette: { size_g: 70, unit: 'piece' },
  Paprika: { size_g: 200, unit: 'piece' },
  Gurke: { size_g: 400, unit: 'piece' },
  Zucchini: { size_g: 200, unit: 'piece' },
  Lauch: { size_g: 200, unit: 'piece' },
  'Pak Choi': { size_g: 200, unit: 'piece' },
  Brokkoli: { size_g: 500, unit: 'piece' },
  Knoblauch: { size_g: 30, unit: 'piece' },
  Kirschtomaten: { size_g: 250, unit: 'pack' },
  Spinat: { size_g: 200, unit: 'bag' },
  Karotten: { size_g: 500, unit: 'bag' },
  Koriander: { size_g: 20, unit: 'bunch' },
  Minze: { size_g: 20, unit: 'bunch' },
  'Garam Masala': { size_g: 50, unit: 'jar' },
};

const PACKS: Record<'denns' | 'rewe', PackMap> = {
  denns: DENNS,
  rewe: REWE,
};

export function packFor(
  store: 'denns' | 'rewe',
  name: I18nString,
): PackInfo | null {
  return PACKS[store][name.de] ?? null;
}

export function breakdown(
  store: 'denns' | 'rewe',
  name: I18nString,
  amount_g: number,
): PackBreakdown | null {
  const pack = packFor(store, name);
  if (!pack) return null;
  const count = Math.max(1, Math.ceil(amount_g / pack.size_g));
  return {
    count,
    unit: pack.unit,
    size_g: pack.size_g,
    total_g: count * pack.size_g,
  };
}
