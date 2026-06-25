import { describe, expect, it } from 'vitest';

import { buildPracharTemplatePreview } from './prachar-template';

describe('buildPracharTemplatePreview', () => {
  it('builds a reusable outreach brief from campaign details', () => {
    const preview = buildPracharTemplatePreview({
      templateName: 'Event Poster',
      campaignTitle: 'Campus Dialogue',
      description: 'Discussion on Bharatiya thought for students.',
      eventDate: '2026-07-05T10:30:00.000Z',
      unit: 'Bhopal Vibhag',
      department: 'Yuva',
      registrationUrl: 'https://example.org/register',
    });

    expect(preview.headline).toBe('Campus Dialogue');
    expect(preview.whatsappText).toContain('Event Poster');
    expect(preview.whatsappText).toContain('Campus Dialogue');
    expect(preview.whatsappText).toContain('Bhopal Vibhag');
    expect(preview.whatsappText).toContain('Register: https://example.org/register');
    expect(preview.hashtags).toContain('#PragyaPravah');
  });

  it('omits optional empty lines instead of producing placeholder text', () => {
    const preview = buildPracharTemplatePreview({
      templateName: 'Quote Card',
      campaignTitle: 'Mandan-Khandan',
    });

    expect(preview.whatsappText).not.toContain('undefined');
    expect(preview.whatsappText).not.toContain('[Contact]');
    expect(preview.whatsappText).not.toContain('[Name]');
    expect(preview.body).toBe('Use this format as a disciplined public communication brief.');
  });
});