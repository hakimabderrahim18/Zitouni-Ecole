# Architectural & Technical Differences: Web vs Mobile (Expo)

In accordance with the project specification, **the Web application is the ONLY source of truth**. 
The mobile application in `/mobile` preserves 100% of the visual hierarchy, color palette (`#7B1E3A`, `#F3E9DC`, `#C9A24D`, `#FCF8F2`, `#2B2022`), typography, iconography, and backend functionality.

The only differences present in the mobile application are those strictly required by mobile OS constraints and App Store / Google Play submission guidelines:

| Area | Web App Implementation | Mobile Twin Implementation | Technical Justification |
| :--- | :--- | :--- | :--- |
| **Viewport & Screen Boundary** | Desktop multi-column grid with responsive collapsible sidebar | Single-column mobile viewport (390x844 baseline) with slide-over Drawer Navigation | Mobile physical screen width requires vertical stacking and slide-over menu for accessibility. |
| **Safe Areas** | Browser CSS margins and padding | `SafeAreaView` / `Platform.OS === 'ios'` padding | Prevents content clipping beneath the iPhone dynamic island/notch and Android status/navigation bars. |
| **Token Storage** | `localStorage.getItem('token')` | Hardware `expo-secure-store` with iOS Keychain & Android Keystore | Protects JWT access tokens in encrypted hardware-backed storage against jailbreak/tampering. |
| **Haptic Feedback** | No haptics on desktop browsers | Native `Haptics.impactAsync` on button tap (guarded on web) | Standard mobile UX indicator for tactile confirmation of user actions. |
| **Keyboard Management** | Standard browser viewport reflow | `KeyboardAvoidingView` + `ScrollView` dismiss on drag | Prevents virtual soft keyboards from obstructing input fields and submit buttons. |
| **Camera & Photo Picker** | `<input type="file" accept="image/*">` | Native `expo-image-picker` with Camera & Gallery permissions | Required by iOS and Android sandboxing; includes required `Info.plist` and `AndroidManifest.xml` usage descriptions. |
| **Account Deletion** | Web profile modal button | Mobile profile modal button | Required by **Apple App Store Review Guideline 5.1.1(v)** and Google Play Account Deletion Policy. |
| **Touch Targets** | Flexible CSS dimensions | Minimum 44x44 pt tap targets | Apple Human Interface Guidelines and Android Material accessibility compliance. |
