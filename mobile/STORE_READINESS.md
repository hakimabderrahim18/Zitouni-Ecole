# Store Readiness & Submission Guide (STORE_READINESS.md)

## 1. Compliance & Security Verification

| Guideline / Requirement | Implementation in `/mobile` | Status |
| :--- | :--- | :---: |
| **Apple Guideline 5.1.1(v) (Account Deletion)** | Self-serve permanent account deletion button in Profile screen calling `DELETE /api/auth/account`. | **COMPLIANT** |
| **Google Play Data Safety Disclosures** | Clear purpose strings in `app.json` for Camera, Media Library, and Microphone. | **COMPLIANT** |
| **Hardware Token Security** | JWT access tokens stored securely in `expo-secure-store` (iOS Keychain & Android Keystore). | **COMPLIANT** |
| **No Hardcoded Secrets** | API base URLs injected dynamically from `EXPO_PUBLIC_API_URL` without embedded credentials. | **COMPLIANT** |
| **High-Resolution App Store Assets** | `icon.png` (1024x1024), `adaptive-icon.png` (1024x1024), and `splash.png` (1242x2436). | **COMPLIANT** |

---

## 2. EAS Build Commands

### Prerequisites
Install EAS CLI globally if not already installed:
```bash
npm install -g eas-cli
```
Login to your Expo account:
```bash
eas login
```
Configure EAS project:
```bash
cd mobile
eas project:init
```

### Build for Android (Google Play APK / AAB)
To generate an installable standalone APK for testing or an AAB for the Google Play Console:
```bash
# Standalone APK for direct device installation
eas build -p android --profile preview

# Production AAB for Google Play Store upload
eas build -p android --profile production
```

### Build for iOS (Apple App Store / TestFlight)
Once Apple Developer credentials are ready:
```bash
# TestFlight internal/external testing build
eas build -p ios --profile production
```

---

## 3. Google Play & App Store Submission Checklist
* [x] App Icon: 1024x1024 PNG (No alpha channel for iOS App Store)
* [x] Splash Screen: 1242x2436 matching brand palette (`#F3E9DC`)
* [x] Bundle Identifier: `dz.ecole.hebr`
* [x] Version: `1.0.0` (Build Number: `1`)
* [x] Privacy Policy & Terms of Service URL configured
* [x] Full RTL Arabic and French typography support
* [x] Zero TypeScript errors (`npx tsc --noEmit` verified)
