"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"

function VerifyEmailContent() {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email")

  const handleResendEmail = async () => {
    if (!email) {
      setResendError("Email não encontrado")
      return
    }

    setIsResending(true)
    setResendError("")
    setResendSuccess(false)

    try {
      await authClient.sendVerificationEmail({
        email: email,
        callbackURL: "/verify-email/success"
      })
      setResendSuccess(true)
    } catch (error: any) {
      setResendError(error?.message || "Erro ao reenviar email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Verifique seu email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Cadastro realizado com sucesso!
            </p>
          </div>

          <div className="mt-6">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">
                  📧 Verificação necessária
                </p>
                <p>
                  Enviamos um email de verificação para{" "}
                  <span className="font-medium">{email || "seu email"}</span>.
                </p>
                <p className="mt-2">
                  Clique no link no email para ativar sua conta e poder fazer login.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="text-sm text-gray-600">
                <p>🔍 <strong>Não encontrou o email?</strong></p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                  <li>Verifique sua caixa de spam</li>
                  <li>Verifique se o email está correto</li>
                  <li>O link expira em 1 hora</li>
                </ul>
              </div>

              {email && (
                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isResending ? "Reenviando..." : "Reenviar email de verificação"}
                  </button>

                  {resendSuccess && (
                    <div className="rounded-md bg-green-50 p-3">
                      <p className="text-sm text-green-700">
                        Email de verificação reenviado com sucesso!
                      </p>
                    </div>
                  )}

                  {resendError && (
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-sm text-red-700">{resendError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  )
} 