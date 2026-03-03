// Simple smoke test using global fetch (Node 18+)
(async ()=>{
  const base = 'http://localhost:5000/api';
  try {
    console.log('Registering test user...');
    let r = await fetch(base + '/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'SmokeUser', phone: '9999999999', password: 'pass123', roomCode: 'R1' }) });
    console.log('register status', r.status);
    console.log(await r.text());

    console.log('Logging in...');
    r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: '9999999999', password: 'pass123' }) });
    console.log('login status', r.status);
    const login = await r.json().catch(()=>null);
    console.log('login body', login);
    if (!login || !login.token) return console.error('Login failed — check backend logs');
    const token = login.token;

    console.log('Adding expense...');
    r = await fetch(base + '/expenses', { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token }, body: JSON.stringify({ amount: 123.45, category: 'Food', notes: 'Smoke test' }) });
    console.log('add expense status', r.status);
    console.log(await r.text());

    console.log('Fetching recent...');
    r = await fetch(base + '/expenses/recent', { headers: { 'authorization': 'Bearer ' + token } });
    console.log('recent status', r.status);
    console.log(await r.text());
  } catch (err) {
    console.error('Smoke error', err);
  }
})();
