"use client"

import { loginSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signIn } from "@/lib/auth-client"

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [loginError, setLoginError] = useState("")

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

  const onSubmit = async (data: LoginFormData) => {
    setLoginError("")
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
        rememberMe: true,
        fetchOptions: {
          credentials: "include",
        },
      })

      if (result?.error?.message) {
        setLoginError(result.error.message)
        return
      }

      // Se não houver erro, o usuário será redirecionado automaticamente
    } catch (error) {
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
        </div>
      )}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
        >
          Entrar
        </button>
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
