import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated Esta API está obsoleta. Use /api/projects/submissions/demoday ao invés disso.
 */
export async function GET(req: NextRequest) {
  try {
    // Obter os parâmetros de consulta
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Construir a nova URL para a API atual
    const newUrl = new URL("/api/projects/submissions/demoday", url.origin);

    // Copiar todos os parâmetros de consulta
    searchParams.forEach((value, key) => {
      newUrl.searchParams.append(key, value);
    });

    // Adicionar um header para indicar que esta API está obsoleta
    const headers = new Headers();
    headers.append('Warning', '299 - "Esta API está obsoleta e será removida em versões futuras. Use /api/projects/submissions/demoday ao invés disso."');

    // Fazer a requisição para a nova API
    const response = await fetch(newUrl.toString(), {
      headers: req.headers,
    });

    // Obter o corpo da resposta
    const data = await response.json();

    // Retornar os dados com o header de aviso
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Warning': '299 - "Esta API está obsoleta e será removida em versões futuras. Use /api/projects/submissions/demoday ao invés disso."'
      }
    });
  } catch (error) {
    console.error("Erro ao redirecionar para a nova API:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar projetos do demoday",
        message: "Esta API está obsoleta. Use /api/projects/submissions/demoday ao invés disso."
      },
      { status: 500 }
    );
  }
} 