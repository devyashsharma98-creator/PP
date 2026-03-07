'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext, type GatividhiEvent } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, ChevronRight, ChevronLeft,
  Calendar, MapPin, Users, Flame, Phone,
  User as UserIcon, Building2,
} from 'lucide-react';

interface Props {
  eventId: string;
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -64 : 64, opacity: 0 }),
};

export default function EventForm({ eventId }: Props) {
  const { events, addRegistration } = useAppContext();
  const t = useT();
  const contextEvent = events.find(e => e.id === eventId);
  const [publicEvent, setPublicEvent] = useState<GatividhiEvent | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicLoadError, setPublicLoadError] = useState<string | null>(null);
  const event = contextEvent ?? publicEvent;

  useEffect(() => {
    if (contextEvent) return;
    let cancelled = false;
    setPublicLoading(true);
    setPublicLoadError(null);
    fetch(`/api/public/events/${eventId}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Failed to load event.');
        }
        return res.json() as Promise<{ event: GatividhiEvent }>;
      })
      .then((data) => {
        if (!cancelled) setPublicEvent(data.event);
      })
      .catch((error) => {
        if (!cancelled) {
          setPublicLoadError(error instanceof Error ? error.message : 'Failed to load event.');
        }
      })
      .finally(() => {
        if (!cancelled) setPublicLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contextEvent, eventId]);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fc = event?.formConfig;
  const showPhone = fc ? fc.fields.phone : true;
  const showCity = fc ? fc.fields.city : true;
  const showAttendingCount = fc ? fc.fields.attendingCount : true;
  const showSpecialNeeds = fc ? fc.fields.specialNeeds : true;
  const customQs = fc?.customQuestions ?? [];

  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    attendingCount: 1,
    hasSpecialNeeds: false,
    notes: '',
    customAnswers: {} as Record<string, string>,
  });

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('Name is required', 'नाम आवश्यक है');
    if (showPhone && !/^\d{10}$/.test(form.phone.trim()))
      e.phone = t('Enter a valid 10-digit number', 'वैध 10 अंकों का नंबर दर्ज करें');
    if (showCity && !form.city.trim()) e.city = t('City is required', 'शहर आवश्यक है');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    setDirection(1);
    setStep(s => s + 1);
    setErrors({});
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        attendingCount: form.attendingCount,
        hasSpecialNeeds: form.hasSpecialNeeds,
        notes: form.notes.trim() || undefined,
        customAnswers: form.customAnswers,
      };

      const res = await fetch(`/api/public/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t('Registration failed. Please try again.', 'पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।'));
      }

      if (contextEvent) {
        addRegistration(eventId, {
          name: payload.name,
          phone: payload.phone ?? '',
          city: payload.city ?? '',
          attendingCount: payload.attendingCount,
          hasSpecialNeeds: payload.hasSpecialNeeds,
          notes: payload.notes,
          customAnswers: payload.customAnswers,
        }, { skipRemote: true });
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('Registration failed. Please try again.', 'पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Event not found ── */
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            {publicLoading
              ? t('Loading event…', 'कार्यक्रम लोड हो रहा है…')
              : t('Event not found', 'कार्यक्रम नहीं मिला')}
          </p>
          <p className="text-sm text-muted-foreground font-devanagari">
            {publicLoading
              ? t('Please wait a moment.', 'कृपया कुछ क्षण प्रतीक्षा करें।')
              : (publicLoadError ?? t('This form link may be invalid or expired.', 'यह फ़ॉर्म लिंक अमान्य या समाप्त हो सकता है।'))}
          </p>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center space-y-5 max-w-sm mx-auto px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
            className="w-20 h-20 rounded-full saffron-gradient flex items-center justify-center mx-auto shadow-lg"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold font-devanagari">
              {t('Registration Successful!', 'पंजीकरण सफल!')}
            </h2>
            <p className="text-muted-foreground mt-1 font-devanagari text-sm">
              {t('Your registration has been received.', 'आपका पंजीकरण प्राप्त हो गया है।')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-left space-y-1.5">
            <p className="text-sm font-semibold">{event.title}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.unit}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-devanagari">
            {t(`See you there, ${form.name}!`, `आपका इंतज़ार रहेगा, ${form.name}!`)}
          </p>
        </div>
      </motion.div>
    );
  }

  const stepLabels = [
    t('Your Info', 'आपकी जानकारी'),
    t('Attendance', 'उपस्थिति'),
    t('Confirm', 'पुष्टि'),
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 px-0">
      {/* ── Brand + Event header ── */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl saffron-gradient flex items-center justify-center shrink-0 shadow-sm">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-devanagari">
            {t('Pragya Pravah · Registration', 'प्रज्ञा प्रवाह · पंजीकरण')}
          </p>
          <h2 className="font-semibold text-sm leading-snug">{event.title}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.unit}</span>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-devanagari">{t(`Step ${step} of 3`, `चरण ${step} / 3`)}</span>
          <span className="font-devanagari font-medium text-foreground/70">{stepLabels[step - 1]}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full saffron-gradient rounded-full"
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={cn(
                'flex-1 h-0.5 rounded-full transition-colors duration-300',
                n <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* ── Animated step content ── */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm"
          >

            {/* Step 1 — Personal Info */}
            {step === 1 && (
              <>
                <div>
                  <h3 className="text-base font-bold font-devanagari">{t('Your Information', 'आपकी जानकारी')}</h3>
                  <p className="text-xs text-muted-foreground font-devanagari mt-0.5">{t('Tell us who you are', 'बताइए आप कौन हैं')}</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="font-devanagari text-sm flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-primary" />
                      {t('Full Name', 'पूरा नाम')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder={t('Enter your full name', 'अपना पूरा नाम दर्ज करें')}
                      className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  {showPhone && (
                    <div className="space-y-1.5">
                      <Label className="font-devanagari text-sm flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        {t('Mobile Number', 'मोबाइल नंबर')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        placeholder="10-digit number"
                        inputMode="numeric"
                        className={cn(errors.phone && 'border-destructive focus-visible:ring-destructive')}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  )}

                  {showCity && (
                    <div className="space-y-1.5">
                      <Label className="font-devanagari text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {t('City', 'शहर')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.city}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        placeholder={t('e.g. Bhopal', 'जैसे भोपाल')}
                        className={cn(errors.city && 'border-destructive focus-visible:ring-destructive')}
                      />
                      {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 2 — Attendance */}
            {step === 2 && (
              <>
                <div>
                  <h3 className="text-base font-bold font-devanagari">{t('Attendance Details', 'उपस्थिति विवरण')}</h3>
                  <p className="text-xs text-muted-foreground font-devanagari mt-0.5">{t('How many will be attending?', 'कितने लोग आएंगे?')}</p>
                </div>
                <div className="space-y-5">
                  {showAttendingCount && (
                    <div className="space-y-3">
                      <Label className="font-devanagari text-sm font-medium">
                        {t('Number of Attendees', 'उपस्थितों की संख्या')}
                      </Label>
                      <RadioGroup
                        value={String(form.attendingCount)}
                        onValueChange={v => setForm(p => ({ ...p, attendingCount: Number(v) }))}
                        className="grid grid-cols-4 gap-2"
                      >
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} className="flex">
                            <RadioGroupItem value={String(n)} id={`count-${n}`} className="sr-only" />
                            <Label
                              htmlFor={`count-${n}`}
                              className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 cursor-pointer transition-all text-center select-none',
                                form.attendingCount === n
                                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                                  : 'border-border hover:border-primary/40 text-muted-foreground'
                              )}
                            >
                              <Users className="w-4 h-4" />
                              <span className="text-sm leading-none">{n}{n === 4 ? '+' : ''}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {showSpecialNeeds && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/40">
                      <Checkbox
                        id="special-needs"
                        checked={form.hasSpecialNeeds}
                        onCheckedChange={v => setForm(p => ({ ...p, hasSpecialNeeds: !!v }))}
                        className="mt-0.5"
                      />
                      <div>
                        <Label htmlFor="special-needs" className="cursor-pointer font-devanagari text-sm">
                          {t('Special Assistance Required', 'विशेष सहायता आवश्यक है')}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('Wheelchair access, dietary needs, etc.', 'व्हीलचेयर, आहार संबंधी आवश्यकता आदि')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="font-devanagari text-sm">
                      {t('Message / Notes', 'संदेश / टिप्पणी')}
                      <span className="text-muted-foreground ml-1">({t('optional', 'वैकल्पिक')})</span>
                    </Label>
                    <Textarea
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder={t('Anything you want us to know…', 'कोई बात जो आप हमें बताना चाहते हों…')}
                      rows={2}
                    />
                  </div>

                  {customQs.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('Additional Questions', 'अतिरिक्त प्रश्न')}
                      </p>
                      {customQs.map(q => (
                        <div key={q.id} className="space-y-1.5">
                          <Label className="font-devanagari text-sm">{t(q.question, q.questionHi)}</Label>
                          {q.type === 'yesno' ? (
                            <div className="flex gap-3">
                              {['Yes', 'No'].map(opt => (
                                <label key={opt} className={cn(
                                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm select-none',
                                  form.customAnswers[q.id] === opt
                                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                                    : 'border-border hover:border-primary/40 text-muted-foreground'
                                )}>
                                  <input
                                    type="radio"
                                    className="sr-only"
                                    name={`custom-${q.id}`}
                                    value={opt}
                                    checked={form.customAnswers[q.id] === opt}
                                    onChange={() => setForm(p => ({ ...p, customAnswers: { ...p.customAnswers, [q.id]: opt } }))}
                                  />
                                  <span className="font-devanagari">{opt === 'Yes' ? t('Yes', 'हाँ') : t('No', 'नहीं')}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <Input
                              value={form.customAnswers[q.id] ?? ''}
                              onChange={e => setForm(p => ({ ...p, customAnswers: { ...p.customAnswers, [q.id]: e.target.value } }))}
                              placeholder={t('Your answer…', 'आपका उत्तर…')}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3 — Confirm */}
            {step === 3 && (
              <>
                <div>
                  <h3 className="text-base font-bold font-devanagari">{t('Confirm Registration', 'पंजीकरण की पुष्टि करें')}</h3>
                  <p className="text-xs text-muted-foreground font-devanagari mt-0.5">{t('Please verify your details below', 'नीचे अपना विवरण जांचें')}</p>
                </div>

                <div className="rounded-xl overflow-hidden border border-border/60">
                  {([
                    { label: t('Name', 'नाम'), value: form.name },
                    ...(showPhone ? [{ label: t('Mobile', 'मोबाइल'), value: form.phone }] : []),
                    ...(showCity ? [{ label: t('City', 'शहर'), value: form.city }] : []),
                    ...(showAttendingCount ? [{ label: t('Attendees', 'उपस्थित'), value: `${form.attendingCount}${form.attendingCount === 4 ? '+' : ''} ${t('person(s)', 'व्यक्ति')}` }] : []),
                    ...(showSpecialNeeds && form.hasSpecialNeeds ? [{ label: t('Special Needs', 'विशेष ज़रूरत'), value: t('Yes', 'हाँ') }] : []),
                    ...(form.notes ? [{ label: t('Notes', 'टिप्पणी'), value: form.notes }] : []),
                    ...customQs.map(q => ({ label: t(q.question, q.questionHi), value: form.customAnswers[q.id] ?? '—' })),
                  ] as { label: string; value: string }[]).map((row, i, arr) => (
                    <div
                      key={row.label}
                      className={cn(
                        'flex items-start gap-3 px-4 py-2.5',
                        i % 2 === 0 ? 'bg-muted/30' : 'bg-transparent',
                        i < arr.length - 1 && 'border-b border-border/40'
                      )}
                    >
                      <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5 font-devanagari">{row.label}</span>
                      <span className="text-sm font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center font-devanagari">
                  {t('By submitting you confirm your attendance.', 'सबमिट करने पर आप अपनी उपस्थिति की पुष्टि करते हैं।')}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation buttons ── */}
      <div className="flex items-center gap-3">
        {submitError && step === 3 && (
          <p className="text-xs text-destructive flex-1">{submitError}</p>
        )}
        {step > 1 && (
          <Button variant="outline" onClick={goBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('Back', 'वापस')}
          </Button>
        )}
        {step < 3 ? (
          <Button onClick={goNext} className="flex-1">
            {t('Next', 'आगे')} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 saffron-gradient text-white border-0 shadow-md hover:shadow-lg hover:opacity-90"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        )}
      </div>
    </div>
  );
}

