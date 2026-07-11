# Authentication and RBAC

MuniAccountability Command uses a least-privilege access model for institutional routes and workflows.

The access-control rule is:

> Public-safe information may be shared openly. Institutional evidence, workflows, reviews and administration require an authenticated role with explicit permission.

## Current implementation

The current RBAC foundation includes:

```txt
lib/auth/roles.ts
lib/auth/session-token.ts
lib/auth/server-session.ts
components/auth/access-provider.tsx
middleware.ts
app/access-denied/page.tsx
```

The implementation supports:

- canonical roles
- explicit permissions
- route and HTTP-method policies
- HMAC-signed session cookies
- server-side current-user resolution
- middleware enforcement
- role-aware navigation
- API `401` and `403` responses
- a public-safe access-denied page
- demo-mode role testing

## Roles

| Role | Intended use |
| --- | --- |
| `public` | Public MuniCheck and disclosure surfaces only |
| `viewer` | Read institutional dashboards, dossiers and evidence |
| `analyst` | Create actions, query evidence and build briefings |
| `reviewer` | Review actions and accept, correct or exclude AGSA-derived claims |
| `admin` | Manage readiness gates, data quality and workspace administration |
| `super_admin` | Platform-wide tenant, security and system administration |

## Permissions

Canonical permissions are defined in `lib/auth/roles.ts`:

```txt
public.read
workspace.read
evidence.read
actions.read
actions.write
actions.review
briefings.write
agsa.review
readiness.read
readiness.manage
system.manage
```

Do not check role names directly inside feature components when a permission check is sufficient. Prefer:

```ts
hasPermission(role, "agsa.review")
canAccessPath(role, "/admin/agsa-review")
```

## Route policy

Route and method rules are centralized through:

```ts
accessForPath(pathname, method)
```

Important policies:

- `/municheck`, `/disclaimer` and public MuniData routes are public-safe.
- institutional workspace pages require at least `viewer` access.
- action writes and assistant queries require `analyst` or higher.
- AGSA review decisions require `reviewer` or higher.
- production-readiness administration requires `admin` or higher.
- `super_admin` receives all permissions.

## Session cookie

The session cookie name is:

```txt
muni_session
```

The token format is:

```txt
base64url(JSON payload).base64url(HMAC-SHA256 signature)
```

Required payload claims:

```txt
sub
email
name
tenantId
role
iat
exp
```

The middleware validates:

- the cookie exists
- `MUNI_SESSION_SECRET` is configured and at least 32 characters
- the payload shape is valid
- the role is recognized
- the token is not expired
- the HMAC signature is valid

The middleware does **not** trust a browser-supplied `x-muni-role` header.

## Demo mode

When:

```env
NEXT_PUBLIC_REQUIRE_AUTH=false
```

`MUNI_DEV_ROLE` controls the demo identity. This allows role testing without a login provider:

```env
MUNI_DEV_ROLE=viewer
```

Supported values:

```txt
public
viewer
analyst
reviewer
admin
super_admin
```

Demo mode must not be treated as production authentication.

## Signed local session

Set a development secret:

```env
MUNI_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Create a signed token:

```bash
npm run auth:dev-token -- --role reviewer
```

The command prints a temporary token and cookie value. Do not commit or share the token.

## Firebase production flow

The signed-cookie boundary is ready for a future Firebase exchange flow:

1. User signs in through Firebase Auth or Identity Platform.
2. The browser sends the Firebase ID token to a server-only session endpoint.
3. The server verifies the Firebase ID token with Firebase Admin.
4. The server resolves tenant and institutional role claims.
5. The server issues the short-lived `muni_session` HttpOnly cookie.
6. Middleware verifies the signed cookie on protected requests.

Do not verify Firebase Admin credentials in client components.

## Production requirements still outstanding

The current work is a strong RBAC and signed-session foundation, but full production authentication still requires:

- Firebase/Identity Platform sign-in UI
- server-side Firebase ID-token verification
- secure session exchange/logout endpoints
- role claims managed by administrators
- tenant membership storage
- session revocation
- MFA policy for privileged roles
- security-event and access audit logs
- key/secret rotation procedures

## Security requirements

- Use a random `MUNI_SESSION_SECRET` of at least 32 characters.
- Store production secrets only in the hosting secret manager.
- Use HTTPS and `Secure` cookies in production.
- Use `HttpOnly` and `SameSite=Lax` or stricter.
- Keep session lifetime short.
- Never accept role or tenant identity directly from client headers or request bodies.
- Enforce authorization on the server even when navigation is hidden in the UI.
- Use least privilege. Do not assign `admin` when `viewer`, `analyst` or `reviewer` is sufficient.

## Test commands

```bash
npm run test:rbac-contracts
npm run test:institutional
npm run verify
```

The RBAC contract suite checks the role matrix, permissions, signed session format, middleware enforcement, role-aware shell and documentation.
