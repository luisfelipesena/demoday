"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SeedProjectsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const seedProjects = async () => {
    setIsSeeding(true);
    setLogs([]);
    
    try {
      const demodayId = "f94b688s6m4agfpmruzel5w3";
      addLog(`🌱 Iniciando criação de projetos para Demoday: ${demodayId}`);
      
      const projects = [
        {
          title: "Robô guerreiro",
          description: "Robô capaz de lutar com outros robôs utilizando metaheurísticas.",
          type: "Iniciação Científica",
          authors: "Fulano da Silva",
          developmentYear: 2024,
        },
        {
          title: "Sistema de Recomendação de Filmes",
          description: "Aplicação web que utiliza machine learning para recomendar filmes baseado no histórico do usuário.",
          type: "TCC",
          authors: "Maria Santos",
          developmentYear: 2024,
        },
        {
          title: "App de Controle Financeiro",
          description: "Aplicativo mobile para controle de gastos pessoais com análises inteligentes.",
          type: "Projeto de Disciplina",
          authors: "João Oliveira",
          developmentYear: 2024,
        },
        {
          title: "Análise de Sentimentos em Redes Sociais",
          description: "Pesquisa sobre processamento de linguagem natural aplicado à análise de sentimentos em tweets.",
          type: "Mestrado",
          authors: "Ana Costa",
          developmentYear: 2024,
        },
        {
          title: "Blockchain para Rastreabilidade de Alimentos",
          description: "Sistema distribuído para rastrear a origem e qualidade de alimentos usando blockchain.",
          type: "Doutorado",
          authors: "Carlos Rodrigues",
          developmentYear: 2024,
        }
      ];

      addLog(`📡 Enviando ${projects.length} projetos para criação direta no banco...`);

      const response = await fetch('/api/admin/seed-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demodayId,
          projects,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        addLog(`✅ Sucesso! ${result.created} projetos criados e aprovados`);
        addLog(`📋 Projetos criados: ${result.projectIds.join(', ')}`);
        alert(`Projetos inseridos! ${result.created} projetos criados com sucesso.`);
      } else {
        addLog(`❌ Erro: ${result.error}`);
        alert(`Erro: ${result.error}`);
      }

    } catch (error) {
      addLog(`💥 Erro geral: ${error}`);
      alert("Erro ao inserir projetos de exemplo");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Inserir Projetos de Exemplo</CardTitle>
          <CardDescription>
            Esta página cria 5 projetos de exemplo e os aprova automaticamente para teste da votação.
            <br />
            <strong>Nota:</strong> Esta função pula as validações de fase e cria projetos diretamente no banco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={seedProjects} 
            disabled={isSeeding}
            className="w-full mb-4"
          >
            {isSeeding ? "Inserindo projetos..." : "🌱 Inserir Projetos de Exemplo"}
          </Button>
          
          {logs.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">📋 Logs de Execução:</h3>
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Projetos que serão criados:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Robô guerreiro</li>
              <li>Sistema de Recomendação de Filmes</li>
              <li>App de Controle Financeiro</li>
              <li>Análise de Sentimentos em Redes Sociais</li>
              <li>Blockchain para Rastreabilidade de Alimentos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 