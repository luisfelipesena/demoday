"use client"

import { registerSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signUp } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [registerError, setRegisterError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student_ufba",
    },
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError("")
    setSuccess(false)
    
    try {
      const registrationData = {
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: '/verify-email/success',
        role: data.role,
      }

      const result = await signUp.email(registrationData, {
        onRequest: () => {
          if (data.email === "demoday.ic.ufba@gmail.com") {
            throw new Error("Cadastro do super usuário só pode ser feito manualmente pelo administrador do sistema.")
          }
        },
        onSuccess: () => {
          setSuccess(true)
          
          setTimeout(() => {
            router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
          }, 2000)
        },
        onError: (ctx) => {
          if (ctx.error.status === 403) {
            setRegisterError("Verificação de email necessária. Verifique sua caixa de entrada.")
          } else {
            setRegisterError(ctx.error.message || "Erro ao cadastrar usuário")
          }
        }
      })

      if (result?.error) {
        setRegisterError(result.error.message || "Erro ao cadastrar usuário")
        return
      }

    } catch (err: any) {
      setRegisterError(err.message || "Erro ao cadastrar usuário")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nome completo
        </label>
        <input
          type="text"
          id="name"
          {...register("name")}
          className={`mt-1 block w-full rounded-md border ${
            errors.name ? "border-red-500" : "border-gray-300"
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          placeholder="Digite seu nome completo"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Senha */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Tipo de Usuário - Radio Buttons */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de usuário
          </legend>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="student_ufba"
                type="radio"
                value="student_ufba"
                {...register("role")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="student_ufba" className="ml-3 flex flex-col">
                <span className="text-sm font-medium text-gray-900">Aluno UFBA</span>
                <span className="text-xs text-gray-500">Estudante da Universidade Federal da Bahia</span>
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="student_external"
                type="radio"
                value="student_external"
                {...register("role")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="student_external" className="ml-3 flex flex-col">
                <span className="text-sm font-medium text-gray-900">Aluno externo à UFBA</span>
                <span className="text-xs text-gray-500">Estudante de outras instituições</span>
              </label>
            </div>
          </div>
        </fieldset>
        {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
      </div>

      {/* Informação adicional baseada no tipo selecionado */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="text-sm text-blue-800">
          {selectedRole === "student_ufba" ? (
            <>
              <strong>💡 Aluno UFBA:</strong> Você poderá submeter projetos desenvolvidos em disciplinas, 
              iniciação científica, TCC, mestrado ou doutorado da UFBA.
            </>
          ) : (
            <>
              <strong>💡 Aluno externo à UFBA:</strong> Você poderá submeter projetos acadêmicos desenvolvidos 
              em sua instituição de ensino.
            </>
          )}
        </div>
      </div>
      
      {registerError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{registerError}</p>
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-green-700 text-center">
          <p className="font-medium">Cadastro realizado com sucesso! 🎉</p>
          <p className="text-sm mt-1">
            Enviamos um email de verificação. Você será redirecionado em alguns segundos...
          </p>
        </div>
      )}
      
      <div>
        <button
          type="submit"
          disabled={isSubmitting || success}
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
        >
          {isSubmitting ? "Cadastrando..." : success ? "Redirecionando..." : "Criar conta"}
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

      {/* Informação sobre professores */}
      <div className="border-t pt-4 mt-6">
        <div className="text-center text-xs text-gray-500">
          <p>
            <strong>Professores:</strong> Entre em contato com a administração para obter suas credenciais de acesso.
          </p>
        </div>
      </div>
    </form>
  )
}
