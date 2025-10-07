import { createClient } from '@supabase/supabase-js'
import type { User } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Please check your .env file.");
}

// Criando o tipo para o banco de dados (opcional, mas recomendado)
// Você pode gerar isso automaticamente com o Supabase CLI no futuro.
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id'>;
        Update: Partial<User>;
      };
      // Adicione outras tabelas aqui conforme você as cria no Supabase
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
