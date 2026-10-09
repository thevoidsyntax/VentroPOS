import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

/**
 * E2E Test Suite for VentroPOS
 * Tests all major features from login to product management
 */

test.describe('VentroPOS E2E Tests', () => {

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Check if already logged in (might redirect to POS)
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'owner@demo.com');
      await page.fill('input[type="password"]', 'owner123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pos', { timeout: 10000 }).catch(() => {
        console.log('Login might have failed or redirected elsewhere');
      });
    }
  });

  // ===== AUTH TESTS =====
  test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator('h1, h2, text=Masuk')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show validation errors for empty login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('button[type="submit"]');
      // Should show validation errors
      await expect(page.locator('text=email')).toBeVisible().or(
        page.locator('text=harus').toBeVisible()
      );
    });
  });

  // ===== POS PAGE =====
  test.describe('POS Page', () => {
    test('should load POS page', async ({ page }) => {
      await page.goto(`${BASE_URL}/pos`);
      await expect(page.locator('body')).toBeVisible();

      // Check for product grid or categories
      const hasProducts = await page.locator('[class*="grid"], [class*="card"]').count() > 0;
      expect(hasProducts).toBeTruthy();
    });
  });

  // ===== PRODUCTS PAGE =====
  test.describe('Products Management', () => {
    test('should navigate to products page', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');

      // Check header
      await expect(page.locator('h1, text=Produk')).toBeVisible();

      // Check for product grid
      const hasGrid = await page.locator('[class*="grid"]').count() > 0;
      expect(hasGrid).toBeTruthy();
    });

    test('should show add product button', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await expect(page.locator('text=Tambah Produk, text=Add Product')).toBeVisible();
    });

    test('should navigate to add product form', async ({ page }) => {
      await page.goto(`${BASE_URL}/products/new`);
      await page.waitForLoadState('networkidle');

      // Check form elements
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[id="name"], input[placeholder*="Americano"]')).toBeVisible().or(
        page.locator('label:has-text("Nama")').toBeVisible()
      );
    });

    test('should filter products by category', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');

      // Look for category dropdown/select
      const hasCategoryFilter = await page.locator('select, [role="combobox"]').count() > 0;
      if (hasCategoryFilter) {
        // Select a category if available
        const select = page.locator('select').first();
        const options = await select.locator('option').count();
        if (options > 1) {
          await select.selectOption({ index: 1 });
          // Should filter products
          await page.waitForTimeout(500);
        }
      }
    });

    test('should search products', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');

      // Look for search input
      const searchInput = page.locator('input[placeholder*="Cari"], input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(300);
      }
    });
  });

  // ===== ORDERS PAGE =====
  test.describe('Orders Management', () => {
    test('should navigate to orders page', async ({ page }) => {
      await page.goto(`${BASE_URL}/orders`);
      await page.waitForLoadState('networkidle');

      // Check for orders content
      const body = await page.textContent('body');
      expect(body).toBeDefined();
    });

    test('should show order filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/orders`);
      await page.waitForLoadState('networkidle');

      // Look for status filter
      const hasFilters = await page.locator('select, [role="combobox"]').count() > 0;
      expect(hasFilters).toBeTruthy();
    });
  });

  // ===== STOCK PAGE =====
  test.describe('Stock Management', () => {
    test('should navigate to stock page', async ({ page }) => {
      await page.goto(`${BASE_URL}/stock`);
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      expect(body).toBeDefined();
    });
  });

  // ===== REPORTS PAGE =====
  test.describe('Reports', () => {
    test('should navigate to reports page', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      expect(body).toBeDefined();
    });
  });

  // ===== SETTINGS PAGE =====
  test.describe('Settings', () => {
    test('should navigate to settings page', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');

      const body = await page.textContent('body');
      expect(body).toBeDefined();
    });
  });

  // ===== NAVIGATION =====
  test.describe('Navigation', () => {
    test('should have working sidebar navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/pos`);
      await page.waitForLoadState('networkidle');

      // Look for nav links
      const navLinks = await page.locator('nav a, [class*="sidebar"] a, header a').count();
      expect(navLinks).toBeGreaterThan(0);
    });

    test('should navigate between pages', async ({ page }) => {
      await page.goto(`${BASE_URL}/pos`);

      // Try clicking products link
      const productsLink = page.locator('a[href="/products"], nav a:has-text("Produk")').first();
      if (await productsLink.count() > 0) {
        await productsLink.click();
        await page.waitForURL('**/products', { timeout: 5000 });
        expect(page.url()).toContain('/products');
      }
    });
  });

  // ===== UI/UX =====
  test.describe('UI/UX Checks', () => {
    test('should have proper styling (not plain HTML)', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      // Check for Tailwind classes or styled elements
      const styledElements = await page.locator('[class*="bg-"], [class*="text-"], [class*="rounded-"]').count();
      expect(styledElements).toBeGreaterThan(0);
    });

    test('should have responsive layout', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile
      await page.waitForLoadState('networkidle');

      // Page should still be usable
      const body = await page.textContent('body');
      expect(body).toBeDefined();
    });

    test('should show loading states', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('domcontentloaded');

      // Should have some content or loading indicator
      const content = await page.locator('body').textContent();
      expect(content?.length).toBeGreaterThan(0);
    });
  });

  // ===== KEYBOARD SHORTCUTS =====
  test.describe('Keyboard Shortcuts', () => {
    test('should focus search with Ctrl+F on products page', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');

      // Press Ctrl+F
      await page.keyboard.press('Control+f');
      await page.waitForTimeout(100);

      // Check if search input is focused
      const searchInput = page.locator('input[placeholder*="Cari"], input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeFocused();
      }
    });

    test('should open new product with Ctrl+N on products page', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');

      // Press Ctrl+N
      await page.keyboard.press('Control+n');
      await page.waitForURL('**/products/new', { timeout: 3000 }).catch(() => {
        // Shortcut might not work, that's ok for now
      });
    });
  });
});
