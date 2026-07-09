# Cost-control guide

MuniAccountability should stay cheap until it has a funded pilot or paying customer.

## Default low-cost posture

Keep these values during demos:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_REQUIRE_AUTH=false
WORKFLOW_STORE_PROVIDER=local_json
DISABLE_EXPENSIVE_JOBS=true
```

## Firebase and GCP choices

- Use Firestore before Cloud SQL for workflow records.
- Use Firebase Auth before custom identity services.
- Use Firebase Hosting or App Hosting before a custom Kubernetes setup.
- Use Cloud Storage only for evidence files that need hosting.
- Use BigQuery later for analytics exports, not for the main app workflow store.
- Keep Cloud Run or App Hosting min instances at 0.
- Avoid scheduled extraction jobs until there is a real data refresh need.

## Budget guardrails

- Create a small budget alert before the first cloud deployment.
- Keep max instances low in `apphosting.yaml`.
- Do not enable heavy AI, OCR or scheduled scraping jobs by default.
- Cache source documents and generated JSON.
- Review Firestore reads after demos. Source search can become read-heavy if moved from local JSON to hosted collections.

## Safe upgrade order

1. Deploy rules and indexes.
2. Add Firebase Auth users and roles.
3. Move workflow writes to Firestore.
4. Add Storage for evidence files.
5. Add BigQuery export only after the workflow model is stable.
6. Add scheduled ingestion only after source refresh rules are agreed.

## What not to buy yet

- Do not use Cloud SQL until Firestore limits become real.
- Do not run always-on compute during demos.
- Do not pay for analytics dashboards before the data model is validated.
- Do not enable external paid APIs until the app can generate revenue.
