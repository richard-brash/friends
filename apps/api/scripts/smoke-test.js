const crypto = require('node:crypto');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ORG_NAME = 'Friend Helper Outreach';

function deterministicUuid(seed) {
  const hex = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 32);
  const bytes = hex.split('');
  bytes[12] = '4';
  bytes[16] = ['8', '9', 'a', 'b'][parseInt(bytes[16], 16) % 4];
  return `${bytes.slice(0, 8).join('')}-${bytes.slice(8, 12).join('')}-${bytes
    .slice(12, 16)
    .join('')}-${bytes.slice(16, 20).join('')}-${bytes.slice(20, 32).join('')}`;
}

async function requestJson(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { res, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const organizationId = deterministicUuid(`organization:${ORG_NAME}`);
  const seedUserId = deterministicUuid('user:default-seed-user');

  // STEP 1: GET /routes
  const routesResult = await requestJson(
    `/routes?organizationId=${encodeURIComponent(organizationId)}`,
  );

  assert(routesResult.res.status === 200, `GET /routes failed with status ${routesResult.res.status}`);
  assert(Array.isArray(routesResult.body), 'GET /routes did not return an array');
  assert(routesResult.body.length > 0, 'GET /routes returned an empty array');

  const firstRouteId = routesResult.body[0] && routesResult.body[0].id;
  assert(typeof firstRouteId === 'string' && firstRouteId.length > 0, 'GET /routes missing first route id');

  console.log('✓ Routes endpoint OK');

  // STEP 2: GET /routes/:id
  const routeDetailResult = await requestJson(`/routes/${encodeURIComponent(firstRouteId)}`);

  assert(
    routeDetailResult.res.status === 200,
    `GET /routes/:id failed with status ${routeDetailResult.res.status}`,
  );
  assert(routeDetailResult.body && Array.isArray(routeDetailResult.body.stops), 'Route detail missing stops array');
  assert(routeDetailResult.body.stops.length > 0, 'Route detail has no stops');

  const firstLocationId =
    routeDetailResult.body.stops[0] &&
    routeDetailResult.body.stops[0].location &&
    routeDetailResult.body.stops[0].location.id;

  assert(typeof firstLocationId === 'string' && firstLocationId.length > 0, 'Route detail missing first location id');

  console.log('✓ Route detail endpoint OK');

  // STEP 3: GET /locations/:id
  const locationResult = await requestJson(`/locations/${encodeURIComponent(firstLocationId)}`);

  assert(
    locationResult.res.status === 200,
    `GET /locations/:id failed with status ${locationResult.res.status}`,
  );
  assert(
    locationResult.body && typeof locationResult.body.name === 'string' && locationResult.body.name.length > 0,
    'Location response missing name',
  );
  assert(locationResult.body && Array.isArray(locationResult.body.people), 'Location response missing people array');

  console.log('✓ Location endpoint OK');

  // STEP 4: POST /encounters
  const encounterPayload = {
    person: {
      displayName: 'Smoke Test Person',
    },
    locationId: firstLocationId,
    takenByUserId: seedUserId,
    items: [{ description: 'socks', quantity: 1 }],
    observation: 'smoke test',
  };

  const encounterResult = await requestJson('/encounters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(encounterPayload),
  });

  assert(
    encounterResult.res.status === 200 || encounterResult.res.status === 201,
    `POST /encounters failed with status ${encounterResult.res.status}`,
  );
  assert(
    encounterResult.body && typeof encounterResult.body.id === 'string' && encounterResult.body.id.length > 0,
    'Encounter response missing request id',
  );

  console.log('✓ Encounter creation OK');
  console.log('MVP smoke test passed');
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
