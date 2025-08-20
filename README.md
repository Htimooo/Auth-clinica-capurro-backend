# Auth Clinica Capurro Backend

This service requires a PostgreSQL database. Connection parameters are read
from environment variables, allowing different credentials for production.

## Environment variables

Set the following variables before starting the application:

- `DB_HOST` – database host name or IP.
- `DB_PORT` – database port, e.g. `5432`.
- `DB_USER` – database user.
- `DB_PASSWORD` – user's password.
- `DB_NAME` – database name.

Example:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=myuser
export DB_PASSWORD=secret
export DB_NAME=mydatabase
```

Configure these variables in your production environment so the API can connect
to the correct database instance.

## Security configuration

The server uses [helmet](https://github.com/helmetjs/helmet) and
[cors](https://github.com/expressjs/cors) for basic security hardening.

### CORS origins

Allowed origins can be specified via the `CORS_ORIGINS` environment variable.
Provide a comma-separated list of origins when `NODE_ENV=production`.
During development all origins are allowed by default.

Example configuration:

```bash
# Development
export NODE_ENV=development

# Production
export NODE_ENV=production
export CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

Adjust these variables for each environment to control who can access the API
and to fine-tune security headers.

