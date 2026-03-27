'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext, type GatividhiEvent } from '@/context/AppContext';
import { usePublicEvent } from '@/hooks/usePublicEvent';
import { useT } from '@/lib/useT';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, QrCode, Calendar, MapPin, Flame, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CheckinPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { events, markAttendance } = useAppContext();
  const t = useT();
  const contextEvent = events.find(e => e.id === eventId);
  const { event, loading } = usePublicEvent(eventId, contextEvent);
  const [checkedIn, setCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const handleCheckin = async () => {
    setSubmitting(true);
    setCheckinError(null);
    try {
      const res = await fetch(`/api/public/events/${eventId}/checkin`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Check-in failed.');
      }
      markAttendance(eventId, { skipRemote: true });
      setCheckedIn(true);
    } catch (error) {
      setCheckinError(error instanceof Error ? error.message : 'Check-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <p className="text-muted-foreground font-devanagari">{loading ? t('Loading event…', 'कार्यक्रम लोड हो रहा है…') : t('Event not found.', 'कार्यक्रम नहीं मिला।')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 pt-12 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-16 h-16 rounded-[1.25rem] saffron-gradient flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <QrCode className="w-8 h-8 text-white" />
        </motion.div>
        
        <div className="space-y-2">
          <p className="section-seal uppercase tracking-[0.3em] font-bold">
            {t('Venue Check-in', 'उपस्थिति सत्यापन')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary/60" />{event.date}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary/60" />{event.unit}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {checkedIn ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <Card className="institution-panel border-success/30 shadow-2xl overflow-hidden bg-success/5 backdrop-blur-sm">
              <div className="h-2 bg-success/40" />
              <CardContent className="py-12 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                  className="w-20 h-20 rounded-[1.5rem] bg-success flex items-center justify-center mx-auto shadow-xl shadow-success/20"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-devanagari tracking-tight">
                    {t('Attendance Verified!', 'उपस्थिति सत्यापित!')}
                  </h2>
                  <p className="text-muted-foreground font-devanagari text-sm">
                    {t('Your presence at the venue has been recorded.', 'कार्यक्रम स्थल पर आपकी उपस्थिति दर्ज कर ली गई है।')}
                  </p>
                </div>

                <div className="pt-4 flex justify-center">
                  <Link href="/">
                    <Button variant="ghost" className="text-xs uppercase tracking-widest font-bold gap-2">
                      {t('Back to Home', 'मुख्य पृष्ठ पर जाएँ')} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="institution-panel shadow-2xl border-primary/10 overflow-hidden bg-background/80 backdrop-blur-sm">
              <div className="h-1 saffron-gradient opacity-50" />
              <CardContent className="p-8 text-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-devanagari">{t('Welcome to the Venue', 'कार्यक्रम स्थल पर स्वागत है')}</h3>
                  <p className="text-sm text-muted-foreground font-devanagari">
                    {t('Please click the button below to confirm your presence at this institutional event.', 'कृपया इस संस्थागत कार्यक्रम में अपनी उपस्थिति की पुष्टि के लिए नीचे दिए गए बटन पर क्लिक करें।')}
                  </p>
                </div>

                <Button 
                  onClick={handleCheckin} 
                  disabled={loading}
                  className="w-full h-14 rounded-2xl saffron-gradient text-white border-0 shadow-xl shadow-primary/30 font-bold uppercase tracking-widest text-sm gap-3 hover:scale-[1.02] transition-transform"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('Verifying...', 'सत्यापन जारी...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t('Check-in Now', 'चेक-इन करें')}
                    </>
                  )}
                </Button>

                {checkinError && (
                  <p className="text-sm text-destructive font-devanagari">{checkinError}</p>
                )}

                <div className="pt-2 flex items-center justify-center gap-2 text-muted-foreground/40">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('Pragya Pravah Registry', 'प्रज्ञा प्रवाह पंजिका')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
