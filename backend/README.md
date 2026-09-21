# Swami Vivekanand Samiti Backend

Backend API for the Swami Vivekananda Vichar Prachar Seva Samiti website.

## What was cleaned

- Removed the duplicate `/api/donations` route registration.
- Removed the unused duplicate `src/models/Donation.js` model. `src/models/donationModel.js` is the model used by the donation controllers.
- Removed duplicated image-upload configuration from individual routes.
- Centralized image validation and storage.
- Removed debug-only gallery database count logging.
- Kept all existing route names, controller names, model names, API paths and frontend-facing field names unchanged.
- Added the missing donation QR image upload middleware.
- Added `qrImage` to the donation settings model so uploaded QR URLs are actually persisted.
- Added a Vercel serverless entry point.
- Kept existing `uploads/` files available for deployment.
- Added Cloudinary-backed persistent uploads for Vercel. Local development continues to use the `uploads/` folder when Cloudinary variables are not configured.

## Image storage

### Local development

If Cloudinary variables are empty, images are stored in:

```text
uploads/admin-profile/
uploads/donations/
uploads/gallery/
uploads/site/
uploads/activities/
```

### Vercel production

Vercel's function filesystem is not a persistent upload disk. Therefore, new uploads automatically use Cloudinary when these variables are configured:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Existing files inside `uploads/` are included in the project and remain available as static files.

## Vercel deployment

This project is pinned to Node.js 24.x for Vercel.


Deploy the `backend` folder as the Vercel project root.

Required Vercel environment variables:

```text
MONGODB_URI
ADMIN_USERNAME
ADMIN_PASSWORD
JWT_SECRET
ADMIN_SESSION_EXPIRES_IN
FRONTEND_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
DONATION_MAIL_USER
DONATION_MAIL_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

`PORT` is optional on Vercel.

After deployment, the API base URL will be:

```text
https://YOUR-BACKEND.vercel.app/api
```

Health check:

```text
https://YOUR-BACKEND.vercel.app/api/health
```

## Frontend

Set the frontend environment variable to the deployed API:

```text
VITE_API_URL=https://YOUR-BACKEND.vercel.app/api
```

For local development:

```text
VITE_API_URL=http://localhost:5000/api
```

If `getAssetUrl()` is used by the frontend, it should return full `http://` or `https://` image URLs unchanged. This is important for Cloudinary URLs.

## Local run

```bash
npm install
npm run dev
```

Production-style local run:

```bash
npm start
```

## Important

Do not commit `.env`. Use Vercel Project Settings -> Environment Variables for production secrets.
