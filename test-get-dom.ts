import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://tms-neon-omega.vercel.app/login", { waitUntil: 'networkidle' });
  
  const dom = await page.evaluate(() => {
    const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="textbox"], [role="menuitem"]');
    const visibleElements = Array.from(elements).filter((el) => {
      const e = el as HTMLElement;
      return e.offsetWidth > 0 && e.offsetHeight > 0 && window.getComputedStyle(e).visibility !== 'hidden' && window.getComputedStyle(e).display !== 'none';
    });
    
    return visibleElements.map(el => {
      const e = el as HTMLElement;
      const tag = e.tagName.toLowerCase();
      const props = [];
      if (e.id) props.push(`id=${e.id}`);
      if (e.getAttribute('type')) props.push(`type=${e.getAttribute('type')}`);
      if (e.getAttribute('name')) props.push(`name=${e.getAttribute('name')}`);
      if (e.getAttribute('placeholder')) props.push(`placeholder="${e.getAttribute('placeholder')}"`);
      if (e.getAttribute('aria-label')) props.push(`aria="${e.getAttribute('aria-label')}"`);
      
      const text = (e.innerText || e.getAttribute('value') || '').trim().substring(0, 30).replace(/\\n/g, ' ');
      return `[${tag}] ${text} {${props.join(',')}}`;
    }).join('\n');
  });
  
  console.log(dom);
  await browser.close();
}

run().catch(console.error);
