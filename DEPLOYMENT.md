# Deployment

## Frontend
Build with `npm --prefix frontend run build` and deploy `frontend/dist` to Vercel, Netlify, Cloudflare Pages, or Nginx.

Set:
`VITE_API_URL=https://your-api-domain.example/api`

## Backend
Deploy `backend` to Render, Railway, Fly.io, VPS, or another Node.js host.

Set:
- PORT
- MONGODB_URI
- FRONTEND_URL

## Domain
Example:
- `www.yoursamiti.org` -> frontend
- `api.yoursamiti.org` -> backend

For production, use HTTPS, a managed MongoDB database, secure admin authentication, backups, audit logs, and verified payment-gateway integration.
