import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useProtectedRoute(): AuthStatus {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  // Sincronizar o status da sessão do Better Auth com o nosso estado local
  useEffect(() => {
    if (isPending) {
      setAuthStatus('loading');
    } else if (session) {
      setAuthStatus('authenticated');
    } else {
      setAuthStatus('unauthenticated');
    }
  }, [session, isPending]);

  // Efeito separado para o redirecionamento para evitar problemas de estados durante a renderização
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [authStatus, router]);

  return authStatus;
} 