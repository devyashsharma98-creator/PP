'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext, type GatividhiEvent } from '@/context/AppContext';
import { usePublicEvent } from '@/hooks/usePublicEvent';
import { useT } from '@/lib/useT';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { PragyaLogo } from '@/components/PragyaLogo';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2, ChevronRight, ChevronLeft,
  Calendar, MapPin, Users, Phone,
  User as UserIcon, Building2, AlertTriangle, ArrowRight,
  FileText, Shield, Compass
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
  const { event, loading: publicLoading, error: publicLoadError } = usePublicEvent(eventId, contextEvent);

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
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <Card className="institution-panel max-w-md w-full border-destructive/20 bg-destructive/5">
          <CardContent className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto border border-destructive/20">
              <AlertTriangle className="w-8 h-8 text-destructive/60" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-destructive/80 font-devanagari">
                {publicLoading ? t('Loading event…', 'कार्यक्रम लोड हो रहा है…') : t('Event not found', 'कार्यक्रम नहीं मिला')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari">
                {publicLoading ? t('Please wait a moment.', 'कृपया कुछ क्षण प्रतीक्षा करें।') : (publicLoadError ?? t('This form link may be invalid or expired.', 'यह फ़ॉर्म लिंक अमान्य या समाप्त हो सकता है।'))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 pravah-lattice-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="institution-panel border-success/30 shadow-2xl overflow-hidden">
            <div className="h-2 saffron-gradient" />
            <CardContent className="py-12 text-center space-y-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className="w-24 h-24 rounded-[2rem] saffron-gradient flex items-center justify-center mx-auto shadow-xl shadow-primary/20"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-devanagari tracking-tight">
                  {t('Registration Successful!', 'पंजीकरण सफल!')}
                </h2>
                <p className="text-muted-foreground font-devanagari text-base italic">
                  {t('Your participation has been recorded in the institutional record.', 'आपकी सहभागिता संस्थागत अभिलेख में दर्ज कर ली गई है।')}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 text-left space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/60">{t('Confirmed Event', 'निश्चित कार्यक्रम')}</p>
                  <p className="text-lg font-bold leading-tight">{event.title}</p>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <span className="flex items-center gap-2 text-sm text-foreground/70"><Calendar className="w-4 h-4 text-primary/60" />{event.date}</span>
                  <span className="flex items-center gap-2 text-sm text-foreground/70"><MapPin className="w-4 h-4 text-primary/60" />{event.unit}</span>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm font-bold font-devanagari text-primary">
                  {t(`See you there, ${form.name}!`, `आपका इंतज़ार रहेगा, ${form.name}!`)}
                </p>
                <div className="mt-8 flex justify-center">
                  <Link href="/">
                    <Button variant="ghost" className="text-xs uppercase tracking-widest font-bold gap-2">
                      {t('Back to Home', 'मुख्य पृष्ठ पर जाएँ')} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const stepLabels = [
    t('Identity', 'परिचय'),
    t('Attendance', 'उपस्थिति'),
    t('Confirmation', 'पुष्टि'),
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* ── Brand + Event header ── */}
      <div className="flex flex-col items-center text-center space-y-4 pt-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-16 h-16 rounded-[1.25rem] saffron-gradient flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <PragyaLogo className="w-10 h-10" />
        </motion.div>
        
        <div className="space-y-2">
          <p className="section-seal uppercase tracking-[0.3em] font-bold">
            {t('Pragya Pravah · Invitation', 'प्रज्ञा प्रवाह · आमंत्रण')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight px-4">{event.title}</h1>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-2 font-medium"><Calendar className="w-4 h-4 text-primary/60" />{event.date}</span>
            <span className="flex items-center gap-2 font-medium"><MapPin className="w-4 h-4 text-primary/60" />{event.unit}</span>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="max-w-md mx-auto space-y-3 px-4">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary/60 leading-none">{t('Progress', 'प्रगति')}</p>
            <p className="text-xs font-bold text-foreground/80">{t(`Step ${step} of 3`, `चरण ${step} / 3`)}</p>
          </div>
          <p className="text-xs font-bold font-devanagari text-primary tracking-wide uppercase">{stepLabels[step - 1]}</p>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
          <motion.div
            className="h-full saffron-gradient rounded-full"
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </div>

      {/* ── Animated step content ── */}
      <div className="relative px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="institution-panel shadow-2xl border-primary/10 overflow-hidden bg-background/80 backdrop-blur-sm">
              <div className="h-1 saffron-gradient opacity-50" />
              <CardContent className="p-8 space-y-6">

                {/* Step 1 — Personal Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold font-devanagari">{t('Your Personal Identity', 'आपकी जानकारी')}</h3>
                      <p className="text-sm text-muted-foreground font-devanagari mt-1">{t('Please provide your details for the institutional registry.', 'कृपया संस्थागत पंजीकरण हेतु अपना विवरण प्रदान करें।')}</p>
                    </div>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                          <UserIcon className="w-3.5 h-3.5 text-primary/60" />
                          {t('Full Name', 'पूरा नाम')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={form.name}
                          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          placeholder={t('As per records', 'अभिलेखों के अनुसार')}
                          className={cn("h-12 rounded-xl bg-muted/20 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all", errors.name && 'border-destructive')}
                        />
                        {errors.name && <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.name}</p>}
                      </div>

                      {showPhone && (
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 text-primary/60" />
                            {t('Contact Number', 'मोबाइल नंबर')} <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={form.phone}
                            onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                            placeholder="10-digit primary number"
                            inputMode="numeric"
                            className={cn("h-12 rounded-xl bg-muted/20 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all", errors.phone && 'border-destructive')}
                          />
                          {errors.phone && <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.phone}</p>}
                        </div>
                      )}

                      {showCity && (
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-3.5 h-3.5 text-primary/60" />
                            {t('City / Location', 'शहर / स्थान')} <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={form.city}
                            onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                            placeholder={t('Current residence', 'वर्तमान निवास')}
                            className={cn("h-12 rounded-xl bg-muted/20 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all", errors.city && 'border-destructive')}
                          />
                          {errors.city && <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">{errors.city}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2 — Attendance */}
                {step === 2 && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-bold font-devanagari">{t('Attendance Logistics', 'उपस्थिति विवरण')}</h3>
                      <p className="text-sm text-muted-foreground font-devanagari mt-1">{t('Coordinate your presence for better arrangement.', 'व्यवस्था की दृष्टि से अपनी उपस्थिति सुनिश्चित करें।')}</p>
                    </div>
                    
                    <div className="space-y-6">
                      {showAttendingCount && (
                        <div className="space-y-4">
                          <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                            {t('Number of Attendees', 'उपस्थितों की संख्या')}
                          </Label>
                          <RadioGroup
                            value={String(form.attendingCount)}
                            onValueChange={v => setForm(p => ({ ...p, attendingCount: Number(v) }))}
                            className="grid grid-cols-4 gap-3"
                          >
                            {[1, 2, 3, 4].map(n => (
                              <div key={n} className="flex">
                                <RadioGroupItem value={String(n)} id={`count-${n}`} className="sr-only" />
                                <Label
                                  htmlFor={`count-${n}`}
                                  className={cn(
                                    'flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 cursor-pointer transition-all text-center select-none shadow-sm',
                                    form.attendingCount === n
                                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                                      : 'border-border/60 hover:border-primary/30 bg-muted/10 text-muted-foreground'
                                  )}
                                >
                                  <Users className={cn("w-5 h-5", form.attendingCount === n ? "text-primary" : "text-muted-foreground/40")} />
                                  <span className="text-sm font-bold">{n}{n === 4 ? '+' : ''}</span>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}

                      {showSpecialNeeds && (
                        <div className={cn(
                          "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all",
                          form.hasSpecialNeeds ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20 border-border/40"
                        )}>
                          <Checkbox
                            id="special-needs"
                            checked={form.hasSpecialNeeds}
                            onCheckedChange={v => setForm(p => ({ ...p, hasSpecialNeeds: !!v }))}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <Label htmlFor="special-needs" className="cursor-pointer font-bold text-sm font-devanagari">
                              {t('Special Assistance Required', 'विशेष सहायता आवश्यक है')}
                            </Label>
                            <p className="text-xs text-muted-foreground font-devanagari">
                              {t('Wheelchair access, specific dietary needs, or other accommodations.', 'व्हीलचेयर, विशिष्ट आहार संबंधी आवश्यकता या अन्य व्यवस्था।')}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                          {t('Additional Notes', 'अतिरिक्त टिप्पणी')}
                          <span className="ml-2 font-normal lowercase opacity-60">({t('optional', 'वैकल्पिक')})</span>
                        </Label>
                        <Textarea
                          value={form.notes}
                          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                          placeholder={t('Any information relevant to your visit...', 'आपकी यात्रा से सम्बंधित कोई जानकारी...')}
                          className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all resize-none"
                        />
                      </div>

                      {customQs.length > 0 && (
                        <div className="space-y-6 pt-4 border-t border-border/40">
                          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em]">
                            {t('Event Specific Questions', 'कार्यक्रम संबंधी प्रश्न')}
                          </p>
                          {customQs.map(q => (
                            <div key={q.id} className="space-y-3">
                              <Label className="font-bold text-sm font-devanagari leading-relaxed text-foreground/80">{t(q.question, q.questionHi)}</Label>
                              {q.type === 'yesno' ? (
                                <div className="flex gap-3">
                                  {['Yes', 'No'].map(opt => (
                                    <label key={opt} className={cn(
                                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm select-none shadow-sm',
                                      form.customAnswers[q.id] === opt
                                        ? 'border-primary bg-primary/5 text-primary font-bold'
                                        : 'border-border/60 hover:border-primary/30 bg-muted/10 text-muted-foreground'
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
                                  placeholder={t('Enter response…', 'उत्तर लिखें…')}
                                  className="h-11 rounded-xl bg-muted/20 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3 — Confirm */}
                {step === 3 && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-bold font-devanagari">{t('Verification & Final Submission', 'सत्यापन एवं अंतिम प्रस्तुति')}</h3>
                      <p className="text-sm text-muted-foreground font-devanagari mt-1">{t('Please verify your details before institutional entry.', 'कृपया प्रस्तुति से पूर्व अपने विवरण का सत्यापन करें।')}</p>
                    </div>

                    <div className="rounded-[2rem] overflow-hidden border-2 border-border/40 shadow-inner bg-muted/10">
                      {([
                        { label: t('Identity', 'नाम'), value: form.name, icon: UserIcon },
                        ...(showPhone ? [{ label: t('Contact', 'मोबाइल'), value: form.phone, icon: Phone }] : []),
                        ...(showCity ? [{ label: t('Location', 'शहर'), value: form.city, icon: Building2 }] : []),
                        ...(showAttendingCount ? [{ label: t('Attendance', 'उपस्थित'), value: `${form.attendingCount}${form.attendingCount === 4 ? '+' : ''} ${t('person(s)', 'व्यक्ति')}`, icon: Users }] : []),
                        ...(showSpecialNeeds && form.hasSpecialNeeds ? [{ label: t('Special Needs', 'विशेष ज़रूरत'), value: t('Required', 'हाँ'), icon: AlertTriangle }] : []),
                        ...(form.notes ? [{ label: t('Notes', 'टिप्पणी'), value: form.notes, icon: FileText }] : []),
                        ...customQs.map(q => ({ label: t(q.question, q.questionHi), value: form.customAnswers[q.id] ?? '—', icon: Compass })),
                      ] as { label: string; value: string; icon: LucideIcon }[]).map((row, i, arr) => (
                        <div
                          key={row.label}
                          className={cn(
                            'flex items-center gap-4 px-6 py-4',
                            i < arr.length - 1 && 'border-b border-border/40'
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0">
                            <row.icon className="w-4 h-4 text-primary/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground leading-none mb-1">{row.label}</p>
                            <p className="text-sm font-bold text-foreground/80 truncate">{row.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <Shield className="w-5 h-5 text-primary shrink-0 opacity-60" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-devanagari">
                        {t('By submitting, you confirm the accuracy of this information for organizational planning.', 'सबमिट करके आप संगठनात्मक योजना हेतु इस जानकारी की सटीकता की पुष्टि करते हैं।')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation buttons ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 px-4 max-w-xl mx-auto">
        {step > 1 && (
          <Button variant="ghost" onClick={goBack} className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs gap-2">
            <ChevronLeft className="w-4 h-4" /> {t('Previous', 'पीछे')}
          </Button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <Button onClick={goNext} className="w-full sm:w-auto h-12 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-widest text-xs gap-2 shadow-lg">
            {t('Continue', 'आगे बढ़ें')} <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto h-12 px-12 rounded-xl saffron-gradient text-white border-0 shadow-xl shadow-primary/30 font-bold uppercase tracking-widest text-xs gap-2 hover:scale-[1.02] transition-transform"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('Submitting...', 'भेजा जा रहा है...')}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t('Confirm Registration', 'पंजीकरण पूर्ण करें')}
              </>
            )}
          </Button>
        )}
      </div>
      
      {submitError && step === 3 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-bold text-destructive uppercase tracking-widest px-4">
          {submitError}
        </motion.p>
      )}
    </div>
  );
}

