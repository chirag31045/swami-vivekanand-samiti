# Swami Samiti Android App — Mobile UI + Local Backend Fix

## Android Studio mein open/run
1. ZIP extract karein.
2. Android Studio > Open > `swami-vivekanand-samiti/android` folder select karein.
3. Gradle JDK 17 set karein aur Gradle Sync karein.
4. Phone aur computer ko same Wi-Fi par connect karein.
5. Windows CMD mein `ipconfig` chala kar Wi-Fi adapter ka IPv4 Address dekhein.
6. `android/app/build.gradle.kts` mein `API_BASE_URL` ko `http://YOUR_PC_IPV4:5000/api/` karein. ZIP mein aapka pehle diya hua IP `172.25.195.78` rakha hai; `ipconfig` mein agar IP badal gaya ho to actual IPv4 se replace karein.
7. Backend ko port 5000 par chalayein; Express ko phone ke liye reachable interface par listen karna chahiye. Windows Firewall mein Private network par TCP 5000 allow karein.
8. Sync, Rebuild aur app reinstall karein.

## Is update mein
- Android 15 edge-to-edge/system bar inset fix: header status bar ke neeche aur scroll content navigation bar ke upar rahega.
- Logged-in screens par left navigation drawer.
- Header responsive; logo/title/logout chhoti screen par overlap nahi karne chahiye.
- Existing Samiti logo se Android launcher icon aur round icon.
- Local HTTP testing ke liye INTERNET permission aur cleartext setting enabled. Production mein HTTPS use karein aur cleartext ko disable karein.
- API exceptions ke liye UnknownHost, connection refused aur timeout ka readable diagnostic.
- Existing backend source/API routes ko modify nahi kiya.

## Important: API address
`172.25.195.78` aapke pehle diye config se liya hai. Agar aapke PC ka IPv4 alag/badal gaya hai to wahi lagayein. Phone par `localhost` use na karein. Backend port 5000 se alag hai to URL mein sahi port use karein.

## Backend binding
Agar backend sirf `127.0.0.1`/`localhost` par listen kar raha hai, to phone connect nahi kar sakta. Existing `app.listen` binding ko `0.0.0.0` par set karna hoga; API routes/business logic ko change karne ki zaroorat nahi.

## Security
`usesCleartextTraffic=true` sirf local development ke liye hai. Live app ke liye HTTPS configure karein. Secrets `.env` aur machine-specific `local.properties` is ZIP mein include nahi hain; apni local copies ko secure rakhein.
