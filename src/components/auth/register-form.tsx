"use client"

import { useRegister } from "@/hooks/useAuth"
import { registerSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [registerError, setRegisterError] = useState("")
  const register_mutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError("")

    register_mutation.mutate(data, {
      onError: (error) => {
        setRegisterError(error.message || "Ocorreu um erro ao cadastrar")
      },
    })
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
          <option value="admin">Administrador</option>
        </select>
      </div>
      {registerError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{registerError}</p>
        </div>
      )}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || register_mutation.isPending}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
        >
          {register_mutation.isPending ? "Cadastrando..." : "Cadastrar"}
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
