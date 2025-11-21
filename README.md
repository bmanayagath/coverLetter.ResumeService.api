# ResumeService API (minimal)

This is a minimal Node.js Express API that demonstrates JWT token validation.

Files added:

- `src/index.js` — Express server with `/login` (issues demo token) and `/protected` (requires JWT).
- `src/middleware/auth.js` — middleware that validates `Authorization: Bearer <token>`.
- `package.json` — project manifest.
- `.env.example` — shows the `JWT_SECRET` value.

Quick start (PowerShell):

```powershell
npm install
$env:JWT_SECRET = "changeme"
npm run dev
```

Generate a demo token (PowerShell):

```powershell
$token = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/login -Body (@{username='alice'} | ConvertTo-Json) -ContentType 'application/json').token
Write-Host "Token: $token"

# call protected route
Invoke-RestMethod -Uri http://localhost:3000/protected -Headers @{ Authorization = "Bearer $token" }
```

Using curl (Linux/macOS or WSL):

```bash
# request token
curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"username":"alice"}'

# call protected route (replace <token> with token value)
curl -H "Authorization: Bearer <token>" http://localhost:3000/protected
```

Notes:
- The server reads `JWT_SECRET` from environment; default fallback is `changeme` for convenience only — do not use in production.
- `/login` is provided only for demo/testing. In a real app, issue tokens only after proper authentication.

**Dedicated File Endpoint**

`POST /coverletter/file` — accepts either `application/octet-stream` (raw bytes) or `application/json` with `{ "filename": "...", "data": "<base64>" }`.

PowerShell examples:

```powershell
# send a local file as raw bytes
Invoke-WebRequest -Uri http://localhost:3000/coverletter/file?filename=cover.pdf -Method Post -InFile .\cover.pdf -ContentType 'application/octet-stream' -Headers @{ Authorization = "Bearer $token" }

# send a file as base64 JSON
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('.\cover.pdf'))
Invoke-RestMethod -Uri http://localhost:3000/coverletter/file -Method Post -Body (@{ filename = 'cover.pdf'; data = $b64 } | ConvertTo-Json) -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" }
```

curl example:

```bash
# raw bytes
curl -X POST "http://localhost:3000/coverletter/file?filename=cover.pdf" --data-binary @cover.pdf -H "Content-Type: application/octet-stream" -H "Authorization: Bearer <token>"

# base64 JSON (replace <base64-data> or generate on the fly)
curl -X POST http://localhost:3000/coverletter/file -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"filename":"cover.pdf","data":"<base64-data>"}'
```

**Docker / Railway deployment**

- Build locally (optional):

```powershell
docker build -t resumeservice:local .
docker run -e JWT_SECRET="changeme" -p 3000:3000 resumeservice:local
```

- Railway notes:
	- Railway can build from your `Dockerfile` directly or run `npm start` if you deploy from the repo without Docker.
	- Add an environment variable `JWT_SECRET` in Railway's dashboard for the service (do not commit secrets to the repo).
	- If Railway provides a different port via `PORT` env var, the app will use it automatically.

Example: set `JWT_SECRET` in Railway environment settings to a strong secret. The Docker image does not embed the secret; Railway will inject it at runtime.
