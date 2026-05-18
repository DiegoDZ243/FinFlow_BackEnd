import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'pruebaing',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'finflow'
});

let nombreMeta;

test.afterEach(async () => {
    if (!nombreMeta) return;

    const client = await pool.connect();
    try {
        await client.query(
            'DELETE FROM "metasFinancieras" WHERE identificador = $1',
            [nombreMeta]
        );
    } finally {
        client.release();
        nombreMeta=null;
    }
});

test('Prueba crear un nueva meta con datos validos', async ({ page }) => {
    await test.step("Usuario ingresar sus credenciales e iniciar sesion", async () => {
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'c@mail.com');
        await page.fill('input[name="password"]', '1234');
    });

    await test.step("Usuario inicia sesion", async () => {
        await page.click('button[type="submit"]');
        await page.waitForURL(/metas/);
    });

    await test.step("Navegar a crear meta", async () => {
        await page.goto('http://localhost:5173/metas/nueva');
        await expect(page.locator('h1')).toHaveText('Crear Nueva Meta');
    });

    await test.step("Llenar formulario y crear meta", async () => {
        nombreMeta = `Test-${Date.now()}`;
        
        await page.fill('input[name="identificador"]', nombreMeta);
        await page.fill('input[name="montoObjetivo"]', '5000');
        await page.fill('input[name="fechaLimite"]', '2026-12-31');
        await page.fill('textarea[name="descripcion"]', 'Meta creada en prueba automatizada');

        await page.click('button[type="submit"]');
    });

    await test.step("Verificar redireccion y meta visible", async () => {
        await page.waitForURL(/\/metas/);
        console.log(nombreMeta);
        await expect(
            page.locator('h3.card-meta-nombre', { hasText: nombreMeta })
        ).toBeVisible();
    });
});


test('Prueba crear un nueva meta con identificador con mas de 30 caracteres', async ({ page }) => {
    await test.step("Usuario ingresar sus credenciales e iniciar sesion", async () => {
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'c@mail.com');
        await page.fill('input[name="password"]', '1234');
    });

    await test.step("Usuario inicia sesion", async () => {
        await page.click('button[type="submit"]');
        await page.waitForURL(/metas/);
    });

    await test.step("Navegar a crear meta", async () => {
        await page.goto('http://localhost:5173/metas/nueva');
        await expect(page.locator('h1')).toHaveText('Crear Nueva Meta');
    });

    await test.step("Llenar formulario y crear meta", async () => {
        nombreMeta = 'Estoy guardando para vacionesss';
        
        await page.fill('input[name="identificador"]', nombreMeta);
        await page.fill('input[name="montoObjetivo"]', '5000');
        await page.fill('input[name="fechaLimite"]', '2026-12-31');
        await page.fill('textarea[name="descripcion"]', 'Meta creada en prueba automatizada');

        await page.click('button[type="submit"]');
    });

    await test.step("Verificar error de identificador", async () => {
        await expect(
            page.locator('div.form-error', { hasText: 'El nombre de la meta no puede exceder los 30 caracteres' })
        ).toBeVisible();
    });
});

test('Prueba crear un nueva meta con identificador con menos de 4 caracteres', async ({ page }) => {
    await test.step("Usuario ingresar sus credenciales e iniciar sesion", async () => {
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'c@mail.com');
        await page.fill('input[name="password"]', '1234');
    });

    await test.step("Usuario inicia sesion", async () => {
        await page.click('button[type="submit"]');
        await page.waitForURL(/metas/);
    });

    await test.step("Navegar a crear meta", async () => {
        await page.goto('http://localhost:5173/metas/nueva');
        await expect(page.locator('h1')).toHaveText('Crear Nueva Meta');
    });

    await test.step("Llenar formulario y crear meta", async () => {
        nombreMeta = 'a';
        
        await page.fill('input[name="identificador"]', nombreMeta);
        await page.fill('input[name="montoObjetivo"]', '5000');
        await page.fill('input[name="fechaLimite"]', '2026-12-31');
        await page.fill('textarea[name="descripcion"]', 'Meta creada en prueba automatizada');

        await page.click('button[type="submit"]');
    });

    await test.step("Verificar error de identificador", async () => {
        await expect(
            page.locator('div.form-error', { hasText: 'El nombre debe tener al menos 4 caracteres' })
        ).toBeVisible();
    });
});

test('Prueba crear un nueva meta con monto menor o igual a 0', async ({ page }) => {
    await test.step("Usuario ingresar sus credenciales e iniciar sesion", async () => {
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'c@mail.com');
        await page.fill('input[name="password"]', '1234');
    });

    await test.step("Usuario inicia sesion", async () => {
        await page.click('button[type="submit"]');
        await page.waitForURL(/metas/);
    });

    await test.step("Navegar a crear meta", async () => {
        await page.goto('http://localhost:5173/metas/nueva');
        await expect(page.locator('h1')).toHaveText('Crear Nueva Meta');
    });

    await test.step("Llenar formulario y crear meta", async () => {
        nombreMeta = `Test-${Date.now()}`;;
        
        await page.fill('input[name="identificador"]', nombreMeta);
        await page.fill('input[name="montoObjetivo"]', '-1');
        await page.fill('input[name="fechaLimite"]', '2026-12-31');
        await page.fill('textarea[name="descripcion"]', 'Meta creada en prueba automatizada');

        await page.click('button[type="submit"]');
    });

    await test.step("Verificar error de monto", async () => {
        await expect(
            page.locator('div.form-error', { hasText: 'El monto objetivo debe ser mayor a 0' })
        ).toBeVisible();
    });
});

test('Prueba crear un nueva meta fecha anterior a la de hoy', async ({ page }) => {
    await test.step("Usuario ingresar sus credenciales e iniciar sesion", async () => {
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'c@mail.com');
        await page.fill('input[name="password"]', '1234');
    });

    await test.step("Usuario inicia sesion", async () => {
        await page.click('button[type="submit"]');
        await page.waitForURL(/metas/);
    });

    await test.step("Navegar a crear meta", async () => {
        await page.goto('http://localhost:5173/metas/nueva');
        await expect(page.locator('h1')).toHaveText('Crear Nueva Meta');
    });

    await test.step("Llenar formulario y crear meta", async () => {
        nombreMeta = `Test-${Date.now()}`;;
        
        await page.fill('input[name="identificador"]', nombreMeta);
        await page.fill('input[name="montoObjetivo"]', '5000');
        await page.fill('input[name="fechaLimite"]', '1999-12-31');
        await page.fill('textarea[name="descripcion"]', 'Meta creada en prueba automatizada');

        await page.click('button[type="submit"]');
    });

    await test.step("Verificar error de identificador", async () => {
        await expect(
            page.locator('div.form-error', { hasText: 'La fecha límite debe ser al menos un día posterior a la fecha de creación' })
        ).toBeVisible();
    });
});

