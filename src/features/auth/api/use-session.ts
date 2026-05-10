import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const sessionKeys = {
  current: ['session'] as const,
};

export const useSession = () => {
  return useQuery({
    queryKey: sessionKeys.current,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });
};
