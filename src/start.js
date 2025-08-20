require('dotenv').config();
const AWS = require('aws-sdk');

async function loadSecrets() {
  const secretId = process.env.SECRET_ID;
  if (!secretId) return;
  const region = process.env.AWS_REGION;
  const client = new AWS.SecretsManager({ region });
  const data = await client.getSecretValue({ SecretId: secretId }).promise();
  if (data.SecretString) {
    const secrets = JSON.parse(data.SecretString);
    Object.assign(process.env, secrets);
  }
}

async function start() {
  try {
    await loadSecrets();
    const app = require('./server');
    const config = require('./config');
    const PORT = config.port;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
