const { test, expect } = require('@playwright/test');

test.describe('Real-Time Typing Indicators & Debounced Activity Engine', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('Typing in input displays typing banner on peer screen and hides on sender screen', async ({ browser }) => {
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

    // Initial state: typing indicator is hidden on both screens
    await expect(page1.locator('#typing-indicator')).toHaveClass(/hidden/);
    await expect(page2.locator('#typing-indicator')).toHaveClass(/hidden/);

    // Alice types in the message input
    await page1.fill('#message-input', 'Hello');

    // Bob should see "Alice is typing..."
    const bobTypingIndicator = page2.locator('#typing-indicator');
    await expect(bobTypingIndicator).not.toHaveClass(/hidden/);
    await expect(page2.locator('#typing-text')).toHaveText('Alice is typing...');
    await expect(page2.locator('.typing-dots')).toBeVisible();

    // Alice (sender) should NOT see the typing indicator
    await expect(page1.locator('#typing-indicator')).toHaveClass(/hidden/);

    // Alice clears the input text immediately
    await page1.fill('#message-input', '');

    // Bob's typing indicator should disappear immediately
    await expect(bobTypingIndicator).toHaveClass(/hidden/);

    await context1.close();
    await context2.close();
  });

  test('Inactivity auto-clears typing indicator after 3000ms debounce', async ({ browser }) => {
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

    // Alice types
    await page1.fill('#message-input', 'Waiting...');
    await expect(page2.locator('#typing-indicator')).not.toHaveClass(/hidden/);
    await expect(page2.locator('#typing-text')).toHaveText('Alice is typing...');

    // Wait for 3500ms inactivity debounce to expire
    await page1.waitForTimeout(3500);

    // Bob's indicator should automatically be hidden
    await expect(page2.locator('#typing-indicator')).toHaveClass(/hidden/);

    await context1.close();
    await context2.close();
  });

  test('Submitting a message immediately dismisses the typing indicator', async ({ browser }) => {
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

    // Alice types
    await page1.fill('#message-input', 'Immediate send');
    await expect(page2.locator('#typing-indicator')).not.toHaveClass(/hidden/);

    // Alice submits message
    await page1.click('#send-btn');

    // Bob receives message and typing indicator is immediately dismissed
    await expect(page2.locator('.message-item').last()).toContainText('Immediate send');
    await expect(page2.locator('#typing-indicator')).toHaveClass(/hidden/);

    await context1.close();
    await context2.close();
  });

  test('Multi-user typing pluralization handles 2 and 3+ concurrent typers', async ({ browser }) => {
    // Context 1: Alice
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');

    // Context 2: Bob
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');

    // Context 3: Charlie
    const context3 = await browser.newContext();
    const page3 = await context3.newPage();
    await page3.goto('/', { timeout: 30000 });
    await page3.fill('#username-input', 'Charlie');
    await page3.click('#join-btn');

    // Context 4: Dave (Observer)
    const context4 = await browser.newContext();
    const page4 = await context4.newPage();
    await page4.goto('/', { timeout: 30000 });
    await page4.fill('#username-input', 'Dave');
    await page4.click('#join-btn');

    // 1 typer: Alice types
    await page1.fill('#message-input', 'Alice note');
    await expect(page4.locator('#typing-text')).toHaveText('Alice is typing...');

    // 2 typers: Bob also types
    await page2.fill('#message-input', 'Bob note');
    await expect(page4.locator('#typing-text')).toHaveText('Alice and Bob are typing...');

    // 3 typers: Charlie also types
    await page3.fill('#message-input', 'Charlie note');
    await expect(page4.locator('#typing-text')).toHaveText('Several people are typing...');

    // Alice stops typing (clears input)
    await page1.fill('#message-input', '');
    await expect(page4.locator('#typing-text')).toHaveText('Bob and Charlie are typing...');

    // Bob stops typing (clears input)
    await page2.fill('#message-input', '');
    await expect(page4.locator('#typing-text')).toHaveText('Charlie is typing...');

    // Charlie stops typing (clears input)
    await page3.fill('#message-input', '');
    await expect(page4.locator('#typing-indicator')).toHaveClass(/hidden/);

    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
  });

  test('Peer disconnecting while typing immediately clears typing indicator', async ({ browser }) => {
    // Context 1: Alice
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    await page1.fill('#username-input', 'Alice');
    await page1.click('#join-btn');

    // Context 2: Bob
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');

    // Alice starts typing
    await page1.fill('#message-input', 'Unfinished thought...');
    await expect(page2.locator('#typing-text')).toHaveText('Alice is typing...');

    // Alice abruptly closes tab
    await page1.close();
    await context1.close();

    // Bob's typing indicator should clear immediately
    await expect(page2.locator('#typing-indicator')).toHaveClass(/hidden/);
    await expect(page2.locator('#messages-list .message-system').last()).toContainText('Alice left the chat');

    await context2.close();
  });

  test('Adversarial: XSS payload in username is rendered safely in typing indicator', async ({ browser }) => {
    // Context 1: Attacker with HTML in username (<= 25 chars)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/', { timeout: 30000 });
    const xssUsername = '<script>alert(1)</script>';
    await page1.fill('#username-input', xssUsername);
    await page1.click('#join-btn');

    // Context 2: Victim (Bob)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/', { timeout: 30000 });
    await page2.fill('#username-input', 'Bob');
    await page2.click('#join-btn');

    // Attacker types
    await page1.fill('#message-input', 'payload');

    // Victim sees literal plain text
    await expect(page2.locator('#typing-text')).toHaveText(`${xssUsername} is typing...`);

    // Verify no script tag was injected into typing indicator
    const scriptCount = await page2.locator('#typing-indicator script').count();
    expect(scriptCount).toBe(0);

    await context1.close();
    await context2.close();
  });
});
