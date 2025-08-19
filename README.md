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

