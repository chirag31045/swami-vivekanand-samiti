# Android OTP Login and Password Management

## Added in this Android project
- Password login remains available.
- OTP login: registered mobile -> request SMS -> enter 6-digit OTP -> backend returns role-specific token.
- Forgot password: request reset OTP -> enter OTP and new password -> backend updates the password hash.
- Change password: available from the authenticated navigation drawer for admin and volunteer; requires current password.

## Required backend
Deploy the updated backend ZIP that contains `src/routes/mobileAuthRoutes.js` and `src/controllers/mobileAuthController.js` with these endpoints:
- `POST /api/mobile-auth/otp/send` body `{ "phone": "9876543210", "purpose": "login" }`
- `POST /api/mobile-auth/otp/verify` body `{ "phone": "9876543210", "otp": "123456" }`
- `POST /api/mobile-auth/otp/send` body `{ "phone": "9876543210", "purpose": "reset-password" }`
- `POST /api/mobile-auth/password/forgot/reset` body `{ "phone": "9876543210", "otp": "123456", "newPassword": "new-password" }`
- `POST /api/mobile-auth/password/change/volunteer` authenticated with `Authorization: Bearer <token>`
- `POST /api/mobile-auth/password/change/admin` authenticated with `Authorization: Bearer <token>`

Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in the backend environment (local `.env` or Vercel project environment variables). Never put Twilio secrets in Android.

## API base URL
The app's current `API_BASE_URL` build config is preserved. Confirm it points to the deployed backend URL ending in `/api/` before testing on a phone. `localhost` on an Android phone refers to the phone itself, not your computer.

## Important
The Android project ZIP did not include `gradlew` or the Gradle wrapper JAR, so this environment could not run a Gradle compile. Build and test in Android Studio. SMS login/password reset require valid Twilio Verify configuration and a reachable deployed backend.
