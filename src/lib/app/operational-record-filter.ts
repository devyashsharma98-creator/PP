type EventLike = {
  title?: unknown;
  description?: unknown;
  submittedBy?: unknown;
};

const NON_OPERATIONAL_TITLE_PATTERNS = [
  /^live api test event\b/i,
  /^(local )?public smoke\b/i,
  /^vimarsh satra\s*[-–]\s*test\b/i,
];

const NON_OPERATIONAL_DESCRIPTION_PATTERNS = [
  /\blive verification event\b/i,
  /\bpublic smoke event\b/i,
  /\blocal public smoke\b/i,
  /\bupdated description for the test event\b/i,
];

export function isOperationalEventRecord(record: EventLike): boolean {
  const title = String(record.title ?? "").trim();
  const description = String(record.description ?? "").trim();
  const submittedBy = String(record.submittedBy ?? "").trim();

  if (NON_OPERATIONAL_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return false;
  if (NON_OPERATIONAL_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(description))) return false;
  if (/^demo\b/i.test(submittedBy) && /\b(test|smoke|verification)\b/i.test(`${title} ${description}`)) return false;

  return true;
}

export function filterOperationalEventRecords<T extends EventLike>(records: T[]): T[] {
  return records.filter(isOperationalEventRecord);
}
