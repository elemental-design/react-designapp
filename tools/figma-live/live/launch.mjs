import { chromium } from 'playwright';
export async function connectPlugin(token, { restart = false } = {}) {
  const browser = await chromium.connectOverCDP(
    process.env.FIGMA_CDP_URL || 'http://127.0.0.1:9222',
  );
  try {
    const pages = browser.contexts().flatMap((c) => c.pages());
    const page = pages.find((p) =>
      process.env.FIGMA_DRAFT_URL
        ? p.url().split('?')[0] === process.env.FIGMA_DRAFT_URL.split('?')[0]
        : p.url().includes('/design/'),
    );
    if (!page) throw Error('Open a disposable Figma Draft in the test-mode app');
    const modal = page.getByTestId('pluginModalWindow');
    if (restart && (await modal.isVisible())) {
      await modal.getByLabel('Close', { exact: true }).click();
      await modal.waitFor({ state: 'hidden' });
    }
    if (!(await modal.isVisible())) {
      await page.keyboard.press('Meta+k');
      await page
        .getByTestId('quick-actions-search-input')
        .fill(process.env.FIGMA_PLUGIN_NAME || 'react-designapp live probe');
      await page
        .getByTestId('plugins-menu-item')
        .filter({ hasText: process.env.FIGMA_PLUGIN_NAME || 'react-designapp live probe' })
        .click();
    }
    await connectUI(page, token);
    return { browser, page };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function connectUI(page, token) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        if (!(await frame.locator('#connect').isVisible())) continue;
        await frame.locator('#token').fill(token, { timeout: 1500 });
        await frame.locator('#connect').click({ timeout: 1500 });
        return;
      } catch (error) {
        if (!frame.isDetached() && !String(error).includes('Frame was detached')) throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw Error('Live plugin UI missing');
}
