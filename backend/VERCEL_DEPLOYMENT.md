# Vercel Deployment Checklist

1. Push the cleaned `backend` folder to GitHub.
2. Create a new Vercel project from that repository.
3. Set the Root Directory to `backend` if the repository also contains the frontend.
4. Add all variables from `.env.example` in Vercel -> Settings -> Environment Variables.
5. Set `FRONTEND_URL` to the real frontend Vercel URL. Multiple origins are comma-separated.
6. Create a Cloudinary account and copy its Cloud Name, API Key and API Secret into Vercel.
7. Deploy.
8. Open `/api/health` on the backend domain.
9. Set the frontend `VITE_API_URL` to the backend domain plus `/api`.
10. Test admin login, logo/poster upload, gallery upload, activity upload, admin profile image, donation QR upload and Razorpay payment flow.

Image behavior:
- Existing `/uploads/...` images are deployed with the project.
- New production uploads go to Cloudinary.
- New production uploads are not written to the Vercel function filesystem.

Vercel supports Express deployments and serverless Node.js functions; this project exposes the Express app through `api/index.js`.

Cloudinary is used for persistent production uploads. Its Upload API supports authenticated server-side uploads and signed REST requests.
