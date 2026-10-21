# resume_builder-backend

## Environment configuration

The server loads environment variables from a local `.env` file at startup. Copy
`.env.example` to `.env` and set separate, strong `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET` values before starting the server. Keep `.env` private
and do not commit it.

For example, generate each secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```