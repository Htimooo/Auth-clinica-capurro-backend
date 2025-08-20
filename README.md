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

## AWS Secrets Manager

In production you can store sensitive configuration in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/).

1. Create a secret containing keys such as `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and `JWT_SECRET`.
2. Attach an IAM role to the EC2 instance that allows `secretsmanager:GetSecretValue`.
3. Set `AWS_REGION` and `SECRET_ID` environment variables on the instance. `SECRET_ID` should match the name or ARN of the secret you created.

At startup the app uses the AWS SDK to retrieve the secret and populate `process.env` before launching the server. Local development can still use a traditional `.env` file.

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

