const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = path.join(os.tmpdir(), `wayz-test-${Date.now()}`);
const app = require('../src/app');

let server;
let base;
test.before(async () => {
  await new Promise((r) => {
    server = app.listen(0, r);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const post = (url, body) =>
  fetch(base + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('incident lifecycle', async () => {
  const near = { latitude: 48.85, longitude: 2.35, user_latitude: 48.8501, user_longitude: 2.3501 };

  const far = await post('/incidents', { type: 'accident', ...near, user_latitude: 48.9 });
  assert.equal(far.status, 403);

  const bad = await post('/incidents', { type: 'nope', ...near });
  assert.equal(bad.status, 400);

  const created = await post('/incidents', { type: 'accident', ...near });
  assert.equal(created.status, 201);
  const inc = await created.json();

  const confirmed = await (await post(`/incidents/${inc.id}/confirm`, near)).json();
  assert.equal(confirmed.confirmed_count, 1);

  for (let i = 0; i < 4; i++) await post(`/incidents/${inc.id}/dismiss`, near);
  const list = await (await fetch(`${base}/incidents`)).json();
  assert.equal(list.length, 0);
});
