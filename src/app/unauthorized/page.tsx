import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Acesso Negado</h1>
          <div className="mt-4 text-xl text-gray-600">
            Você não tem permissão para acessar esta página.
          </div>
          <p className="mt-2 text-gray-500">
            Por favor, entre em contato com um administrador se você acredita que deveria ter acesso.
          </p>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Voltar para Home
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
} 