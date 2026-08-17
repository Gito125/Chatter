const { test, expect } = require('@playwright/test');

test.describe('Real-Time Presence and Live Online Users Roster', () => {
  test('Single client joins and appears in roster as You', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    // Username modal is visible
    const modal = page.locator('#username-modal');
    await expect(modal).toBeVisible();

    // Enter username and submit
    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');

    // Modal should disappear
    await expect(modal).toHaveClass(/hidden/);

    // Online count badges should show 1 online
    await expect(page.locator('#user-count-text')).toHaveText('1 online');
    await expect(page.locator('#sidebar-user-count')).toHaveText('1');

    // Roster should contain Alice with "You" badge and online dot
    const userItem = page.locator('#users-list .user-item');
    await expect(userItem).toHaveCount(1);
    await expect(userItem.locator('.user-name')).toHaveText('Alice');
    await expect(userItem.locator('.user-avatar')).toHaveText('A');
    await expect(userItem.locator('.user-tag-self')).toHaveText('You');
    await expect(userItem.locator('.status-dot.online')).toBeVisible();
  });

  test('Multi-client presence: user joining and leaving updates roster and displays system messages', async ({ browser }) => {
    // Context 1: Alice
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });

    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);
    await expect(page1.locator('#user-count-text')).toHaveText('1 online');

    // Context 2: Bob
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });

    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    // Verify Bob's view (both Alice and Bob online)
    await expect(page2.locator('#user-count-text')).toHaveText('2 online');
    await expect(page2.locator('#sidebar-user-count')).toHaveText('2');
    const page2Users = page2.locator('#users-list .user-item');
    await expect(page2Users).toHaveCount(2);

    // Verify Alice's view updated in real-time
    await expect(page1.locator('#user-count-text')).toHaveText('2 online');
    await expect(page1.locator('#sidebar-user-count')).toHaveText('2');
    const page1Users = page1.locator('#users-list .user-item');
    await expect(page1Users).toHaveCount(2);

    // Verify Alice saw system message that Bob joined
    const systemNotice = page1.locator('#messages-list .message-system');
    await expect(systemNotice).toContainText('Bob joined the chat');

    // Bob disconnects (closes tab)
    await page2.close();
    await context2.close();

    // Verify Alice receives Bob's departure
    await expect(page1.locator('#user-count-text')).toHaveText('1 online');
    await expect(page1.locator('#sidebar-user-count')).toHaveText('1');
    await expect(page1.locator('#users-list .user-item')).toHaveCount(1);
    await expect(page1.locator('#messages-list .message-system').last()).toContainText('Bob left the chat');

    await context1.close();
  });

  test('Adversarial: XSS payload in username is rendered safely', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });

    const xssUsername = '<script>alert(1)</script>';
    await page.fill('#username-input', xssUsername);
    await page.click('#join-btn');

    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);
    const userItem = page.locator('#users-list .user-item');
    await expect(userItem.locator('.user-name')).toHaveText(xssUsername);

    // Verify no alert or script execution occurred
    const scriptElements = await page.locator('#users-list script').count();
    expect(scriptElements).toBe(0);
  });
});
