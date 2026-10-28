# Firebase Push Notification Setup (Hindi)

## Backend
1. Firebase Console → Project settings → Service accounts → Generate new private key.
2. JSON file ko public/frontend folder me upload na karein. Backend environment variable `FIREBASE_SERVICE_ACCOUNT_JSON` me poora JSON single-line me set karein (Vercel/hosting environment variables me).
3. Backend dependencies install karein: `npm install` (firebase-admin package add hua hai).
4. Admin dashboard login ke baad app/web push token backend par register hoga. Volunteer application aur successful donation par database notification + push send hoga.

## Android
1. Firebase Console me Android app package `org.swamisamiti.mobile` register karein.
2. `google-services.json` ko `android/app/google-services.json` me rakhein.
3. Android Studio me Gradle Sync karein. Android 13+ par notifications permission allow karein.
4. Firebase service account JSON sirf backend me rakhein; APK me kabhi mat rakhein.

## Web admin push
Browser push ke liye Firebase web app config + service worker chahiye. Admin dashboard ka notification bell/page database polling se kaam karta hai; push notification ke liye `frontend/public/firebase-messaging-sw.js` aur Firebase web config set karein. Web push ko browser HTTPS par hi allow karta hai.

## Events
- Volunteer form submit → admin notification type `volunteer` → click opens New Applications / Volunteers.
- Successful Razorpay donation webhook → type `payment` → click opens Donations.
- Android push tap → app opens Notifications screen; notification item button opens volunteers or donations.
