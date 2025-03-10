import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cadastro</h1>
          <p className="text-gray-600">Crie sua conta na plataforma Demoday</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
} 