import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isLoggedIn = !!token;
    const isAdmin = token?.role === "admin";
    const isProfessor = token?.role === "professor";
    const isUser = token?.role === "user";
    const path = req.nextUrl.pathname;

    // Redirecionar usuários não autenticados para a página de login
    if (!isLoggedIn && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Rotas de admin só podem ser acessadas por admins
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Rotas de professor só podem ser acessadas por professores ou admins
    if (path.startsWith("/professor") && !(isProfessor || isAdmin)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Permitir acesso à rota atual
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Configurar quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/professor/:path*",
    "/api/protected/:path*",
  ],
}; 