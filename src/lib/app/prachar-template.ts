export interface PracharTemplateInput {
  templateName: string;
  campaignTitle: string;
  campaignTitleHi?: string | null;
  description?: string | null;
  eventDate?: string | null;
  unit?: string | null;
  department?: string | null;
  registrationUrl?: string | null;
}

export interface PracharTemplatePreview {
  headline: string;
  body: string;
  hashtags: string[];
  whatsappText: string;
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatDate(value?: string | null): string | null {
  const raw = clean(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function buildPracharTemplatePreview(input: PracharTemplateInput): PracharTemplatePreview {
  const headline = clean(input.campaignTitleHi) ?? clean(input.campaignTitle) ?? 'Untitled campaign';
  const body = clean(input.description) ?? 'Use this format as a disciplined public communication brief.';
  const hashtags = ['#PragyaPravah', '#BharatiyaChintan'];

  const detailLines = [
    `Format: ${clean(input.templateName) ?? 'Campaign format'}`,
    `Title: ${headline}`,
    clean(input.description),
    formatDate(input.eventDate) ? `Date: ${formatDate(input.eventDate)}` : null,
    clean(input.unit) ? `Unit: ${clean(input.unit)}` : null,
    clean(input.department) ? `Aayam: ${clean(input.department)}` : null,
    clean(input.registrationUrl) ? `Register: ${clean(input.registrationUrl)}` : null,
    '',
    'Pragya Pravah',
    hashtags.join(' '),
  ].filter((line): line is string => line !== null);

  return {
    headline,
    body,
    hashtags,
    whatsappText: detailLines.join('\n'),
  };
}