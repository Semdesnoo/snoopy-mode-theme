// Interaction checks on the preview (desktop + mobile).
import { chromium } from 'playwright';
const OUT = 'C:/Users/Gebruiker/AppData/Local/hermes/cache/scratch/smshots/';
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
for (const [w, h, mob] of [[1440, 900, false], [390, 844, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:4190/', { waitUntil: 'load' });
  await p.waitForTimeout(800);
  // tabs
  await p.click('.ptabs__tab:nth-child(2)');
  await p.waitForTimeout(400);
  const vis = await p.evaluate(() => [...document.querySelectorAll('[data-panel]')].map((x) => !x.hidden));
  ok(vis[1] && !vis[0], `${w} tab 2 shows panel 2 ${JSON.stringify(vis)}`);
  const cardsVisible = await p.evaluate(() => { const c = document.querySelector('[data-panel]:not([hidden]) .product-card'); return c && getComputedStyle(c).opacity; });
  ok(cardsVisible === '1', `${w} cards in tab 2 visible (opacity ${cardsVisible})`);
  if (!mob) {
    const before = await p.evaluate(() => document.querySelector('[data-panel]:not([hidden]) [data-carousel]').scrollLeft);
    await p.click('[data-carousel-next]'); await p.waitForTimeout(900);
    const after = await p.evaluate(() => document.querySelector('[data-panel]:not([hidden]) [data-carousel]').scrollLeft);
    ok(after > before, `${w} arrow scrolls ${before}->${after}`);
  }
  const vOverflow = await p.evaluate(() => [...document.querySelectorAll('[data-carousel]')].filter((t) => t.offsetParent && t.scrollHeight > t.clientHeight + 1).length);
  ok(vOverflow === 0, `${w} no vertical overflow in carousels`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), `${w} no horizontal page overflow`);
  if (mob) {
    await p.click('[data-menu-toggle]'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => document.querySelector('[data-mobile-nav]').getAttribute('aria-hidden') === 'false'), `${w} mobile menu opens`);
    await p.screenshot({ path: OUT + 'i-menu.png' });
    await p.click('[data-menu-close]'); await p.waitForTimeout(500);
  }
  await p.click('[data-cart-open]'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelector('[data-cart]').getAttribute('aria-hidden') === 'false'), `${w} cart drawer opens`);
  await p.screenshot({ path: OUT + `i-cart-${w}.png` });
  // product page: zoom dialog
  await p.goto('http://localhost:4190/products/golden-loose-blazer/', { waitUntil: 'load' }); await p.waitForTimeout(600);
  await p.click('[data-zoom="1"]'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelector('[data-pdp-zoom]').open), `${w} zoom dialog opens`);
  const sl = await p.evaluate(() => { const t = document.querySelector('[data-zoom-track]'); return [t.scrollLeft, t.clientWidth]; });
  ok(Math.abs(sl[0] - sl[1]) < 5, `${w} zoom starts at photo 2 (${sl})`);
  const fit = await p.evaluate(() => { const i = document.querySelectorAll('.pdp-zoom__slide img')[1]; return getComputedStyle(i).objectFit + ' ' + Math.round(i.getBoundingClientRect().height) + '/' + innerHeight; });
  console.log('   zoom img', fit);
  await p.screenshot({ path: OUT + `i-zoom-${w}.png` });
  await p.click('[data-zoom-close]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !document.querySelector('[data-pdp-zoom]').open && !document.body.classList.contains('is-locked')), `${w} zoom closes + unlocks scroll`);
  if (mob) {
    await p.evaluate(() => document.querySelector('[data-pdp-track]').scrollTo({ left: 9999 })); await p.waitForTimeout(700);
    ok(await p.evaluate(() => [...document.querySelectorAll('.pdp-gallery__dots span')].pop().classList.contains('is-active')), `${w} dots follow swipe`);
    const g = await p.evaluate(() => Math.round(document.querySelector('[data-pdp-track]').getBoundingClientRect().height));
    console.log('   mobile gallery height', g, 'of', h);
  }
  ok(errs.length === 0, `${w} no JS errors ${errs.join('|')}`);
  await p.close();
}
await b.close();
