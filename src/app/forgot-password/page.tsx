'use client'

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const { data, error: authError } = await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
      
      if (authError) {
        throw new Error(authError.message || "Erro ao enviar e-mail");
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="text-gray-600">Informe seu e-mail para receber o link de redefinição</p>
        </div>
        {success ? (
          <div className="rounded-md bg-green-50 p-3 text-green-700 text-center">
            Se o e-mail informado existir, você receberá um link para redefinir sua senha.<br />
            <button type="button" className="mt-2 underline text-blue-600" onClick={() => window.location.href = "/"}>Ir para tela inicial</button>
            <button type="button" className="mt-2 ml-4 underline text-blue-600" onClick={() => window.location.href = "/login"}>Ir para login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-300"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
            <div className="flex justify-between mt-4">
              <button type="button" className="underline text-blue-600" onClick={() => window.location.href = "/"}>Voltar para tela inicial</button>
              <button type="button" className="underline text-blue-600" onClick={() => window.location.href = "/login"}>Voltar para login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 