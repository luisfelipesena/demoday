"use client"

import { authClient, signIn } from "@/lib/auth-client"
import { loginSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [loginError, setLoginError] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    try {
      await authClient.sendVerificationEmail({
        email: userEmail,
        callbackURL: "/verify-email/success",
      })
      setLoginError("")
      router.push(`/verify-email?email=${encodeURIComponent(userEmail)}`)
    } catch (error: any) {
      setLoginError(error?.message || "Erro ao reenviar email de verificação")
    } finally {
      setIsResendingVerification(false)
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoginError("")
    setNeedsVerification(false)
    setUserEmail(data.email)

    try {
      const result = await signIn.email(
        {
          email: data.email,
          password: data.password,
          callbackURL: "/dashboard",
          rememberMe: true,
        },
        {
          onError: (ctx: any) => {
            if (ctx.error.status === 403) {
              const errorMessage = ctx.error.message || ""
              if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("verifi")) {
                setNeedsVerification(true)
                setLoginError("Você precisa verificar seu email antes de fazer login.")
              } else {
                setLoginError(ctx.error.message)
              }
            } else {
              setLoginError(ctx.error.message || "Erro ao fazer login")
            }
          },
        }
      )

      if (result?.error?.message) {
        const errorMessage = result.error.message
        if (
          result.error.status === 403 &&
          (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("verifi"))
        ) {
          setNeedsVerification(true)
          setLoginError("Você precisa verificar seu email antes de fazer login.")
        } else {
          setLoginError(errorMessage)
        }
        return
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error)
      setLoginError("Ocorreu um erro durante o login. Tente novamente.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          {...register("email")}
          className={`mt-1 block w-full rounded-md border ${
            errors.email ? "border-red-500" : "border-gray-300"
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          placeholder="seu@email.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          id="password"
          {...register("password")}
          className={`mt-1 block w-full rounded-md border ${
            errors.password ? "border-red-500" : "border-gray-300"
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
        />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {loginError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{loginError}</p>
          {needsVerification && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Não recebeu o email de verificação?</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="text-xs text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
              >
                {isResendingVerification ? "Reenviando..." : "Reenviar email de verificação"}
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </div>

      <div className="text-center text-sm mt-2">
        <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
          Esqueci minha senha
        </Link>
      </div>

      <div className="text-center text-sm">
        <p>
          Não tem uma conta?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Cadastre-se
          </Link>
        </p>
      </div>
    </form>
  )
}
