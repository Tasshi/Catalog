import { useSession } from './use-session';

export const useCurrentUser = () => {
  const { data: session, ...rest } = useSession();
  return { user: session?.user ?? null, ...rest };
};
