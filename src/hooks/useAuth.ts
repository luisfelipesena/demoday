import { useMutation } from '@tanstack/react-query'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type LoginInput = {
  email: string
  password: string
}

type RegisterInput = {
  name: string
  email: string
  password: string
}

// Hook para login de usuário
export function useLogin() {
  const router = useRouter()

  return useMutation<any, Error, LoginInput>({
    mutationFn: async ({ email, password }: LoginInput) => {
      const response = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (response?.error) {
        throw new Error('Email ou senha inválidos')
      }

      return response
    },
    onSuccess: () => {
      router.push('/dashboard')
      router.refresh()
    },
  })
}

// Hook para registro de usuário
export function useRegister() {
  const router = useRouter()

  return useMutation<any, Error, RegisterInput>({
    mutationFn: async (data: RegisterInput) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao cadastrar usuário')
      }

      return responseData
    },
    onSuccess: () => {
      router.push('/login?registered=true')
    },
  })
}
