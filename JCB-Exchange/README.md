# Service Portal Mobile

This app is a thin React Native CLI shell around the existing `frontend-next` app.

## What it does

- Loads the Next.js customer panel in a full-screen `WebView`
- Handles Android hardware back navigation
- Shows loading and error states
- Requests FCM permissions on Android 13+
- Generates an FCM token on app start and syncs it to the web session when a customer auth token is available

## Development

From the repo root:

```powershell
npm run dev:backend
npm run dev:web
npm run dev:mobile
```

Then run Android:

```powershell
npm run android:mobile
```

## Device URL

The dev URL is resolved automatically from the Metro/packager host, so it works across:

- Android emulator: `http://10.0.2.2:3000`
- Android physical device on the same Wi-Fi: your laptop LAN IP
- iOS simulator: `http://localhost:3000`
- Physical device with `adb reverse`: `http://localhost:3000`

If you move networks, the app should follow the new host automatically as long as Metro and the web app are started from the same machine.

## Android release builds

```powershell
cd JCB-Exchange

# Signed release APK for device testing/distribution
npm run android:apk:release

# Signed Android App Bundle for Google Play
npm run android:aab:release
```

The outputs are generated in:

- APK: `android/app/build/outputs/apk/release/DealMyMachine.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

The existing `android:release` command remains available and builds the release APK.

### Versioning

The Android version is controlled at build time without removing the existing release workflow:

```powershell
$env:FINAL_VC = "2"
$env:FINAL_VN = "1.1.0"
npm run android:aab:release
```

`FINAL_VC` must be a positive integer and must increase for every Play Store upload. `FINAL_VN` is the user-visible version name. `VERSION_CODE` and `VERSION_NAME` Gradle properties are supported as fallbacks.

### Release signing

Release signing reads `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_ALIAS`, and `MYAPP_UPLOAD_KEY_PASSWORD` from Gradle properties or environment variables. Keep these values in local/CI secrets; never print them in build logs. The same upload keystore must be retained for future Play Store updates.

The Android Gradle wrapper is pinned to the React Native 0.82 / AGP 8.12-compatible Gradle version. CI should invoke `android/gradlew` (or `gradlew.bat` on Windows) instead of forcing another Gradle version.

## Firebase

- `android/app/google-services.json` is already placed for the Android build
- The web session posts the FCM token to `POST /api/users/fcm-token`
- The request uses the web app auth token from `localStorage` (`rto_customer_token`)
