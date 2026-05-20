import { test, expect } from "@playwright/test";

const email = `e2e+${Date.now()}@teste.local`;
const senha = "SenhaTeste#2026";

test.describe.serial("auth SaaS", () => {
  test("signup leva ao painel", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="senha"]', senha);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/app");
    await expect(page.getByRole("heading", { name: "Meus sites" })).toBeVisible();
  });

  test("rota protegida sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login com as credenciais criadas", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="senha"]', senha);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/app");
    await expect(page.getByRole("heading", { name: "Meus sites" })).toBeVisible();
  });

  test("login com senha errada falha", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="senha"]', "senhaErrada123");
    await page.click('button[type="submit"]');
    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  });
});
