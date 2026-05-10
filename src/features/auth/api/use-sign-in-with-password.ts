import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionKeys } from './use-session';
import type { SignInValues } from '../schemas/sign-in-schema';

export const useSignInWithPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SignInValues) => {
      const { data, error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current });
    },
  });
};
