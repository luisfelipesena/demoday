"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircleIcon } from "lucide-react"


function VerifyEmailSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    if (error) {
      setStatus('error')
    } else {
      setStatus('success')
    }
  }, [error])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Verificando...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Aguarde enquanto verificamos seu email.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Erro na verificação
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error === 'invalid_token' 
                  ? 'O link de verificação é inválido ou expirou.'
                  : 'Ocorreu um erro durante a verificação do email.'
                }
              </p>
            </div>

            <div className="mt-6">
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">❌ Verificação falhou</p>
                  <p>Possíveis motivos:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>O link de verificação expirou (válido por 1 hora)</li>
                    <li>O link já foi usado anteriormente</li>
                    <li>O link foi corrompido</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/verify-email"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Solicitar novo email de verificação
                </Link>
                
                <Link
                  href="/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar ao cadastro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Email verificado!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sua conta foi ativada com sucesso.
            </p>
          </div>

          <div className="mt-6">
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                <p className="font-medium mb-2">✅ Verificação concluída</p>
                <p>
                  Seu email foi verificado com sucesso! Agora você pode fazer login
                  e acessar sua conta normalmente.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Fazer login
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir para página inicial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Carregando...
              </h2>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailSuccessContent />
    </Suspense>
  )
} 