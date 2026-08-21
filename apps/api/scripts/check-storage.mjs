const baseUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const endpoint = `${baseUrl}/api/v1/health/storage`;

const response = await fetch(endpoint);
const body = await response.json();

console.log(JSON.stringify(body, null, 2));

const status = body?.data?.status;
if (response.ok && status === 'ok') {
  console.log('\nStorage check passed.');
  process.exit(0);
}

console.error('\nStorage check failed.');
process.exit(1);
