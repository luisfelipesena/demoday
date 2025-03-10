"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-4 shadow">
        <div>
          <p className="text-lg">
            Bem-vindo,{" "}
            <span className="font-semibold">{session.user?.name}</span>
          </p>
          <p className="text-sm text-gray-600">
            Tipo de usuário: {session.user?.role || "Usuário"}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Página Inicial
        </Link>
      </div>

      {/* Conteúdo específico para cada role */}
      {session.user?.role === "admin" && (
        <div className="rounded-lg bg-blue-50 p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold text-blue-800">
            Área do Administrador
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href="/admin/users"
              className="rounded-lg bg-white p-4 shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-medium">Gerenciar Usuários</h3>
              <p className="text-sm text-gray-600">
                Visualize, edite ou remova usuários do sistema.
              </p>
            </Link>
            <Link
              href="/admin/projects"
              className="rounded-lg bg-white p-4 shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-medium">Gerenciar Projetos</h3>
              <p className="text-sm text-gray-600">
                Aprove, rejeite ou edite projetos submetidos.
              </p>
            </Link>
            <Link
              href="/admin/demoday"
              className="rounded-lg bg-white p-4 shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-medium">Gerenciar Demodays</h3>
              <p className="text-sm text-gray-600">
                Crie e gerencie eventos Demoday e seus critérios.
              </p>
            </Link>
          </div>
        </div>
      )}

      {session.user?.role === "professor" && (
        <div className="rounded-lg bg-green-50 p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold text-green-800">
            Área do Professor
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/professor/projects"
              className="rounded-lg bg-white p-4 shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-medium">Avaliar Projetos</h3>
              <p className="text-sm text-gray-600">
                Avalie e dê feedback aos projetos dos alunos.
              </p>
            </Link>
            <Link
              href="/professor/reports"
              className="rounded-lg bg-white p-4 shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-medium">Relatórios</h3>
              <p className="text-sm text-gray-600">
                Visualize relatórios de desempenho.
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Mostra para todos os usuários (inclusive admin e professor) */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4 shadow">
        <h2 className="mb-4 text-xl font-semibold">Seus Projetos</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/projects/new"
            className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-blue-500"
          >
            <div>
              <span className="mb-2 block text-3xl">+</span>
              <span className="text-sm font-medium">Adicionar Novo Projeto</span>
            </div>
          </Link>
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-center text-gray-500">
              Nenhum projeto encontrado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 