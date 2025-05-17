"use client"

import { registerSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signUp } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [registerError, setRegisterError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteParam = searchParams.get("invite") || ""
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RegisterFormData & { inviteCode?: string }>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
      inviteCode: inviteParam,
    },
  })

  useEffect(() => {
    if (inviteParam) setValue("inviteCode", inviteParam)
  }, [inviteParam, setValue])

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError("")
    setSuccess(false)
    try {
    const result = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      callbackURL: '/login?registered=true',
      role: data.role,
        inviteCode: data.inviteCode,
    })
    if (result?.error?.message) {
      setRegisterError(result.error.message)
      return
      }
      setSuccess(true)
    } catch (err: any) {
      setRegisterError(err.message || "Erro ao cadastrar usuário")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome
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
          placeholder="Mínimo 6 caracteres"
        />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Tipo de Usuário
        </label>
        <select
          id="role"
          {...register("role")}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="user">Usuário</option>
          <option value="professor">Professor</option>
        </select>
      </div>
      <div>
        <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
          Código de convite
        </label>
        <input
          type="text"
          id="inviteCode"
          {...register("inviteCode", { required: true })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Digite o código de convite"
          required
        />
        {errors.inviteCode && <p className="mt-1 text-xs text-red-500">{errors.inviteCode.message || "Código de convite obrigatório"}</p>}
      </div>
      {registerError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{registerError}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-green-700 text-center">
          Cadastro realizado com sucesso!<br />
          <button type="button" className="mt-2 underline text-blue-600" onClick={() => router.push("/")}>Ir para tela inicial</button>
          <button type="button" className="mt-2 ml-4 underline text-blue-600" onClick={() => router.push("/login")}>Ir para login</button>
        </div>
      )}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
        >
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
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
