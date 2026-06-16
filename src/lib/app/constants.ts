import type { CanonicalRoleCode, Role } from './contracts';

export const roleLabels: Record<Role, string> = {
  unit_head: 'Unit Head',
  aayam_pramukh: 'Aayam Pramukh',
  vibhag_pramukh: 'Vibhag Pramukh',
  karyakarta: 'Karyakarta',
};

export const roleLabelsHi: Record<Role, string> = {
  unit_head: 'यूनिट प्रमुख',
  aayam_pramukh: 'आयाम प्रमुख',
  vibhag_pramukh: 'विभाग प्रमुख',
  karyakarta: 'कार्यकर्ता',
};

export const canonicalRoleLabels: Record<CanonicalRoleCode, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  karyakarta: 'Karyakarta',
  unit_head: 'Unit Head',
  aayam_pramukh: 'Aayam Pramukh',
  vibhag_pramukh: 'Vibhag Pramukh',
  prant_sanyojak: 'Prant Sanyojak',
  prant_aayam_pramukh: 'Prant Aayam Pramukh',
  kshetra_reviewer: 'Kshetra Reviewer',
};

export const canonicalRoleLabelsHi: Record<CanonicalRoleCode, string> = {
  super_admin: 'सुपर एडमिन',
  org_admin: 'संस्था एडमिन',
  karyakarta: 'कार्यकर्ता',
  unit_head: 'यूनिट प्रमुख',
  aayam_pramukh: 'आयाम प्रमुख',
  vibhag_pramukh: 'विभाग प्रमुख',
  prant_sanyojak: 'प्रान्त संयोजक',
  prant_aayam_pramukh: 'प्रान्त आयाम प्रमुख',
  kshetra_reviewer: 'क्षेत्र समीक्षक',
};
