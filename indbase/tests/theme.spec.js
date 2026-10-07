const { test, expect } = require('@playwright/test');

async function openHomepage(page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#page-loader')).toBeHidden();
}

async function expectMobileMenuCollapsed(menu) {
  await expect(menu).toHaveClass(/\bsf-hidden\b/);
  await expect(menu).not.toHaveClass(/\bsf-expanded\b/);
  // Superfish clips the closed menu to 1px rather than setting display:none.
  await expect.poll(() => menu.evaluate(element => {
    const { width, height } = element.getBoundingClientRect();
    return width <= 1 && height <= 1;
  })).toBeTruthy();
}

test('header logo is visible and links home', async ({ page }) => {
  await openHomepage(page);
  const logo = page.locator('header .gst-logo a');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('href', '/');
  await expect(logo.locator('img')).toHaveAttribute('alt', /\S/);
  await expect(page.locator('header .site-title')).toBeVisible();
});

test('desktop navigation displays its main links', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop navigation is replaced by the mobile menu');
  await openHomepage(page);
  const nav = page.locator('.main-navigation');
  await expect(nav).toBeVisible();
  for (const name of ['Home', 'Services', 'GST LAW', 'News and Updates']) {
    await expect(nav.getByRole('menuitem', { name, exact: true })).toBeVisible();
  }
});

test('mobile menu opens and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation is displayed at narrow widths');
  await openHomepage(page);
  const toggle = page.locator('#superfish-main-toggle');
  const menu = page.locator('#superfish-main-accordion');
  await expect(toggle).toBeVisible();
  await expectMobileMenuCollapsed(menu);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Home', exact: true })).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expectMobileMenuCollapsed(menu);
});

test('news section displays titles and navigable links', async ({ page }) => {
  await openHomepage(page);
  const news = page.locator('.home-newsupdates');
  await expect(news).toBeVisible();
  const titles = news.locator('.news-header');
  await expect(titles.first()).toBeVisible();
  for (const title of await titles.all()) {
    await expect(title).toHaveText(/\S/);
  }
  const links = news.locator('a[href]');
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', /^(?!#?$|javascript:).+/);
  }
  const response = await page.request.get(await links.first().getAttribute('href'));
  expect(response.ok(), 'The first news link should resolve').toBeTruthy();
});

test('notification ticker displays readable text inside the page', async ({ page }) => {
  await openHomepage(page);
  const ticker = page.locator('.marquee-wrap');
  await expect(ticker).toBeVisible();
  await expect(ticker.locator('.notification-item').first()).toHaveText(/\S/);
  // Off-screen positioning and horizontal clipping are intentional for this marquee.
  const metrics = await ticker.evaluate(element => {
    const item = element.querySelector('.notification-item');
    // The flex ticker can be wider than the page; its outer block clips it intentionally.
    const container = element.closest('.block');
    return {
      height: element.getBoundingClientRect().height, textHeight: item.getBoundingClientRect().height,
      overflow: getComputedStyle(container).overflowX,
    };
  });
  expect(metrics.overflow).toBe('hidden');
  expect(metrics.height).toBeGreaterThanOrEqual(metrics.textHeight);
  // Keep the pointer away from the track because hover intentionally pauses it.
  await page.mouse.move(0, 0);
  const track = ticker.locator('.marquee-track');
  const initialOffset = await track.evaluate(element =>
    new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  await expect.poll(() => track.evaluate(element =>
    new DOMMatrixReadOnly(getComputedStyle(element).transform).m41))
    .not.toBe(initialOffset);
});

test('footer shows contact information and expected links', async ({ page, isMobile }) => {
  await openHomepage(page);
  await expect(page.locator('#footerMenu')).toBeVisible();
  await expect(page.locator('#contact-heading')).toHaveText('Contact Us');
  await expect(page.locator('#contact-main a[href="/grievance"]')).toBeVisible();
  if (!isMobile) {
    for (const name of ['About GST', 'Website Policies', 'Related Sites']) {
      await expect(page.locator('#footerMenu').getByRole('link', { name, exact: true })).toBeVisible();
    }
  }
  await expect(page.locator('.gst-footer-bottom-bar')).toBeVisible();
});

test('footer toggle works with the keyboard', async ({ page }) => {
  await openHomepage(page);
  const toggle = page.getByRole('button', { name: 'Toggle footer menu' });
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#footerMenu')).not.toHaveClass(/is-open/);
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#footerMenu')).toHaveClass(/is-open/);
});

test('keyboard users can skip to main content', async ({ page }) => {
  await openHomepage(page);
  await page.keyboard.press('Tab');
  const skip = page.locator('a[href="#main-content"]:focus');
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('navigation can be operated with the keyboard', async ({ page, isMobile }) => {
  await openHomepage(page);
  if (isMobile) {
    const toggle = page.locator('#superfish-main-toggle');
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await toggle.press('Enter');
    await expect(page.locator('#superfish-main-accordion')).toBeVisible();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expectMobileMenuCollapsed(page.locator('#superfish-main-accordion'));
  } else {
    const trigger = page.locator('.main-navigation .level-0-link[data-toggle="mega"]').first();
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await trigger.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.mega-panel:visible')).toHaveCount(1);
    await trigger.press('Escape');
    await expect(page.locator('.mega-panel:visible')).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
});

test('visible images load successfully', async ({ page }) => {
  await openHomepage(page);
  const images = page.locator('img:visible');
  expect(await images.count()).toBeGreaterThan(0);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0),
      { message: `Image should load: ${await image.getAttribute('src')}` }).toBeTruthy();
  }
});

test('homepage matches the theme screenshot baseline', async ({ page }) => {
  await openHomepage(page);
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
    // Content can change independently of the theme; retain its layout in the comparison.
    mask: [page.locator('.news-header'), page.locator('.news-date'),
      page.locator('.marquee-track'), page.locator('iframe'), page.locator('video')],
  });
});

test('homepage loads and shows its main content', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'The homepage should return an HTTP response').not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page.getByRole('main')).toBeVisible();
});

test('homepage fits the screen without horizontal scrolling', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));

  expect(dimensions.content, 'Page content should fit within the viewport')
    .toBeLessThanOrEqual(dimensions.viewport);
});
