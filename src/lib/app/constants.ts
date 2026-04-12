import type { CanonicalRoleCode, Role } from './contracts';

export const roleLabels: Record<Role, string> = {
  unit_head: 'Unit Head',
  aayam_pramukh: 'Aayam Pramukh',
  vibhag_pramukh: 'Vibhag Pramukh',
  karyakarta: 'Karyakarta',
};

export const roleLabelsHi: Record<Role, string> = {
  unit_head: '\u092f\u0942\u0928\u093f\u091f \u092a\u094d\u0930\u092e\u0941\u0916',
  aayam_pramukh: '\u0906\u092f\u093e\u092e \u092a\u094d\u0930\u092e\u0941\u0916',
  vibhag_pramukh: '\u0935\u093f\u092d\u093e\u0917 \u092a\u094d\u0930\u092e\u0941\u0916',
  karyakarta: '\u0915\u093e\u0930\u094d\u092f\u0915\u0930\u094d\u0924\u093e',
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
  super_admin: '\u0938\u0941\u092a\u0930 \u090f\u0921\u092e\u093f\u0928',
  org_admin: '\u0938\u0902\u0938\u094d\u0925\u093e \u090f\u0921\u092e\u093f\u0928',
  karyakarta: '\u0915\u093e\u0930\u094d\u092f\u0915\u0930\u094d\u0924\u093e',
  unit_head: '\u092f\u0942\u0928\u093f\u091f \u092a\u094d\u0930\u092e\u0941\u0916',
  aayam_pramukh: '\u0906\u092f\u093e\u092e \u092a\u094d\u0930\u092e\u0941\u0916',
  vibhag_pramukh: '\u0935\u093f\u092d\u093e\u0917 \u092a\u094d\u0930\u092e\u0941\u0916',
  prant_sanyojak: '\u092a\u094d\u0930\u093e\u0928\u094d\u0924 \u0938\u0902\u092f\u094b\u091c\u0915',
  prant_aayam_pramukh: '\u092a\u094d\u0930\u093e\u0928\u094d\u0924 \u0906\u092f\u093e\u092e \u092a\u094d\u0930\u092e\u0941\u0916',
  kshetra_reviewer: '\u0915\u094d\u0937\u0947\u0924\u094d\u0930 \u0938\u092e\u0940\u0915\u094d\u0937\u0915',
};
