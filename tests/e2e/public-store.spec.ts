import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicPages = ["/", "/productos", "/aviso-legal", "/privacidad", "/condiciones-de-compra"];

for (const path of publicPages) {
  test(`${path} no tiene infracciones WCAG A/AA detectables`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("la navegación legal y los metadatos públicos son accesibles", async ({ page }) => {
  await page.goto("/");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).not.toBeNull();
  expect(new URL(canonical!).pathname).toBe("/");
  const legalNavigation = page.getByRole("navigation", { name: "Información legal" });
  await expect(legalNavigation.getByRole("link", { name: "Privacidad", exact: true })).toHaveAttribute("href", "/privacidad");
  await expect(legalNavigation.getByRole("link", { name: "Condiciones de compra" })).toHaveAttribute("href", "/condiciones-de-compra");
});

test("la home no repite el drop ni muestra colecciones anteriores", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Nuestra historia")).toHaveCount(0);
  await expect(page.getByText("Drops anteriores")).toHaveCount(0);

  const heroTitle = page.locator("h1").first();
  await expect(heroTitle).toBeVisible();
  await expect(page.getByRole("heading", { name: await heroTitle.innerText() })).toHaveCount(1);
});

test("la tienda no provoca desbordamiento horizontal en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/productos");
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test("las rutas privadas declaran noindex", async ({ page }) => {
  await page.goto("/carrito");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("el servidor entrega las cabeceras de seguridad y bloquea robots fuera de producción", async ({ request }) => {
  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(home.headers()["x-frame-options"]).toBe("DENY");

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
});
