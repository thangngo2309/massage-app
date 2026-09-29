const {
  cert,
  initializeApp,
  getApps,
  deleteApp,
} = require("firebase-admin/app");

const { getStorage } = require("firebase-admin/storage");

function getServiceAccount() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!base64) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
  }

  const json = Buffer.from(base64, "base64").toString("utf8");
  const raw = JSON.parse(json);

  return {
    projectId: raw.project_id,
    clientEmail: raw.client_email,
    privateKey: raw.private_key,
  };
}

async function main() {
  const serviceAccount = getServiceAccount();

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error("Missing FIREBASE_STORAGE_BUCKET");
  }

  console.log("Node:", process.version);
  console.log("Project ID:", serviceAccount.projectId);
  console.log("Client email:", serviceAccount.clientEmail);
  console.log("Bucket:", bucketName);

  const appName = "firebase-storage-test";

  const oldApp = getApps().find((item) => item.name === appName);

  if (oldApp) {
    await deleteApp(oldApp);
  }

  const app = initializeApp(
    {
      credential: cert(serviceAccount),
      storageBucket: bucketName,
    },
    appName,
  );

  console.log("\n[1] Testing Firebase credential...");

  const credential = app.options.credential;

  if (!credential) {
    throw new Error("Firebase credential not initialized");
  }

  const token = await credential.getAccessToken();

  console.log("AUTH OK");
  console.log("Expires in:", token.expires_in);
  console.log("Access token received:", Boolean(token.access_token));

  console.log("\n[2] Testing Firebase Storage SDK...");

  const bucket = getStorage(app).bucket(bucketName);

  const [exists] = await bucket.exists();

  console.log("STORAGE OK");
  console.log("Bucket:", bucket.name);
  console.log("Exists:", exists);

  await deleteApp(app);

  console.log("\nALL FIREBASE SDK TESTS PASSED");
}

main().catch((error) => {
  console.error("\nTEST FAILED");
  console.error(error);
  process.exit(1);
});