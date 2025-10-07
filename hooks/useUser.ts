import { useQuery } from '@tanstack/react-query';
import { getMyInfo } from './newUser';

export const useUser = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMyInfo,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
