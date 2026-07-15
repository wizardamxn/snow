import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (err) => console.log('pageerror:', err.message));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const startBtn = page.getByText('START EXPLORING');
if (await startBtn.count()) { await startBtn.click(); await page.waitForTimeout(500); }

await page.keyboard.down('w'); await page.waitForTimeout(900); await page.keyboard.up('w');
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForTimeout(500);
await page.screenshot({ path: 'C:/Users/amank/AppData/Local/Temp/claude/c--KAAMKAAJ-Personal-SIGMA-SIGMA/7c909f3b-15e5-490b-a5ed-e2dc446f0c9b/scratchpad/180_cave.png' });
await browser.close();
