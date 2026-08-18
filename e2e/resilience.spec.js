const { test, expect } = require('@playwright/test');

test.describe('Network Resilience, Connection Status UI & Reconnection Lifecycle', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('Duplicate username is rejected with actionable error feedback in modal', async ({ browser }) => {
    // Context 1: Alice joins
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });

    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);
    await expect(page1.locator('#user-count-text')).toHaveText('1 online');

    // Context 2: Second user tries to join with exact duplicate "Alice"
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });

    await page2.fill('#username-input', 'Alice');
    await page2.click('#join-btn');

    // Modal remains visible and displays duplicate error
    const modal2 = page2.locator('#username-modal');
    await expect(modal2).toBeVisible();
    await expect(page2.locator('#username-error')).toContainText('Username is already taken');

    // Second user tries case-insensitive duplicate "alice"
    await page2.fill('#username-input', 'alice');
    await page2.click('#join-btn');
    await expect(modal2).toBeVisible();
    await expect(page2.locator('#username-error')).toContainText('Username is already taken');

    // Second user enters unique username "Bob" -> succeeds
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');
    await expect(modal2).toHaveClass(/hidden/);
    await expect(page2.locator('#user-count-text')).toHaveText('2 online');

    await context1.close();
    await context2.close();
  });

  test('Socket disconnect triggers status banner, updates indicator dot, and locks chat inputs', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    // Join chat
    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // Initial state: connection status banner is hidden, chat inputs active
    const statusBanner = page.locator('#connection-status');
    await expect(statusBanner).toHaveClass(/hidden/);
    await expect(page.locator('#message-input')).toBeEnabled();
    await expect(page.locator('#send-btn')).toBeEnabled();

    // Trigger disconnect via client socket
    await page.evaluate(() => {
      window.Chatter.socket.socket.disconnect();
    });

    // Connection status banner should become visible with error styling and offline text
    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).not.toHaveClass(/hidden/);
    await expect(statusBanner).toHaveClass(/disconnected|error/);
    await expect(page.locator('#connection-status-text')).toContainText('Connection lost. Reconnecting...');
    await expect(page.locator('#connection-status-dot')).toHaveClass(/offline/);

    // Chat input and send button should be disabled
    await expect(page.locator('#message-input')).toBeDisabled();
    await expect(page.locator('#send-btn')).toBeDisabled();
    await expect(page.locator('#message-input')).toHaveAttribute('placeholder', /Disconnected/i);

    // Reconnect socket
    await page.evaluate(() => {
      window.Chatter.socket.socket.connect();
    });

    // Auto re-join restores chat session: inputs become enabled and status banner transitions to online
    await expect(page.locator('#message-input')).toBeEnabled();
    await expect(page.locator('#send-btn')).toBeEnabled();
    await expect(statusBanner).toHaveClass(/connected|success/);
    await expect(page.locator('#connection-status-text')).toContainText('Back online');

    // Status banner automatically hides after auto-dismiss timeout
    await expect(statusBanner).toHaveClass(/hidden/, { timeout: 4000 });
  });

  test('Reconnection attempt lifecycle renders warning banner and attempt telemetry', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const statusBanner = page.locator('#connection-status');

    // Simulate reconnection attempt event
    await page.evaluate(() => {
      window.Chatter.socket._notifyLifecycle('reconnect_attempt', 3);
    });

    await expect(statusBanner).toBeVisible();
    await expect(statusBanner).toHaveClass(/reconnecting|warning/);
    await expect(page.locator('#connection-status-dot')).toHaveClass(/warning/);
    await expect(page.locator('#connection-status-text')).toContainText('Reconnecting to server... (attempt 3)');
    await expect(page.locator('#message-input')).toBeDisabled();
    await expect(page.locator('#message-input')).toHaveAttribute('placeholder', /Reconnecting/i);
  });

  test('Reconnection collision: if username is claimed while offline, modal prompts user for new name', async ({ browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });

    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);

    // Alice disconnects
    await page1.evaluate(() => {
      window.Chatter.socket.socket.disconnect();
    });

    // Context 2: Bob connects and takes the username "Alice"
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Alice');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    // Alice reconnects -> server rejects re-join because 'Alice' is now taken
    await page1.evaluate(() => {
      window.Chatter.socket.socket.connect();
    });

    // Page 1 should re-open modal with duplicate username error
    const modal1 = page1.locator('#username-modal');
    await expect(modal1).toBeVisible();
    await expect(page1.locator('#username-error')).toContainText('Username is already taken');

    // Alice chooses a new username "Alice2" -> join succeeds
    await page1.fill('#username-input', 'Alice2');
    await page1.click('#join-btn');
    await expect(modal1).toHaveClass(/hidden/);
    await expect(page1.locator('#user-count-text')).toHaveText('2 online');

    await context1.close();
    await context2.close();
  });

  test('Adversarial: XSS payload in connection status message is rendered safely', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    const xssPayload = '<img src="x" onerror="window.__xss_test__=true">';

    await page.evaluate((payload) => {
      window.Chatter.ui.renderConnectionStatus('error', { message: payload });
    }, xssPayload);

    const statusText = page.locator('#connection-status-text');
    await expect(statusText).toHaveText(xssPayload);

    // Verify no img element was injected into DOM
    const imgCount = await page.locator('#connection-status img').count();
    expect(imgCount).toBe(0);

    const xssTriggered = await page.evaluate(() => Boolean(window.__xss_test__));
    expect(xssTriggered).toBe(false);
  });
});
