const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log("Navigating...");
  await page.goto("https://tms-neon-omega.vercel.app/", { waitUntil: 'networkidle' }).catch(console.error);
  
  console.log("Waiting 2 seconds just in case...");
  await page.waitForTimeout(2000);
  
  const dom = await page.evaluate(() => {
    const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="menuitem"]');
    const visibleElements = Array.from(elements).filter((el) => {
      const e = el;
      return e.offsetWidth > 0 && e.offsetHeight > 0 && window.getComputedStyle(e).visibility !== 'hidden' && window.getComputedStyle(e).display !== 'none';
    });
    
    return visibleElements.map(el => {
      const e = el;
      const tag = e.tagName.toLowerCase();
      const props = [];
      if (e.id) props.push(`id=${e.id}`);
      if (e.getAttribute('type')) props.push(`type=${e.getAttribute('type')}`);
      if (e.getAttribute('name')) props.push(`name=${e.getAttribute('name')}`);
      if (e.getAttribute('placeholder')) props.push(`placeholder="${e.getAttribute('placeholder')}"`);
      if (e.getAttribute('aria-label')) props.push(`aria="${e.getAttribute('aria-label')}"`);
      
      const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 30).replace(/\n/g, ' ');
      return `[${tag}] ${text} {${props.join(',')}}`;
    }).join('\n');
  });
  
  console.log("=== DOM ===");
  console.log(dom || "EMPTY!");
  
  await browser.close();
}
run();
