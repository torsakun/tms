async function run() {
  const res = await fetch('http://164.68.113.171:3000/api/projects/PRJ/cases/cm3n1u31w00085u0f2k50b69k/ai/explore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrl: 'https://tms-neon-omega.vercel.app',
      additionalContext: 'username supat.tor@gmail.com\npassword password123',
      modelProvider: 'openai'
    })
  });
  
  const text = await res.text();
  console.log(res.status, text);
}
run();
