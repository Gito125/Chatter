const { test, expect } = require('@playwright/test');

test.describe('Message Stream Polish — Grouping, Timestamps & Smart Auto-Scroll', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('Consecutive messages within 2 minutes collapse duplicate headers into grouped bubbles', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { timeout: 30000 });

    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // Send 3 consecutive messages in quick succession
    await page.fill('#message-input', 'First message');
    await page.click('#send-btn');

    await page.fill('#message-input', 'Second message');
    await page.click('#send-btn');

    await page.fill('#message-input', 'Third message');
    await page.click('#send-btn');

    const messageItems = page.locator('#messages-list .message-item');
    await expect(messageItems).toHaveCount(3);

    // First message should not have .grouped class and should display header
    await expect(messageItems.nth(0)).not.toHaveClass(/grouped/);
    await expect(messageItems.nth(0).locator('.message-sender')).toHaveText('You');

    // Second and third messages should have .grouped class
    await expect(messageItems.nth(1)).toHaveClass(/grouped/);
    await expect(messageItems.nth(2)).toHaveClass(/grouped/);

    await context.close();
  });

  test('Alternating senders do not group messages together', async ({ browser }) => {
    // Context 1: Alice
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);

    // Context 2: Bob
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    // Alice sends message 1
    await page1.fill('#message-input', 'Alice says hello');
    await page1.click('#send-btn');

    // Bob sends message 2
    await page2.fill('#message-input', 'Bob replies hi');
    await page2.click('#send-btn');

    // Alice sends message 3
    await page1.fill('#message-input', 'Alice follows up');
    await page1.click('#send-btn');

    // Check Alice's feed
    const aliceFeed = page1.locator('#messages-list .message-item');
    await expect(aliceFeed).toHaveCount(3);

    // None of the alternating messages should be grouped
    await expect(aliceFeed.nth(0)).not.toHaveClass(/grouped/);
    await expect(aliceFeed.nth(1)).not.toHaveClass(/grouped/);
    await expect(aliceFeed.nth(2)).not.toHaveClass(/grouped/);

    await context1.close();
    await context2.close();
  });

  test('System message resets grouping so next message displays full header', async ({ browser }) => {
    // Context 1: Alice
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);

    // Alice sends first message
    await page1.fill('#message-input', 'Message before join');
    await page1.click('#send-btn');

    // Context 2: Bob joins (triggers system message "Bob joined the chat" on Alice's screen)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    await expect(page1.locator('#messages-list .message-system')).toContainText('Bob joined the chat');

    // Alice sends second message
    await page1.fill('#message-input', 'Message after join');
    await page1.click('#send-btn');

    const aliceItems = page1.locator('#messages-list .message-item');
    await expect(aliceItems).toHaveCount(2);

    // Second message should NOT be grouped because system message intervened
    await expect(aliceItems.nth(1)).not.toHaveClass(/grouped/);

    await context1.close();
    await context2.close();
  });

  test('Timestamp tooltips display localized full date string in title attribute', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { timeout: 30000 });

    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    await page.fill('#message-input', 'Testing tooltip timestamps');
    await page.click('#send-btn');

    const messageTime = page.locator('#messages-list .message-time').first();
    await expect(messageTime).toBeVisible();

    const titleAttr = await messageTime.getAttribute('title');
    expect(titleAttr).toBeTruthy();
    expect(titleAttr.length).toBeGreaterThan(5);

    const bubbleTitleAttr = await page.locator('#messages-list .message-bubble').first().getAttribute('title');
    expect(bubbleTitleAttr).toBeTruthy();

    await context.close();
  });

  test('Smart auto-scroll preserves scroll position when user scrolled up and displays jump button', async ({ browser }) => {
    // Context 1: Reader (Alice)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);

    // Context 2: Sender (Bob)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    // Populate feed with enough messages to enable scrolling
    for (let i = 1; i <= 20; i++) {
      await page2.fill('#message-input', `Bulk message ${i}`);
      await page2.click('#send-btn');
    }

    // Verify Alice has received all 20 messages
    await expect(page1.locator('#messages-list .message-item')).toHaveCount(20);

    // Alice scrolls up to the top
    await page1.evaluate(() => {
      const container = document.getElementById('messages-container');
      if (container) container.scrollTop = 0;
    });

    const initialScrollTop = await page1.evaluate(() => {
      const container = document.getElementById('messages-container');
      return container ? container.scrollTop : 0;
    });
    expect(initialScrollTop).toBe(0);

    // Initial state: jump button should be hidden or become visible on new incoming message
    // Bob sends a new message while Alice is scrolled up
    await page2.fill('#message-input', 'New incoming message while scrolled up');
    await page2.click('#send-btn');

    // Alice receives the 21st message
    await expect(page1.locator('#messages-list .message-item')).toHaveCount(21);

    // Alice's scroll position must be preserved (not auto-scrolled down)
    const scrollTopAfterReceive = await page1.evaluate(() => {
      const container = document.getElementById('messages-container');
      return container ? container.scrollTop : -1;
    });
    expect(scrollTopAfterReceive).toBeLessThan(100);

    // Floating jump button must be visible
    const jumpBtn = page1.locator('#scroll-bottom-btn');
    await expect(jumpBtn).not.toHaveClass(/hidden/);
    await expect(page1.locator('#scroll-bottom-text')).toHaveText(/New messages below/);

    // Click floating jump button
    await jumpBtn.click();

    // Viewport should scroll down to bottom and jump button should become hidden
    await expect(jumpBtn).toHaveClass(/hidden/);

    await expect.poll(async () => {
      return await page1.evaluate(() => {
        const container = document.getElementById('messages-container');
        if (!container) return false;
        return container.scrollHeight - container.scrollTop - container.clientHeight <= 100;
      });
    }).toBe(true);

    await context1.close();
    await context2.close();
  });

  test('Manually scrolling back to bottom automatically hides jump button', async ({ browser }) => {
    // Context 1: Alice
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);

    // Context 2: Bob
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    // Create scrollable content
    for (let i = 1; i <= 20; i++) {
      await page2.fill('#message-input', `Fill message ${i}`);
      await page2.click('#send-btn');
    }
    await expect(page1.locator('#messages-list .message-item')).toHaveCount(20);

    // Alice scrolls up
    await page1.evaluate(() => {
      const container = document.getElementById('messages-container');
      if (container) container.scrollTop = 0;
    });

    // Bob sends message
    await page2.fill('#message-input', 'Trigger jump button');
    await page2.click('#send-btn');

    // Jump button is visible
    const jumpBtn = page1.locator('#scroll-bottom-btn');
    await expect(jumpBtn).not.toHaveClass(/hidden/);

    // Alice manually scrolls down to bottom
    await page1.evaluate(() => {
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
        container.dispatchEvent(new Event('scroll'));
      }
    });

    // Jump button should automatically hide
    await expect(jumpBtn).toHaveClass(/hidden/);

    await context1.close();
    await context2.close();
  });

  test('Sending own message while scrolled up scrolls to bottom and hides jump button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { timeout: 30000 });
    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    // Create scrollable content
    for (let i = 1; i <= 20; i++) {
      await page.fill('#message-input', `Self fill ${i}`);
      await page.click('#send-btn');
    }
    await expect(page.locator('#messages-list .message-item')).toHaveCount(20);

    // Scroll up
    await page.evaluate(() => {
      const container = document.getElementById('messages-container');
      if (container) container.scrollTop = 0;
    });

    // Send another message
    await page.fill('#message-input', 'My own new message');
    await page.click('#send-btn');

    // Should immediately scroll to bottom and hide jump button
    await expect(page.locator('#scroll-bottom-btn')).toHaveClass(/hidden/);

    const isAtBottom = await page.evaluate(() => {
      const container = document.getElementById('messages-container');
      if (!container) return false;
      return container.scrollHeight - container.scrollTop - container.clientHeight <= 100;
    });
    expect(isAtBottom).toBe(true);

    await context.close();
  });

  test('New user receives message history on join and renders properly', async ({ browser }) => {
    // Context 1: Alice (Existing user)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');
    await expect(page1.locator('#username-modal')).toHaveClass(/hidden/);

    // Alice sends 3 messages
    await page1.fill('#message-input', 'History msg 1');
    await page1.click('#send-btn');
    await page1.fill('#message-input', 'History msg 2');
    await page1.click('#send-btn');
    await page1.fill('#message-input', 'History msg 3');
    await page1.click('#send-btn');

    await expect(page1.locator('#messages-list .message-item')).toHaveCount(3);

    // Context 2: Charlie joins fresh
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Charlie');
    await page2.click('#join-btn');
    await expect(page2.locator('#username-modal')).toHaveClass(/hidden/);

    // Charlie should immediately see all 3 history messages
    const charlieItems = page2.locator('#messages-list .message-item');
    await expect(charlieItems).toHaveCount(3);
    await expect(charlieItems.nth(0)).toContainText('History msg 1');
    await expect(charlieItems.nth(1)).toContainText('History msg 2');
    await expect(charlieItems.nth(2)).toContainText('History msg 3');

    // Grouping should be applied to history messages
    await expect(charlieItems.nth(0)).not.toHaveClass(/grouped/);
    await expect(charlieItems.nth(1)).toHaveClass(/grouped/);
    await expect(charlieItems.nth(2)).toHaveClass(/grouped/);

    // Jump button should remain hidden on initial history view
    await expect(page2.locator('#scroll-bottom-btn')).toHaveClass(/hidden/);

    await context1.close();
    await context2.close();
  });

  test('Adversarial: XSS in message text and tooltips is rendered safely', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { timeout: 30000 });
    await page.fill('#username-input', 'Alice');
    await page.click('#join-btn');
    await expect(page.locator('#username-modal')).toHaveClass(/hidden/);

    const xssPayload = '<img src=x onerror=alert(1)>';
    await page.fill('#message-input', xssPayload);
    await page.click('#send-btn');

    const bubble = page.locator('#messages-list .message-bubble').first();
    await expect(bubble).toHaveText(xssPayload);

    // Verify no img or script tags exist inside messages container
    const dangerousElements = await page.locator('#messages-list img, #messages-list script').count();
    expect(dangerousElements).toBe(0);

    await context.close();
  });
});
