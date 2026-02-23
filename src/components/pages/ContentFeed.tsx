"use client";

import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, CalendarDays, MapPin, BookOpen } from 'lucide-react';

const mockArticles = [
  {
    id: 'a1',
    title: 'भारतीय ज्ञान परंपरा और आधुनिक शिक्षा',
    summary: 'How ancient Indian knowledge systems can inform modern educational practices and curriculum design.',
    author: 'Dr. Meera Joshi',
    date: '2026-02-10',
    category: 'Shodh',
    imageUrl: '',
  },
  {
    id: 'a2',
    title: 'Swadeshi Movement: Lessons for Atmanirbhar Bharat',
    summary: 'Drawing parallels between the historical Swadeshi movement and modern self-reliance initiatives.',
    author: 'Prof. Arun Kumar',
    date: '2026-02-05',
    category: 'Aalekh',
    imageUrl: '',
  },
  {
    id: 'a3',
    title: 'Vedic Mathematics in Competitive Exams',
    summary: 'Practical application of Vedic Math sutras for faster calculation in JEE and banking exams.',
    author: 'Ravi Shankar Tiwari',
    date: '2026-01-28',
    category: 'Shodh',
    imageUrl: '',
  },
];

export default function ContentFeed() {
  const { events } = useAppContext();
  const publishedEvents = events.filter(e => e.status === 'Published');

  const handleShare = (title: string) => {
    const text = encodeURIComponent(`Check out: ${title} - Pragya Pravah, Bhopal Vibhag`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const allItems = [
    ...publishedEvents.map(e => ({ type: 'event' as const, ...e })),
    ...mockArticles.map(a => ({ type: 'article' as const, ...a, status: 'Published' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Aalekh & Shodh</h1>
        <p className="text-muted-foreground text-sm">Published events and research articles</p>
      </div>

      <div className="space-y-4">
        {allItems.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass-card hover-lift overflow-hidden">
              {/* Saffron top accent bar */}
              <div className="h-1 saffron-gradient" />
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {item.type === 'event' ? 'Gatividhi' : (item as any).category || 'Aalekh'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => handleShare(item.title)}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-semibold text-base leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.type === 'event' ? item.description : (item as any).summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{item.date}</span>
                  {item.type === 'event' && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(item as any).unit}</span>}
                  {item.type === 'article' && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{(item as any).author}</span>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
