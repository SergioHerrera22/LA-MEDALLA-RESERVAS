import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      "Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
};
