const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function main() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!base64) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(base64, 'base64').toString('utf8'),
  );

  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const unsignedToken =
    `${base64url(JSON.stringify(header))}.` +
    `${base64url(JSON.stringify(payload))}`;

  const signer = crypto.createSign('RSA-SHA256');

  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(serviceAccount.private_key);

  const assertion = `${unsignedToken}.` + `${base64url(signature)}`;

  console.log('Node:', process.version);
  console.log('Project:', serviceAccount.project_id);
  console.log('Client:', serviceAccount.client_email);

  console.log('\n[1] Requesting OAuth token using native Node fetch...');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },

    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',

      assertion,
    }),
  });

  console.log('HTTP status:', response.status);

  const result = await response.json();

  if (!response.ok) {
    console.error('OAuth failed:', result);
    process.exitCode = 1;
    return;
  }

  console.log('OAUTH OK');
  console.log('Token type:', result.token_type);
  console.log('Expires in:', result.expires_in);
  console.log('Access token received:', Boolean(result.access_token));

  console.log('\n[2] Testing Storage REST API...');

  const bucket = process.env.FIREBASE_STORAGE_BUCKET;

  const storageResponse = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}`,
    {
      headers: {
        Authorization: `Bearer ${result.access_token}`,
      },
    },
  );

  console.log('Storage HTTP status:', storageResponse.status);

  const storageResult = await storageResponse.json();

  if (!storageResponse.ok) {
    console.error('Storage failed:', storageResult);

    process.exitCode = 1;
    return;
  }

  console.log('STORAGE AUTH OK');
  console.log('Bucket:', storageResult.name);

  console.log('\nALL TESTS PASSED');
}

main().catch((error) => {
  console.error('\nTEST FAILED');
  console.error(error);
  process.exitCode = 1;
});
