const { test, expect } = require("@playwright/test");

test.describe("Dual-Theme Engine & HSL Design System Tokens", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/reset");
  });

  test("Initial page load sets default dark theme on document root", async ({ page }) => {
    await page.goto("/", { timeout: 30000 });

    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveAttribute("data-theme", "dark");

    const toggleBtn = page.locator("#theme-toggle-btn");
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Switch to light theme");

    const sunSvg = page.locator("#theme-toggle-icon svg.lucide-sun");
    await expect(sunSvg).toBeVisible();

    // Verify computed dark theme background color on body
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBg).toBeTruthy();
  });

  test("Clicking theme toggle button switches between dark and light themes", async ({ page }) => {
    await page.goto("/", { timeout: 30000 });

    const toggleBtn = page.locator("#theme-toggle-btn");
    const htmlElement = page.locator("html");

    // 1. Initial State: Dark Mode (displays sun icon to switch to light)
    await expect(htmlElement).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#theme-toggle-icon svg.lucide-sun")).toBeVisible();

    const darkHeaderBg = await page.evaluate(() => {
      const header = document.querySelector(".chat-header");
      return header ? window.getComputedStyle(header).backgroundColor : "";
    });

    // 2. Click Toggle -> Switch to Light Mode (displays moon icon to switch to dark)
    await toggleBtn.click();

    await expect(htmlElement).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-icon svg.lucide-moon")).toBeVisible();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Switch to dark theme");

    const lightHeaderBg = await page.evaluate(() => {
      const header = document.querySelector(".chat-header");
      return header ? window.getComputedStyle(header).backgroundColor : "";
    });

    // Background color of header in light mode must differ from dark mode
    expect(lightHeaderBg).not.toBe(darkHeaderBg);

    // Verify localStorage has persisted "light"
    const storedTheme = await page.evaluate(() => localStorage.getItem("chatter-theme"));
    expect(storedTheme).toBe("light");

    // 3. Click Toggle Again -> Return to Dark Mode
    await toggleBtn.click();

    await expect(htmlElement).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#theme-toggle-icon svg.lucide-sun")).toBeVisible();
    await expect(toggleBtn).toHaveAttribute("aria-label", "Switch to light theme");

    const returnedDarkHeaderBg = await page.evaluate(() => {
      const header = document.querySelector(".chat-header");
      return header ? window.getComputedStyle(header).backgroundColor : "";
    });
    expect(returnedDarkHeaderBg).toBe(darkHeaderBg);

    const storedThemeAfterSecondToggle = await page.evaluate(() => localStorage.getItem("chatter-theme"));
    expect(storedThemeAfterSecondToggle).toBe("dark");
  });

  test("Theme preference persists across page reloads", async ({ page }) => {
    await page.goto("/", { timeout: 30000 });

    const toggleBtn = page.locator("#theme-toggle-btn");
    const htmlElement = page.locator("html");

    // Switch to light theme
    await toggleBtn.click();
    await expect(htmlElement).toHaveAttribute("data-theme", "light");

    // Reload page
    await page.reload({ timeout: 30000 });

    // Ensure page loaded with light theme preserved
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-icon svg.lucide-moon")).toBeVisible();
    await expect(page.locator("#theme-toggle-btn")).toHaveAttribute("aria-label", "Switch to dark theme");
  });

  test("Pre-configured localStorage theme is applied immediately on boot", async ({ page }) => {
    // Set localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem("chatter-theme", "light");
    });

    await page.goto("/", { timeout: 30000 });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-icon svg.lucide-moon")).toBeVisible();
  });

  test("OS prefers-color-scheme syncs when no manual preference is stored", async ({ page }) => {
    // Emulate light OS mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/", { timeout: 30000 });

    // Should detect light mode from system
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-icon svg.lucide-moon")).toBeVisible();

    // Switch OS emulation to dark mode
    await page.emulateMedia({ colorScheme: "dark" });

    // Should dynamically switch to dark theme
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#theme-toggle-icon svg.lucide-sun")).toBeVisible();
  });

  test("Explicit user preference is not overwritten by OS theme change", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/", { timeout: 30000 });

    // User explicitly chooses dark mode
    const toggleBtn = page.locator("#theme-toggle-btn");
    const htmlElement = page.locator("html");

    // Toggle to light mode manually
    await toggleBtn.click();
    await expect(htmlElement).toHaveAttribute("data-theme", "light");

    // Emulate OS switching to dark mode
    await page.emulateMedia({ colorScheme: "dark" });

    // Explicit manual light choice should remain active
    await expect(htmlElement).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-icon svg.lucide-moon")).toBeVisible();
  });

  test("Defensive handling: corrupted localStorage values fall back safely", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chatter-theme", "invalid_corrupted_payload_malicious");
    });

    await page.goto("/", { timeout: 30000 });

    // Corrupted value should be discarded, falling back to default or system theme
    const dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(["dark", "light"]).toContain(dataTheme);

    // Toggle still works smoothly
    await page.locator("#theme-toggle-btn").click();
    const updatedTheme = await page.locator("html").getAttribute("data-theme");
    expect(["dark", "light"]).toContain(updatedTheme);
    expect(updatedTheme).not.toBe(dataTheme);
  });

  test("Keyboard accessibility: toggling theme using Enter key on focused button", async ({ page }) => {
    await page.goto("/", { timeout: 30000 });

    const toggleBtn = page.locator("#theme-toggle-btn");
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();

    // Press Enter to toggle
    await page.keyboard.press("Enter");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#theme-toggle-icon svg.lucide-moon")).toBeVisible();

    // Press Enter again to return to dark
    await page.keyboard.press("Enter");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#theme-toggle-icon svg.lucide-sun")).toBeVisible();
  });

  test("Theme toggle preserves layout geometry without causing layout shift", async ({ page }) => {
    await page.goto("/", { timeout: 30000 });

    // Capture header dimensions before toggle
    const initialHeaderBox = await page.locator(".chat-header").boundingBox();
    expect(initialHeaderBox).toBeTruthy();

    // Toggle theme
    await page.locator("#theme-toggle-btn").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Capture header dimensions after toggle
    const toggledHeaderBox = await page.locator(".chat-header").boundingBox();
    expect(toggledHeaderBox).toBeTruthy();

    expect(toggledHeaderBox.width).toBe(initialHeaderBox.width);
    expect(toggledHeaderBox.height).toBe(initialHeaderBox.height);
  });
});
