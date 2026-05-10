import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SignUpValues } from '../schemas/sign-up-schema';

export const useSignUp = () => {
  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const { data, error } = await supabase.auth.signUp(values);
      if (error) throw error;
      return data;
    },
  });
};
