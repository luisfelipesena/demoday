/**
 * Utilitários para manipulação de datas no sistema DemoDay
 */

/**
 * Verifica se a data atual está dentro de uma fase específica do DemoDay
 * 
 * @param demoday Objeto DemoDay com as fases
 * @param phaseNumber Número da fase a verificar
 * @returns boolean indicando se está dentro da fase
 */
export function isInPhase(demoday: any, phaseNumber: number): boolean {
  if (!demoday || !demoday.phases) return false;
  
  const now = new Date(); // Data atual
  const phase = demoday.phases.find((phase: any) => phase.phaseNumber === phaseNumber);
  
  if (!phase) return false;
  
  // Garantir que as datas sejam tratadas corretamente
  const startDate = new Date(phase.startDate);
  const endDate = new Date(phase.endDate);
  
  // Definir as horas para 00:00:00 para startDate e 23:59:59 para endDate
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  // Verificar se a data atual está dentro do período
  return now >= startDate && now <= endDate;
}

/**
 * Verifica se o Demoday terminou (todas as fases passaram)
 * 
 * @param demoday Objeto DemoDay com as fases
 * @returns boolean indicando se o Demoday terminou
 */
export function isDemodayFinished(demoday: any): boolean {
  if (!demoday || !demoday.phases || demoday.phases.length === 0) return false;
  
  const now = new Date();
  
  // Encontrar a última fase (maior phaseNumber)
  const lastPhase = demoday.phases.reduce((latest: any, current: any) => {
    return current.phaseNumber > latest.phaseNumber ? current : latest;
  });
  
  if (!lastPhase) return false;
  
  const lastPhaseEndDate = new Date(lastPhase.endDate);
  lastPhaseEndDate.setHours(23, 59, 59, 999);
  
  // O Demoday terminou se a data atual passou da última fase
  return now > lastPhaseEndDate;
}

/**
 * Verifica se o DemoDay está na fase de submissão (phase 1)
 * 
 * @param demoday Objeto DemoDay com as fases
 * @returns boolean indicando se está na fase de submissão
 */
export function isInSubmissionPhase(demoday: any): boolean {
  return isInPhase(demoday, 1);
}

/**
 * Formata uma data no formato brasileiro (dia/mês/ano)
 * 
 * @param dateString String da data a ser formatada
 * @returns Data formatada no padrão brasileiro
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
} 