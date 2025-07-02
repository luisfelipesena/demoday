"use client"

import { signUp } from "@/lib/auth-client"
import { registerSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [registerError, setRegisterError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
    },
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError("")
    setUserEmail(data.email)

    try {
      const result = await signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          callbackURL: "/verify-email/success",
        },
        {
          onError: (ctx: any) => {
            setRegisterError(ctx.error.message || "Erro ao criar conta")
          },
        }
      )

      if (result?.error?.message) {
        setRegisterError(result.error.message)
        return
      }

      setIsVerifying(true)
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      console.error("Erro ao criar conta:", error)
      setRegisterError("Ocorreu um erro durante o cadastro. Tente novamente.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome completo
        </label>
        <input
          type="text"
          id="name"
          {...register("name")}
          className={`mt-1 block w-full rounded-md border ${
            errors.name ? "border-red-500" : "border-gray-300"
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          placeholder="Seu nome completo"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

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
          placeholder="Mínimo 8 caracteres"
        />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de usuário</label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="student"
              value="student"
              {...register("role")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="student" className="ml-3 block text-sm text-gray-700">
              Aluno
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="external"
              value="external"
              {...register("role")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="external" className="ml-3 block text-sm text-gray-700">
              Usuário Externo
            </label>
          </div>
        </div>
        {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
      </div>

      {registerError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{registerError}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
        >
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </button>
      </div>

      <div className="text-center text-sm">
        <p>
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Faça login
          </Link>
        </p>
      </div>
    </form>
  )
}
