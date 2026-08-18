const { test, expect } = require('@playwright/test');

test.describe('Mobile-First Responsive Layout & Collapsible Drawer Navigation', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('Mobile default state (375x667): toggle button is visible, drawer is off-screen, and backdrop is hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    // Complete username join
    await page.locator('#username-input').fill('Alice');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // Verify mobile hamburger toggle button
    const toggleBtn = page.locator('#sidebar-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(toggleBtn).toHaveAttribute('aria-controls', 'users-sidebar');

    // Verify backdrop overlay is hidden
    const backdrop = page.locator('#sidebar-backdrop');
    await expect(backdrop).toHaveClass(/hidden/);

    // Verify sidebar drawer is closed
    const sidebar = page.locator('#users-sidebar');
    await expect(sidebar).not.toHaveClass(/open/);

    // Verify sidebar is translated offscreen
    const transform = await sidebar.evaluate((el) => window.getComputedStyle(el).transform);
    expect(transform).toContain('matrix');
  });

  test('Opening drawer via hamburger toggle button updates classes and ARIA attributes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    // Join chat
    await page.locator('#username-input').fill('Bob');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const backdrop = page.locator('#sidebar-backdrop');
    const sidebar = page.locator('#users-sidebar');

    // Click toggle button to open drawer
    await toggleBtn.click();

    // Verify drawer opened state
    await expect(sidebar).toHaveClass(/open/);
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    await expect(backdrop).not.toHaveClass(/hidden/);
    await expect(backdrop).toHaveAttribute('aria-hidden', 'false');
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Close online users roster');

    // Verify body received drawer-open scroll lock class
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('drawer-open');

    // Verify user roster is visible inside open drawer
    await expect(page.locator('#users-list')).toBeVisible();
    await expect(page.locator('.user-name')).toHaveText('Bob');
  });

  test('Dismissing drawer via backdrop tap closes drawer and restores scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    await page.locator('#username-input').fill('Charlie');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const backdrop = page.locator('#sidebar-backdrop');
    const sidebar = page.locator('#users-sidebar');

    // Open drawer
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);
    await expect(backdrop).not.toHaveClass(/hidden/);

    // Click backdrop to dismiss
    await backdrop.click({ position: { x: 320, y: 300 } });

    // Verify drawer closed state
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(backdrop).toHaveClass(/hidden/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Open online users roster');

    // Verify body scroll-lock removed
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).not.toContain('drawer-open');
  });

  test('Dismissing drawer via Escape key closes drawer and returns focus to toggle button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    await page.locator('#username-input').fill('Dana');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const sidebar = page.locator('#users-sidebar');
    const backdrop = page.locator('#sidebar-backdrop');

    // Open drawer
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify drawer closed
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(backdrop).toHaveClass(/hidden/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Verify focus returned to toggle button
    await expect(toggleBtn).toBeFocused();
  });

  test('Dismissing drawer via sidebar close button inside drawer header', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    await page.locator('#username-input').fill('Eve');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const sidebar = page.locator('#users-sidebar');
    const closeBtn = page.locator('#sidebar-close-btn');

    // Open drawer
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);

    // Click close button inside drawer
    await closeBtn.click();

    // Verify drawer closed
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(page.locator('#sidebar-backdrop')).toHaveClass(/hidden/);
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Desktop layout (1024x768): toggle button and backdrop are hidden, sidebar is persistent static', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/', { timeout: 30000 });

    await page.locator('#username-input').fill('Frank');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // Toggle button and close button must be hidden on desktop
    const toggleBtn = page.locator('#sidebar-toggle-btn');
    await expect(toggleBtn).toBeHidden();

    const backdrop = page.locator('#sidebar-backdrop');
    await expect(backdrop).toBeHidden();

    // Sidebar should be statically visible in persistent side-by-side layout
    const sidebar = page.locator('#users-sidebar');
    await expect(sidebar).toBeVisible();

    const sidebarDisplay = await sidebar.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        transform: style.transform,
        width: style.width,
      };
    });

    expect(sidebarDisplay.position).toBe('static');
    expect(sidebarDisplay.transform).toBe('none');
    expect(parseInt(sidebarDisplay.width, 10)).toBe(240);
  });

  test('Dynamic viewport resize: expanding from mobile (open drawer) to desktop cleans up state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    await page.locator('#username-input').fill('Grace');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const toggleBtn = page.locator('#sidebar-toggle-btn');
    const sidebar = page.locator('#users-sidebar');

    // Open drawer on mobile
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/open/);

    // Resize viewport to desktop width (800x600)
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);

    // Verify drawer state cleaned up
    const isSidebarOpen = await page.evaluate(() => window.Chatter.ui.isSidebarOpen());
    expect(isSidebarOpen).toBe(false);

    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).not.toContain('drawer-open');

    // Toggle button should be hidden on desktop
    await expect(toggleBtn).toBeHidden();
    await expect(sidebar).toBeVisible();
  });

  test('Mobile viewport messaging and layout integrity: no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { timeout: 30000 });

    await page.locator('#username-input').fill('Hank');
    await page.locator('#username-form').dispatchEvent('submit');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // Send a message on mobile
    await page.locator('#message-input').fill('Hello from mobile device!');
    await page.locator('#message-form').dispatchEvent('submit');

    await expect(page.locator('.message-bubble')).toHaveText('Hello from mobile device!');

    // Verify page has no horizontal scrolling overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
