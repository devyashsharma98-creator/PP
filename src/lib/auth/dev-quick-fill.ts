export const LOCAL_ADMIN_QUICK_FILL = {
  email: "admin@pragyapravah.local",
  password: "Pragya@12345",
} as const;

/**
 * Demo accounts — one per designation (role) so the login page can offer a
 * one-click "open this dashboard" for demos. Created by `npm run db:seed:demo-users`.
 * Client-safe (constants only); used by both the login UI and the seed script.
 * These are demo-only credentials for an internal pilot.
 */
export const DEMO_PASSWORD = "Demo@12345";

export type DemoAccount = {
  roleCode: string;
  email: string;
  displayName: string;
  displayNameHi: string;
  labelEn: string;
  labelHi: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { roleCode: "karyakarta", email: "karyakarta@demo.pp.local", displayName: "Demo Karyakarta", displayNameHi: "डेमो कार्यकर्ता", labelEn: "Karyakarta", labelHi: "कार्यकर्ता" },
  { roleCode: "unit_head", email: "unithead@demo.pp.local", displayName: "Demo Unit Head", displayNameHi: "डेमो इकाई प्रमुख", labelEn: "Unit Head", labelHi: "इकाई प्रमुख" },
  { roleCode: "aayam_pramukh", email: "aayam@demo.pp.local", displayName: "Demo Aayam Pramukh", displayNameHi: "डेमो आयाम प्रमुख", labelEn: "Aayam Pramukh", labelHi: "आयाम प्रमुख" },
  { roleCode: "vibhag_pramukh", email: "vibhag@demo.pp.local", displayName: "Demo Vibhag Pramukh", displayNameHi: "डेमो विभाग प्रमुख", labelEn: "Vibhag Pramukh", labelHi: "विभाग प्रमुख" },
  { roleCode: "prant_aayam_pramukh", email: "prantaayam@demo.pp.local", displayName: "Demo Prant Aayam Pramukh", displayNameHi: "डेमो प्रांत आयाम प्रमुख", labelEn: "Prant Aayam Pramukh", labelHi: "प्रांत आयाम प्रमुख" },
  { roleCode: "prant_sanyojak", email: "prant@demo.pp.local", displayName: "Demo Prant Sanyojak", displayNameHi: "डेमो प्रांत संयोजक", labelEn: "Prant Sanyojak", labelHi: "प्रांत संयोजक" },
  { roleCode: "kshetra_reviewer", email: "kshetra@demo.pp.local", displayName: "Demo Kshetra Reviewer", displayNameHi: "डेमो क्षेत्र समीक्षक", labelEn: "Kshetra Reviewer", labelHi: "क्षेत्र समीक्षक" },
  { roleCode: "org_admin", email: "orgadmin@demo.pp.local", displayName: "Demo Org Admin", displayNameHi: "डेमो संगठन प्रशासक", labelEn: "Org Admin", labelHi: "संगठन प्रशासक" },
  { roleCode: "super_admin", email: "superadmin@demo.pp.local", displayName: "Demo Super Admin", displayNameHi: "डेमो सुपर एडमिन", labelEn: "Super Admin", labelHi: "सुपर एडमिन" },
];
