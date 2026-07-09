# Firebase and GCP deployment preparation

This guide keeps MuniAccountability cheap during pilots while preparing the app for a hosted workflow store.

## Target architecture

- Web runtime: Firebase App Hosting or Cloud Run for dynamic Next.js routes.
- Static assets: Firebase Hosting.
- Auth: Firebase Auth with role claims for analyst, reviewer and admin.
- Workflow store: Firestore for review decisions, draft actions, gate reviews and audit logs.
- Evidence files: Firebase Storage or Cloud Storage.
- Analytics later: BigQuery only after export value is clear.

## Initial setup

1. Create a Firebase project.
2. Set a small GCP budget alert before deploying.
3. Copy `.firebaserc.example` to `.firebaserc` and replace project IDs.
4. Copy `.env.example` to `.env.local`.
5. Keep these defaults for the first demo deploy:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_REQUIRE_AUTH=false
WORKFLOW_STORE_PROVIDER=local_json
DISABLE_EXPENSIVE_JOBS=true
```

## Deploy rules first

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Cheap runtime posture

`apphosting.yaml` is intentionally conservative:

- 512 MiB memory
- 1 CPU
- min instances: 0
- max instances: 2
- expensive jobs disabled

Do not increase these settings until the platform has a real pilot.

## Firestore migration sequence

1. Confirm Firebase Auth users and role claims.
2. Deploy Firestore rules and indexes.
3. Backfill existing workflow JSON records.
4. Add parity checks for draft actions, review decisions and production gate reviews.
5. Change `WORKFLOW_STORE_PROVIDER=firestore`.
6. Run `npm run verify`.
7. Smoke-test staging writes.

## Production unlock rule

Do not call the platform production-ready until all three gates pass:

- exact MFMA municipality-level annexure mapping;
- Treasury or Municipal Money connector, reuse, schema, formula and freshness validation;
- durable workflow database migration and parity evidence.
