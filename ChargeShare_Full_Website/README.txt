CHARGESHARE FULL WEBSITE (MOBILE-RESPONSIVE PROTOTYPE)

Files:
- index.html: shared page structure and links to the other files
- style.css: off-white and leaf-green theme, responsive/mobile styles
- script.js: sign-up, login demo, password reset demo, 6-step onboarding and file-upload UI; returning login skips onboarding
- marketplace.js: receiver/provider dashboards, charging estimate, request simulation, and demo map

Run: keep all four files in the same folder. Open index.html in a browser or use VS Code Live Server. To test on Android, serve the folder on your computer and open its local network URL on the phone while both are on the same Wi-Fi.

IMPORTANT LIMITATIONS:
This is a front-end demo, not production authentication or identity verification. Login currently accepts syntactically valid demo credentials and continues to onboarding; reset emails are not sent. Uploaded files are not transmitted or securely stored; only filenames are held in memory. Provider requests and map locations are simulated. No real GPS, payments, charger discovery, notifications, backend, database, or EV charging hardware integration is connected. Do not use real Aadhaar, PAN, driving-licence or vehicle documents in this demo.
