export type I18nString = { de: string; en: string };

export type Week = {
  id: string;
  week_number: number;
  theme_i18n: I18nString;
  protein_base_i18n: I18nString;
  carb_base_i18n: I18nString;
  protein_g: number;
  kcal: number;
  budget_eur: number;
};

export type WeekIngredient = {
  id: string;
  week_id: string;
  ingredient_name_i18n: I18nString;
  amount_g: number;
  category_i18n: I18nString;
  protein_per_100g: number;
  kcal_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
};

export type Sauce = {
  id: string;
  week_id: string;
  name_i18n: I18nString;
  recipe: { de: string[]; en: string[] };
  day_of_week: number;
};

export type ShoppingItem = {
  ingredient_name_i18n: I18nString;
  category_i18n: I18nString;
  amount_g: number;
};

export type ShoppingList = {
  id: string;
  week_id: string;
  store: 'denns' | 'rewe';
  items: ShoppingItem[];
};

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  preferred_language: 'en' | 'de' | null;
};

export type UserProgress = {
  id: string;
  user_id: string;
  week_id: string;
  day_offset: number;
  completed_ingredients: Record<string, boolean>;
  ist_quantities: Record<string, number>;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      weeks: { Row: Week; Insert: Omit<Week, 'id'> & { id?: string }; Update: Partial<Week> };
      week_ingredients: {
        Row: WeekIngredient;
        Insert: Omit<WeekIngredient, 'id'> & { id?: string };
        Update: Partial<WeekIngredient>;
      };
      sauces: { Row: Sauce; Insert: Omit<Sauce, 'id'> & { id?: string }; Update: Partial<Sauce> };
      shopping_lists: {
        Row: ShoppingList;
        Insert: Omit<ShoppingList, 'id'> & { id?: string };
        Update: Partial<ShoppingList>;
      };
      profiles: { Row: Profile; Insert: Profile; Update: Partial<Profile> };
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<UserProgress>;
      };
    };
  };
};
