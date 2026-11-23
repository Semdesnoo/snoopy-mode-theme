// Screenshot + sanity checks of preview routes.
// Usage: node shot.mjs <route> <name> [w=1440] [h=900] [full=1]
import { chromium } from 'playwright';
const [, , route = '/', name = 'shot', w = '1440', h = '900', full = '1'] = process.argv;
const OUT = 'C:/Users/Gebruiker/AppData/Local/hermes/cache/scratch/smshots/';
const b = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 800 ? 2 : 1, isMobile: +w < 800, hasTouch: +w < 800 });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
p.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) errs.push(r.status() + ' ' + r.url().slice(0, 120)); });
await p.goto('http://localhost:4190' + route, { waitUntil: 'load', timeout: 60000 });
for (let y = 0; y < 16000; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(90); }
await p.addStyleTag({ content: '*{content-visibility:visible!important}' }); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500);
const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, h: document.documentElement.scrollHeight, broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 80)).slice(0, 5) }));
await p.screenshot({ path: OUT + name + '.png', fullPage: full === '1' });
console.log(name, JSON.stringify(info), errs.slice(0, 8).join(' | '));
await b.close();
