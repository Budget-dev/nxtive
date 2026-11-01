// scripts/setAdminClaim.js
//
// One-time script that makes a Firebase Auth user an "admin" so they can
// open /admin/orders. Run locally with Node — never ship this to the browser.
//
//   npm install firebase-admin
//   node scripts/setAdminClaim.js someone@yourshop.com
//
// Needs a service account key:
//   Firebase Console -> Project settings -> Service accounts
//   -> Generate new private key -> save as serviceAccountKey.json
//   in the project root, and add it to .gitignore.

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const keyPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(keyPath)) {
  console.error(
    "Service account file not found at " +
      keyPath +
      ". Please download your private key from Firebase Console -> Project Settings -> Service accounts and save it as serviceAccountKey.json"
  );
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/setAdminClaim.js someone@yourshop.com");
  process.exit(1);
}

admin
  .auth()
  .getUserByEmail(email)
  .then((user) => admin.auth().setCustomUserClaims(user.uid, { admin: true }))
  .then(() => {
    console.log(`${email} is now an admin. They must sign out and back in for it to apply.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
