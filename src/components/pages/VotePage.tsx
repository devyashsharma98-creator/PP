'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext, type GatividhiEvent } from '@/context/AppContext';
import { usePublicEvent } from '@/hooks/usePublicEvent';
import { useT } from '@/lib/useT';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Vote, Calendar, Clock, MapPin, Flame,
  TrendingUp, Sparkles, Award, Shield, AlertTriangle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  eventId: string;
}

export default function VotePage({ eventId }: Props) {
  const { events, castVote } = useAppContext();
  const t = useT();
  const contextEvent = events.find(e => e.id === eventId);
  const { event, loading: publicLoading, error: publicLoadError, setEvent: setPublicEvent } = usePublicEvent(eventId, contextEvent);

  // Track which option user has selected per poll (before submitting)
  const [selected, setSelected] = useState<Record<string, string>>({});
  // Track which polls have been submitted
  const [voted, setVoted] = useState<Record<string, string>>({});
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

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
                {publicLoading ? t('Loading voting details…', 'मतदान विवरण लोड हो रहा है…') : t('Event not found', 'कार्यक्रम नहीं मिला')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari">
                {publicLoading ? t('Please wait a moment.', 'कृपया कुछ क्षण प्रतीक्षा करें।') : (publicLoadError ?? t('This voting link may be invalid or expired.', 'यह मतदान लिंक अमान्य या समाप्त हो सकता है।'))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const polls = event.polls ?? [];

  const handleVote = async (pollId: string) => {
    const optionId = selected[pollId];
    if (!optionId) return;
    const poll = polls.find(p => p.id === pollId);
    if (!poll || poll.isFinalized) return;

    setVoteError(null);
    setSubmittingPollId(pollId);
    try {
      const res = await fetch(`/api/public/events/${eventId}/polls/${pollId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Vote submission failed.');
      }
      if (contextEvent) {
        castVote(eventId, pollId, optionId, { skipRemote: true });
      } else {
        setPublicEvent(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            polls: (prev.polls ?? []).map(p => p.id === pollId
              ? {
                  ...p,
                  options: p.options.map(o => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)),
                }
              : p),
          };
        });
      }
      setVoted(p => ({ ...p, [pollId]: optionId }));
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : 'Vote submission failed.');
    } finally {
      setSubmittingPollId(null);
    }
  };

  const allVoted = polls.length > 0 && polls.every(p => voted[p.id]);

  return (
    <div className="min-h-screen space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-16 h-16 rounded-[1.25rem] saffron-gradient flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <Vote className="w-8 h-8 text-white" />
        </motion.div>
        
        <div className="space-y-2">
          <p className="section-seal uppercase tracking-[0.3em] font-bold">
            {t('Public Matdan · Opinion', 'सार्वजनिक मतदान · अभिमत')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight px-4">{event.title}</h1>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-2 font-medium"><Calendar className="w-4 h-4 text-primary/60" />{event.date}</span>
            <span className="flex items-center gap-2 font-medium"><MapPin className="w-4 h-4 text-primary/60" />{event.unit}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-xl mx-auto">
        {polls.length === 0 ? (
          <Card className="institution-panel-muted border-dashed border-2">
            <CardContent className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-40">
                <Vote className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold font-devanagari text-muted-foreground">
                {t('No active polls for this event.', 'इस कार्यक्रम के लिए कोई सक्रिय मतदान नहीं है।')}
              </p>
            </CardContent>
          </Card>
        ) : allVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <Card className="institution-panel border-success/30 shadow-2xl overflow-hidden bg-success/5 backdrop-blur-sm">
              <div className="h-2 bg-success/40" />
              <CardContent className="py-12 text-center space-y-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                  className="w-24 h-24 rounded-[2rem] bg-success flex items-center justify-center mx-auto shadow-xl shadow-success/20"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-devanagari tracking-tight">
                    {t('Thank you for voting!', 'मतदान के लिए धन्यवाद!')}
                  </h2>
                  <p className="text-muted-foreground font-devanagari text-base italic">
                    {t('Your response has been captured in the decision flow.', 'आपका उत्तर निर्णय प्रक्रिया में दर्ज कर लिया गया है।')}
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
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {polls.map((poll, idx) => {
                const hasVoted = !!voted[poll.id];
                const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
                const winnerVotes = hasVoted ? Math.max(...poll.options.map(o => o.votes)) : 0;

                return (
                  <motion.div
                    key={poll.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card className={cn(
                      "institution-panel shadow-xl transition-all duration-300 overflow-hidden",
                      hasVoted ? "border-success/20 bg-success/5" : "border-primary/10 hover:border-primary/30"
                    )}>
                      <div className={cn("h-1", hasVoted ? "bg-success/40" : "saffron-gradient opacity-40")} />
                      <CardContent className="p-6 space-y-6">
                        {/* Poll header */}
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border transition-colors",
                            hasVoted ? "bg-success/10 border-success/20" : "bg-primary/5 border-primary/10"
                          )}>
                            {poll.type === 'date'
                              ? <Calendar className={cn("w-6 h-6", hasVoted ? "text-success" : "text-primary")} />
                              : <Award className={cn("w-6 h-6", hasVoted ? "text-success" : "text-primary")} />
                            }
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground leading-none">
                              {poll.type === 'date' ? t('Date Poll', 'तिथि मतदान') : t('Opinion Poll', 'विषय मतदान')}
                            </p>
                            <h3 className="text-base font-bold font-devanagari leading-relaxed text-foreground/90">{t(poll.question, poll.questionHi)}</h3>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                          {poll.options.map(opt => {
                            const pct = hasVoted && totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            const isMyVote = voted[poll.id] === opt.id;
                            const isWinner = hasVoted && opt.votes === winnerVotes && winnerVotes > 0;

                            return (
                              <div key={opt.id}>
                                {hasVoted ? (
                                  /* Results view */
                                  <div className={cn(
                                    'relative rounded-xl overflow-hidden border-2 px-4 py-3.5 transition-all',
                                    isMyVote ? 'border-primary shadow-sm bg-primary/5' : 'border-border/40 bg-muted/10',
                                  )}>
                                    {/* Bar fill */}
                                    <motion.div
                                      className={cn(
                                        'absolute inset-0 rounded-xl origin-left',
                                        isMyVote ? 'bg-primary/10' : 'bg-muted/30'
                                      )}
                                      initial={{ scaleX: 0 }}
                                      animate={{ scaleX: pct / 100 }}
                                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                    <div className="relative flex items-center justify-between">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={cn(
                                          'text-sm font-bold font-devanagari truncate',
                                          isMyVote ? 'text-primary' : 'text-foreground/70'
                                        )}>
                                          {opt.label}
                                        </span>
                                        {isWinner && (
                                          <Badge className="text-[8px] bg-primary/20 text-primary border-0 font-bold uppercase tracking-widest shrink-0">
                                            {t('Leading', 'अग्रणी')}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums tracking-widest">{opt.votes} {t('VOTES', 'मत')}</span>
                                        <span className="text-sm font-black text-primary/80 tabular-nums">{pct}%</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Selection view */
                                  <button
                                    onClick={() => setSelected(p => ({ ...p, [poll.id]: opt.id }))}
                                    disabled={poll.isFinalized || submittingPollId === poll.id}
                                    className={cn(
                                      'w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-bold font-devanagari text-sm shadow-sm transform active:scale-[0.98]',
                                      selected[poll.id] === opt.id
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                                        : 'border-border/60 hover:border-primary/30 bg-background text-foreground/70'
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      {opt.label}
                                      {selected[poll.id] === opt.id && <Sparkles className="w-4 h-4 animate-glow-pulse" />}
                                    </div>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Vote / voted indicator */}
                        {!hasVoted && (
                          <div className="space-y-3">
                            <Button
                              className="w-full h-12 rounded-xl saffron-gradient text-white border-0 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-xs gap-2 hover:scale-[1.02] transition-transform"
                              disabled={!selected[poll.id] || poll.isFinalized || submittingPollId === poll.id}
                              onClick={() => handleVote(poll.id)}
                            >
                              {submittingPollId === poll.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  {t('Submitting...', 'भेजा जा रहा है...')}
                                </>
                              ) : (
                                <>
                                  <Vote className="w-4 h-4" />
                                  {t('Cast Institutional Vote', 'अपना मत दर्ज करें')}
                                </>
                              )}
                            </Button>
                            {voteError && (
                              <p className="text-center text-[10px] font-bold text-destructive uppercase tracking-widest">{voteError}</p>
                            )}
                          </div>
                        )}
                        
                        {hasVoted && (
                          <div className="flex flex-col items-center gap-2 pt-2">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20">
                              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                              <span className="text-[10px] font-bold text-success uppercase tracking-widest">{t('Vote recorded', 'मत दर्ज किया गया')}</span>
                            </div>
                          </div>
                        )}

                        {/* Finalized badge */}
                        {poll.isFinalized && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-4 py-3 border border-border/40">
                            <Clock className="w-4 h-4 shrink-0 text-primary/60" />
                            <span className="font-devanagari leading-relaxed">
                              {t('Poll finalized.', 'मतदान अंतिम हो चुका है।')}
                              {poll.type === 'date' && poll.winnerOptionId && (
                                <> {t('Finalized date:', 'चयनित तिथि:')} <strong className="text-foreground">{poll.options.find(o => o.id === poll.winnerOptionId)?.label}</strong></>
                              )}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Bottom disclaimer */}
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/40 mb-2">
          <Shield className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{t('Secure Institutional Voting', 'सुरक्षित संस्थागत मतदान')}</span>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground/60 font-devanagari">
          {t('Your vote is valuable for democratic institutional decision making. Duplicate votes are filtered through organizational audit logic.', 'आपका मत लोकतांत्रिक संस्थागत निर्णय प्रक्रिया हेतु बहुमूल्य है। संगठनात्मक ऑडिट लॉजिक के माध्यम से दोहरे मतों को फ़िल्टर किया जाता है।')}
        </p>
      </div>
    </div>
  );
}

