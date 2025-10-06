import { test, expect } from '@playwright/test';

/**
 * Testes simplificados do fluxo de submissão
 */

test.describe('Fluxo de Submissão de Projeto', () => {

  test('rotas de projetos devem estar protegidas', async ({ page }) => {
    // Testar acesso direto sem autenticação
    await page.goto('/dashboard/projects');

    // Deve redirecionar para login ou unauthorized
    await expect(page).toHaveURL(/(login|unauthorized)/);
  });

  test('rota de novo projeto deve estar protegida', async ({ page }) => {
    await page.goto('/dashboard/projects/new');

    // Deve redirecionar para login ou unauthorized
    await expect(page).toHaveURL(/(login|unauthorized)/);
  });

  test('rota de submissão ao demoday deve estar protegida', async ({ page }) => {
    await page.goto('/dashboard/demoday/test-id/submit');

    // Deve redirecionar para login ou unauthorized
    await expect(page).toHaveURL(/(login|unauthorized)/);
  });

  test('página inicial deve carregar', async ({ page }) => {
    await page.goto('/');

    // Verificar que a página carregou
    await expect(page).toHaveTitle(/.+/);

    // Verificar elementos da página inicial
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('página de login deve ter campos necessários', async ({ page }) => {
    await page.goto('/login');

    // Verificar campos do formulário
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });
});

test.describe('APIs de Projeto', () => {

  test('GET /api/projects deve retornar 401 sem auth', async ({ request }) => {
    const response = await request.get('/api/projects');
    expect(response.status()).toBe(401);
  });

  test('POST /api/projects/submissions deve retornar 401 sem auth', async ({ request }) => {
    const response = await request.post('/api/projects/submissions', {
      data: { projectId: 'test', demodayId: 'test' }
    });
    expect(response.status()).toBe(401);
  });

  test('GET /api/projects/submissions deve retornar 401 sem auth', async ({ request }) => {
    const response = await request.get('/api/projects/submissions');
    expect(response.status()).toBe(401);
  });
});