import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useSignInWithGoogle = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return data;
    },
  });
};
