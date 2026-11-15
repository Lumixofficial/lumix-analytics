# Shared Mongo deployment

The Analytics website reads the Lumix API over HTTP and does not connect to Mongo.
Its `docker-compose.yml` joins the existing `lumix-network` owned by `../api`.

`mongo-secure.compose.yml` protects the shared API database with authentication,
an internal `lumix-database` network, and no published Mongo port. Keep this
overlay applied to installations that already use it. It preserves the API's
existing data volume and configures the API with its authenticated URI.

Private credentials live in `.local/database/`, excluded from Git and Docker
builds. Existing shared credentials are retained there without rotation:

- `mongo-root-password`: shared Mongo administrator secret.
- `mongo-api-password`: the API's database user secret.
- `compose.env`: `LUMIX_ANALYTICS_DEPLOY_DIR` (absolute repository path) and
  `LUMIX_API_MONGODB_URI` (authenticated API connection).

Validate the merged configuration without printing secrets:

```powershell
docker compose -p api --env-file .local/database/compose.env -f ../api/docker-compose.yml -f deploy/mongo-secure.compose.yml config --quiet
```

Use the existing API Compose project name if it differs from `api`. Applying
authentication to an existing installation requires its database maintenance
procedure and a verified backup. `mongo-bootstrap.cjs` provisions the shared
administrator and API user when run with the proper administrator access; it
does not change application data. Keep the existing project and Mongo volume.
Never remove authentication or recreate the database to resolve credentials.
