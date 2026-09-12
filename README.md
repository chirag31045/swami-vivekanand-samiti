# स्वामी विवेकानन्द विचार प्रचार सेवा समिति — Full Stack Website

यह प्रोजेक्ट आपके दिए हुए **लोगो** और **पोस्टर** को assets के रूप में शामिल करता है।

## Tech Stack
- Frontend: React + Vite + CSS
- Backend: Node.js + Express
- Database-ready: MongoDB/Mongoose
- Validation: Zod
- Security: Helmet, CORS, rate limiting
- Financial transparency: donations, income/expense summary, reports, bank/UPI placeholders

## Folder Structure
```text
swami-vivekanand-samiti/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── server.js
├── frontend/
│   ├── public/assets/
│   │   ├── logo.png
│   │   └── poster.jpg
│   └── src/
│       ├── components/
│       ├── data/
│       ├── pages/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
└── package.json
```

## 1. Install
```bash
npm run install:all
```

## 2. Backend environment
Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/vivekanand_samiti
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

If MongoDB is not available, the demo API still starts using in-memory sample data.

## 3. Run
```bash
npm run dev
```
Frontend: http://localhost:5173  
Backend: http://localhost:5000/api/health

## Main Pages
- Home
- About Samiti
- Activities/Seva
- Financial Transparency
- Gallery
- Notices
- Contact
- Donation form
- Admin-ready API endpoints

## Important before production
1. Replace demo financial values with verified accounts.
2. Add the committee's official registration/charity details.
3. Do not publish personal phone numbers unless authorized.
4. Add HTTPS and a real database.
5. Add authentication/authorization before exposing admin routes.
6. For online donations, connect a verified payment gateway (Razorpay/Cashfree/PayU/etc.) after completing KYC and compliance.


## New additions
- Registration Certificate PDF and NGO Darpan PDF in `frontend/public/documents/`
- `/documents` certificates page
- `/volunteer` volunteer registration form
- `POST /api/volunteers` and `GET /api/volunteers`
- Footer social icons: Instagram, Facebook, WhatsApp and Twitter/X
