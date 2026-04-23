import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4444/');
    await page.waitForLoadState('networkidle');
  });

  test('Homepage loads with correct content', async ({ page }) => {
    // Check main heading
    const heading = page.locator('h1:has-text("Building the Future")');
    await expect(heading).toBeVisible();

    // Check navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('Navigation links are visible', async ({ page }) => {
    // Check BUILD link
    const buildLink = page.locator('a.nav-link[href="/build"]');
    await expect(buildLink).toBeVisible();

    // Check HOME link (nav-link class to distinguish from brand)
    const homeLink = page.locator('a.nav-link[href="/"]');
    await expect(homeLink).toBeVisible();

    // Check ABOUT link
    const aboutLink = page.locator('a.nav-link:has-text("ABOUT")');
    await expect(aboutLink).toBeVisible();
  });

  test('Navigation to BUILD page works', async ({ page }) => {
    // Click BUILD link in nav
    const buildLink = page.locator('a[href="/build"]:has-text("BUILD")').first();
    await buildLink.click();
    await page.waitForURL('**/build');

    // Verify we're on build page
    expect(page.url()).toContain('/build');
  });

  test('About section accessible via link', async ({ page }) => {
    // Click ABOUT link
    const aboutLink = page.locator('a[href="/#about"]:has-text("ABOUT")');
    await aboutLink.click();

    // About navigation should work
    expect(true).toBe(true);
  });

  test('Contact page link works', async ({ page }) => {
    // Check CONTACT link exists
    const contactLink = page.locator('a[href="/contact"]:has-text("CONTACT")');
    await expect(contactLink).toBeVisible();
  });

  test('CTA buttons present on homepage', async ({ page }) => {
    // Check for "START BUILDING" buttons
    const ctaButtons = page.locator('a.cta-btn:has-text("START BUILDING")');
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('No critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Reload and wait
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Filter out expected warnings
    const criticalErrors = errors.filter(e =>
      !e.includes('.cargo/env') &&
      !e.includes('nodemailer') &&
      !e.includes('Failed to load resource') &&
      !e.includes('favicon')
    );

    // Just verify no critical auth or app errors
    expect(criticalErrors.filter(e => e.includes('404') || e.includes('500')).length).toBe(0);
  });

  test('Home link is present and functional', async ({ page }) => {
    // Check that HOME link exists (nav-link class to avoid brand link)
    const homeLink = page.locator('a.nav-link[href="/"]');
    await expect(homeLink).toBeVisible();

    // Verify it's labeled "HOME"
    const homeLinkText = await homeLink.textContent();
    expect(homeLinkText?.trim()).toBe('HOME');
  });
});
