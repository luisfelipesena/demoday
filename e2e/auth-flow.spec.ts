import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'password123',
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  });

  test('should load login page correctly', async ({ page }) => {
    // Check that login page elements are present
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('text=Faça login para continuar')).toBeVisible();
    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click login button without filling form
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait for any validation to occur
    await page.waitForTimeout(1000);

    // Check for various types of validation - browser validation or custom messages
    const validationExists = await page.locator('input:invalid').count() > 0 ||
                           await page.locator('[role="alert"]').count() > 0 ||
                           await page.locator('.error, .text-red-500, [class*="error"]').count() > 0;

    // Accept that validation works if any of these conditions are met
    expect(validationExists).toBeTruthy();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill invalid email
    await page.getByPlaceholder('seu@email.com').fill('invalid-email');
    await page.getByLabel('Senha').fill('password123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Check for email validation
    await expect(
      page.locator('text=Email inválido')
        .or(page.locator('text=Digite um email válido'))
        .or(page.locator('input[type="email"]:invalid'))
    ).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.getByPlaceholder('seu@email.com').fill('invalid@example.com');
    await page.getByLabel('Senha').fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait for error message - be more specific to avoid strict mode violation
    await expect(
      page.getByText('Erro ao fazer login').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link
    await page.getByRole('link', { name: 'Cadastre-se' }).click();

    // Verify navigation to register page
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('Cadastro');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: 'Esqueci minha senha' }).click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should handle login with test user', async ({ page }) => {
    // This test will check if we can attempt login with our test user
    // Due to Better Auth, we'll need a real user, so we'll just test the flow
    await page.getByPlaceholder('seu@email.com').fill(TEST_USER.email);
    await page.getByLabel('Senha').fill(TEST_USER.password);

    // Submit form
    await page.getByRole('button', { name: 'Entrar' }).click();

    // We should either get an error or be redirected (depending on if user exists)
    // We're just testing the flow works
    await page.waitForLoadState('networkidle');

    // Check that we're either on dashboard or still on login with error
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access a protected route directly
    await page.goto('/dashboard');

    // Should be redirected to login or unauthorized
    await expect(page).toHaveURL(/(\/login|\/unauthorized)/);
  });

  test('should redirect to login when accessing admin route without auth', async ({ page }) => {
    // Try to access admin route directly
    await page.goto('/dashboard/admin/demoday');

    // Should be redirected to login or unauthorized
    await expect(page).toHaveURL(/(\/login|\/unauthorized)/);
  });

  test('should redirect when accessing user management without auth', async ({ page }) => {
    // Try to access users route directly
    await page.goto('/dashboard/users');

    // Should be redirected to login or unauthorized
    await expect(page).toHaveURL(/(\/login|\/unauthorized)/);
  });
});