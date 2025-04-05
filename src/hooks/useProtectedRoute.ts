import { useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Função auxiliar para verificar a sessão
async function checkClientSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const session = await response.json();
      return !!session && !!session.user;
    }
    return false;
  } catch (error) {
    console.error("Error checking client session:", error);
    return false;
  }
}

export function useProtectedRoute(): AuthStatus {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useLayoutEffect(() => {
    let isMounted = true; // Flag para evitar atualizações em componente desmontado

    const verifySession = async () => {
      const isAuthenticated = await checkClientSession();

      if (isMounted) {
        if (!isAuthenticated) {
          setAuthStatus('unauthenticated');
          router.replace('/login'); // Redireciona para login
        } else {
          setAuthStatus('authenticated');
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false; // Cleanup
    };
  }, [router]);

  return authStatus;
} 