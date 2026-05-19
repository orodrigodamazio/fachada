import { test, expect } from "@playwright/test";

const ADMIN_USER = process.env.SMOKE_ADMIN_USER ?? "rodrigo";
const ADMIN_PASS = process.env.SMOKE_ADMIN_PASSWORD ?? "";
const SLUG_TESTE = process.env.SMOKE_SLUG ?? "magazine-luiza-sa-000121";
const ROOT = process.env.SMOKE_ROOT_DOMAIN ?? "vertentebr.com.br";

test.describe("apex", () => {
  test("home carrega form CNPJ", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Fachada/i);
    await expect(page.locator("text=Site institucional pronto")).toBeVisible();
    await expect(page.locator('input[name="cnpj"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(/Gerar/i);
  });

  test("/status responde", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("text=Status").first()).toBeVisible();
    await expect(page.locator("text=database")).toBeVisible();
  });

  test("/api/health JSON OK", async ({ request }) => {
    const r = await request.get("/api/health");
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.status).toBe("ok");
    expect(Array.isArray(j.checks)).toBe(true);
  });

  test("/sitemap.xml apex lista sites", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("xml");
    const body = await r.text();
    expect(body).toContain("<urlset");
  });

  test("/robots.txt presente", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain("Sitemap:");
  });
});

test.describe("subdomain site público", () => {
  test("home do site institucional", async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: `https://${SLUG_TESTE}.${ROOT}` });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("nav").locator("text=Sobre")).toBeVisible();
    await expect(page.locator("text=Política de Privacidade")).toBeVisible();
    await ctx.close();
  });

  test("sitemap subdomain", async ({ request }) => {
    const r = await request.get(`https://${SLUG_TESTE}.${ROOT}/sitemap.xml`);
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain("/sobre");
    expect(body).toContain("/contato");
  });

  test("OG image gera", async ({ request }) => {
    const r = await request.get(`https://${SLUG_TESTE}.${ROOT}/opengraph-image`);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("image");
  });
});

test.describe("admin", () => {
  test("sem auth -> 401", async ({ request }) => {
    const r = await request.get(`https://admin.${ROOT}/admin`);
    expect(r.status()).toBe(401);
  });

  test.skip(!ADMIN_PASS, "SMOKE_ADMIN_PASSWORD não setado");
  test("com auth -> 200", async ({ browser }) => {
    const ctx = await browser.newContext({
      baseURL: `https://admin.${ROOT}`,
      httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    const page = await ctx.newPage();
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText(/Admin/i);
    await ctx.close();
  });
});

test.describe("headers de segurança", () => {
  test("CSP + HSTS + nosniff presentes", async ({ request }) => {
    const r = await request.get("/");
    const h = r.headers();
    expect(h["strict-transport-security"]).toBeTruthy();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["content-security-policy"]).toContain("default-src");
  });
});
