'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Vote, Calendar, Clock,
} from 'lucide-react';

interface Props {
  eventId: string;
}

export default function VotePage({ eventId }: Props) {
  const { events, castVote } = useAppContext();
  const t = useT();
  const event = events.find(e => e.id === eventId);

  // Track which option user has selected per poll (before submitting)
  const [selected, setSelected] = useState<Record<string, string>>({});
  // Track which polls have been submitted
  const [voted, setVoted] = useState<Record<string, string>>({});

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">{t('Event not found', 'कार्यक्रम नहीं मिला')}</p>
          <p className="text-sm text-muted-foreground font-devanagari">
            {t('This voting link may be invalid or expired.', 'यह मतदान लिंक अमान्य या समाप्त हो सकता है।')}
          </p>
        </div>
      </div>
    );
  }

  const polls = event.polls ?? [];

  const handleVote = (pollId: string) => {
    const optionId = selected[pollId];
    if (!optionId) return;
    castVote(eventId, pollId, optionId);
    setVoted(p => ({ ...p, [pollId]: optionId }));
  };

  const allVoted = polls.length > 0 && polls.every(p => voted[p.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="saffron-gradient text-white px-4 py-6 shadow-md">
        <p className="text-xs font-devanagari opacity-80 mb-1">{t('Voting / Matdan', 'मतदान')}</p>
        <h1 className="text-xl font-bold font-devanagari leading-snug">{event.title}</h1>
        <div className="flex flex-wrap gap-3 mt-3 text-xs opacity-90">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {event.date}
          </span>
          <span className="flex items-center gap-1">
            {event.unit}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {polls.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Vote className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground font-devanagari">
              {t('No active polls for this event.', 'इस कार्यक्रम के लिए कोई मतदान नहीं है।')}
            </p>
          </div>
        ) : allVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 space-y-3"
          >
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h2 className="text-lg font-bold font-devanagari">{t('Thank you for voting!', 'मतदान के लिए धन्यवाद!')}</h2>
            <p className="text-sm text-muted-foreground font-devanagari">
              {t('Your responses have been recorded.', 'आपके उत्तर दर्ज कर लिए गए हैं।')}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {polls.map((poll, idx) => {
              const hasVoted = !!voted[poll.id];
              const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
              const winnerVotes = hasVoted ? Math.max(...poll.options.map(o => o.votes)) : 0;

              return (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm"
                >
                  {/* Poll header */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {poll.type === 'date'
                        ? <Calendar className="w-3.5 h-3.5 text-primary" />
                        : <Vote className="w-3.5 h-3.5 text-primary" />
                      }
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        {poll.type === 'date' ? t('Date Poll', 'तिथि मतदान') : t('Poll', 'मतदान')}
                      </p>
                      <h3 className="text-sm font-semibold font-devanagari">{t(poll.question, poll.questionHi)}</h3>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {poll.options.map(opt => {
                      const pct = hasVoted && totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      const isMyVote = voted[poll.id] === opt.id;
                      const isWinner = hasVoted && opt.votes === winnerVotes && winnerVotes > 0;

                      return (
                        <div key={opt.id}>
                          {hasVoted ? (
                            /* Results view */
                            <div className={cn(
                              'relative rounded-xl overflow-hidden border-2 px-3 py-2.5 transition-all',
                              isMyVote ? 'border-primary' : 'border-border/50',
                            )}>
                              {/* Bar fill */}
                              <motion.div
                                className={cn(
                                  'absolute inset-0 rounded-xl origin-left',
                                  isMyVote ? 'bg-primary/15' : 'bg-muted/50'
                                )}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: pct / 100 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                              />
                              <div className="relative flex items-center justify-between">
                                <span className={cn(
                                  'text-sm font-devanagari',
                                  isMyVote ? 'font-semibold text-primary' : 'text-foreground'
                                )}>
                                  {opt.label}
                                  {isWinner && <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-normal">
                                    {t('Leading', 'अग्रणी')}
                                  </span>}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {pct}% · {opt.votes}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Selection view */
                            <button
                              onClick={() => setSelected(p => ({ ...p, [poll.id]: opt.id }))}
                              className={cn(
                                'w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all font-devanagari text-sm',
                                selected[poll.id] === opt.id
                                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                                  : 'border-border hover:border-primary/40 text-foreground'
                              )}
                            >
                              {opt.label}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Vote / voted indicator */}
                  {!hasVoted && (
                    <Button
                      className="w-full saffron-gradient text-white border-0"
                      disabled={!selected[poll.id]}
                      onClick={() => handleVote(poll.id)}
                    >
                      <Vote className="w-4 h-4 mr-2" />
                      {t('Cast Vote', 'मत दें')}
                    </Button>
                  )}
                  {hasVoted && (
                    <p className="text-center text-xs text-green-600 font-devanagari flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('Vote recorded', 'मत दर्ज किया गया')}
                    </p>
                  )}

                  {/* Finalized badge */}
                  {poll.isFinalized && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-devanagari">
                        {t('Poll finalized.', 'मतदान अंतिम हो चुका है।')}
                        {poll.type === 'date' && poll.winnerOptionId && (
                          <> {t('Selected date:', 'चयनित तिथि:')} <strong>{poll.options.find(o => o.id === poll.winnerOptionId)?.label}</strong></>
                        )}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
