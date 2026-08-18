const { test, expect } = require('@playwright/test');

test.describe('Sprint 8: Interactive Polish — Lucide Iconography, Emoji Quick-Picker & Input Ergonomics', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('Lucide inline SVG icons render across header, sidebar, badges, and input controls', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    // 1. Initial Username Modal Brand Badge Icon
    const modalLogoSvg = page.locator('.modal-header .brand-badge svg.lucide-message-square');
    await expect(modalLogoSvg).toBeVisible();

    // Join chat
    await page.locator('#username-input').fill('Alice');
    await page.locator('#join-btn').click();
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // 2. Chat Header Icons
    const sidebarToggleSvg = page.locator('#sidebar-toggle-btn svg.lucide-menu');
    await expect(sidebarToggleSvg).toBeAttached();

    const themeToggleSvg = page.locator('#theme-toggle-btn svg.lucide-sun');
    await expect(themeToggleSvg).toBeVisible();

    const presenceSvg = page.locator('#user-count-badge svg.lucide-users');
    await expect(presenceSvg).toBeVisible();

    // 3. Sidebar Close Button Icon
    const sidebarCloseSvg = page.locator('#sidebar-close-btn svg.lucide-x');
    await expect(sidebarCloseSvg).toBeAttached();

    // 4. Chat Input Bar Icons
    const emojiToggleSvg = page.locator('#emoji-toggle-btn svg.lucide-smile');
    await expect(emojiToggleSvg).toBeVisible();

    const sendBtnSvg = page.locator('#send-btn svg.lucide-send');
    await expect(sendBtnSvg).toBeVisible();

    // 5. Scroll Jump Button Icon
    const scrollJumpSvg = page.locator('#scroll-bottom-btn svg.lucide-arrow-down');
    await expect(scrollJumpSvg).toBeAttached();
  });

  test('Emoji quick-picker popover opens and renders curated grid of interactive buttons', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('#username-input').fill('Bob');
    await page.locator('#join-btn').click();

    const emojiPicker = page.locator('#emoji-picker');
    const emojiToggleBtn = page.locator('#emoji-toggle-btn');

    // Initially hidden
    await expect(emojiPicker).toHaveClass(/hidden/);
    await expect(emojiToggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Click toggle button to open
    await emojiToggleBtn.click();
    await expect(emojiPicker).not.toHaveClass(/hidden/);
    await expect(emojiToggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(emojiPicker).toHaveAttribute('aria-hidden', 'false');

    // Verify emoji buttons in grid
    const emojiButtons = page.locator('#emoji-grid .emoji-btn');
    const count = await emojiButtons.count();
    expect(count).toBeGreaterThanOrEqual(32);

    // Check first emoji button accessibility attributes
    const firstBtn = emojiButtons.first();
    await expect(firstBtn).toHaveAttribute('aria-label', /emoji/);
    await expect(firstBtn).toHaveAttribute('data-emoji');
  });

  test('Clicking emoji inserts character into message input and preserves caret position', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('#username-input').fill('Charlie');
    await page.locator('#join-btn').click();

    const messageInput = page.locator('#message-input');
    const emojiToggleBtn = page.locator('#emoji-toggle-btn');
    const emojiPicker = page.locator('#emoji-picker');

    // 1. Insert into empty input
    await emojiToggleBtn.click();
    await expect(emojiPicker).not.toHaveClass(/hidden/);
    const rocketBtn = page.locator('#emoji-grid .emoji-btn[data-emoji="🚀"]');
    await rocketBtn.click();

    await expect(messageInput).toHaveValue('🚀');
    await expect(messageInput).toBeFocused();

    // Close picker via outside click before next scenario
    await page.locator('#messages-container').click();
    await expect(emojiPicker).toHaveClass(/hidden/);

    // 2. Caret-preserving insertion in the middle of draft text
    await messageInput.fill('Hello World');
    // Set selection range to position between "Hello" and " World" (index 5)
    await page.evaluate(() => {
      const input = document.getElementById('message-input');
      input.setSelectionRange(5, 5);
    });

    await emojiToggleBtn.click();
    await expect(emojiPicker).not.toHaveClass(/hidden/);
    const fireBtn = page.locator('#emoji-grid .emoji-btn[data-emoji="🔥"]');
    await fireBtn.click();

    // Expected value: "Hello🔥 World"
    await expect(messageInput).toHaveValue('Hello🔥 World');
    await expect(messageInput).toBeFocused();

    // Check caret position after insertion
    const caretPos = await page.evaluate(() => {
      const input = document.getElementById('message-input');
      return input.selectionStart;
    });
    expect(caretPos).toBe(5 + '🔥'.length);
  });

  test('Clicking outside emoji picker auto-dismisses popover and updates ARIA state', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('#username-input').fill('David');
    await page.locator('#join-btn').click();

    const emojiPicker = page.locator('#emoji-picker');
    const emojiToggleBtn = page.locator('#emoji-toggle-btn');

    // Open picker
    await emojiToggleBtn.click();
    await expect(emojiPicker).not.toHaveClass(/hidden/);
    await expect(emojiToggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Click outside on messages container
    await page.locator('#messages-container').click();

    // Picker should be closed
    await expect(emojiPicker).toHaveClass(/hidden/);
    await expect(emojiToggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(emojiPicker).toHaveAttribute('aria-hidden', 'true');
  });

  test('Escape key closes emoji picker and returns focus to toggle button', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('#username-input').fill('Emma');
    await page.locator('#join-btn').click();

    const emojiPicker = page.locator('#emoji-picker');
    const emojiToggleBtn = page.locator('#emoji-toggle-btn');

    // Open picker
    await emojiToggleBtn.click();
    await expect(emojiPicker).not.toHaveClass(/hidden/);

    // Press Escape
    await page.keyboard.press('Escape');

    // Picker closes and focus returns to toggle button
    await expect(emojiPicker).toHaveClass(/hidden/);
    await expect(emojiToggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(emojiToggleBtn).toBeFocused();
  });

  test('Submitting message closes open emoji picker and resets character counter', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('#username-input').fill('Frank');
    await page.locator('#join-btn').click();

    const emojiPicker = page.locator('#emoji-picker');
    const emojiToggleBtn = page.locator('#emoji-toggle-btn');
    const messageInput = page.locator('#message-input');
    const charCounter = page.locator('#char-counter');

    // Open picker and insert emoji
    await emojiToggleBtn.click();
    await page.locator('#emoji-grid .emoji-btn[data-emoji="🎉"]').click();
    await expect(emojiPicker).not.toHaveClass(/hidden/);

    // Send message
    await page.locator('#send-btn').click();

    // Popover is dismissed, input cleared, counter reset
    await expect(emojiPicker).toHaveClass(/hidden/);
    await expect(messageInput).toHaveValue('');
    await expect(charCounter).toHaveText('0/500');
  });

  test('Live character counter updates reactively with threshold classes (warning at 450, danger at 500)', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await page.locator('#username-input').fill('Grace');
    await page.locator('#join-btn').click();

    const messageInput = page.locator('#message-input');
    const charCounter = page.locator('#char-counter');

    // 1. Initial State
    await expect(charCounter).toHaveText('0/500');
    await expect(charCounter).not.toHaveClass(/warning/);
    await expect(charCounter).not.toHaveClass(/danger/);

    // 2. Normal typing below warning threshold (<450)
    await messageInput.fill('Hello world');
    await expect(charCounter).toHaveText('11/500');
    await expect(charCounter).not.toHaveClass(/warning/);
    await expect(charCounter).not.toHaveClass(/danger/);

    // 3. Warning threshold (>=450 and <500)
    const text460 = 'a'.repeat(460);
    await messageInput.fill(text460);
    await expect(charCounter).toHaveText('460/500');
    await expect(charCounter).toHaveClass(/warning/);
    await expect(charCounter).not.toHaveClass(/danger/);

    // 4. Max limit boundary (500)
    const text500 = 'a'.repeat(500);
    await messageInput.fill(text500);
    await expect(charCounter).toHaveText('500/500');
    await expect(charCounter).toHaveClass(/danger/);

    // 5. Input maxlength boundary prevents typing beyond 500 characters
    await messageInput.pressSequentially('extra_characters');
    await expect(messageInput).toHaveValue(text500);
    await expect(charCounter).toHaveText('500/500');
  });

  test('Accessibility landmarks and WAI-ARIA attributes across interactive components', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    // Username modal
    const modal = page.locator('#username-modal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

    await page.locator('#username-input').fill('Hannah');
    await page.locator('#join-btn').click();

    // Messages feed
    const messagesList = page.locator('#messages-list');
    await expect(messagesList).toHaveAttribute('role', 'log');
    await expect(messagesList).toHaveAttribute('aria-live', 'polite');

    // Character counter
    const charCounter = page.locator('#char-counter');
    await expect(charCounter).toHaveAttribute('aria-live', 'polite');

    // Buttons
    const sendBtn = page.locator('#send-btn');
    await expect(sendBtn).toHaveAttribute('aria-label', 'Send message');

    const themeBtn = page.locator('#theme-toggle-btn');
    await expect(themeBtn).toHaveAttribute('aria-label', /theme/i);
  });
});
