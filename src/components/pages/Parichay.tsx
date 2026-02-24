"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Globe, Target, Users, Search, Megaphone, MessagesSquare, BookOpen, Network, ArrowRight } from 'lucide-react';
import { useT } from '@/lib/useT';

const aayams = [
  {
    name: 'Yuva Aayam',
    hindi: 'युवा आयाम',
    icon: Users,
    color: 'text-info bg-[hsl(var(--info)/.12)]',
    desc: 'Increasing participation of youth in Pragya Pravah through study circles, book discussions, and intellectual programs.',
  },
  {
    name: 'Mahila Aayam',
    hindi: 'महिला आयाम',
    icon: Users,
    color: 'text-accent-foreground bg-accent',
    desc: 'Channeling the intellectual capabilities of women members to strengthen national discourse.',
  },
  {
    name: 'Shodh Aayam',
    hindi: 'शोध आयाम',
    icon: Search,
    color: 'text-success bg-[hsl(var(--success)/.12)]',
    desc: 'Long-form research on various topics, publishing findings, and conducting book/group discussions.',
  },
  {
    name: 'Prachar Aayam',
    hindi: 'प्रचार आयाम',
    icon: Megaphone,
    color: 'text-primary bg-primary/10',
    desc: 'Disseminating activities and curated content across social media and other channels.',
  },
  {
    name: 'Vimarsh Aayam',
    hindi: 'विमर्श आयाम',
    icon: MessagesSquare,
    color: 'text-warning bg-[hsl(var(--warning)/.12)]',
    desc: 'Identifying current narratives, preparing counter-narratives — मंडन और खंडन की रणनीति।',
  },
];

const vibhags = [
  'Bhopal', 'Vidisha', 'Sehore', 'Narmadapuram',
  'Rajgarh', 'Gwalior', 'Jabalpur', 'Indore',
];

export default function Parichay() {
  const t = useT();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto pb-10">

      {/* Hero Card */}
      <Card className="glass-card overflow-hidden">
        <div className="h-28 saffron-gradient flex items-center px-6 gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Flame className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pragya Pravah</h1>
            <p className="text-white/80 text-sm font-devanagari mt-0.5">प्रज्ञा प्रवाह</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{t("Global Network", "वैश्विक नेटवर्क")}</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{t("Think Tank Umbrella", "थिंक टैंक")}</Badge>
            </div>
          </div>
        </div>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pragya Pravah is a <strong className="text-foreground">global umbrella organization</strong> for
            national-first intellectuals, organizations, and think tanks. It brings together pragyawan
            (enlightened thinkers) to channel their intellectual capacity towards{' '}
            <strong className="text-foreground">rashtra nirman</strong> — nation building.
          </p>
        </CardContent>
      </Card>

      {/* Mission */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-primary" /> उद्देश्य — Mission
        </h2>
        <Card className="glass-card border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-devanagari text-muted-foreground leading-relaxed">
              जो प्रज्ञावान लोग हैं, जो बुद्धिजीवी हैं, उनकी बौद्धिक क्षमता का उपयोग करके उन्हें
              राष्ट्र निर्माण में कैसे उपयोग में लाया जा सके — यही हमारा उद्देश्य है।
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              "How can the intellectual capacity of enlightened thinkers be utilized for national development?"
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5 Aayams */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" /> पाँच आयाम — Five Dimensions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {aayams.map((aayam, i) => (
            <motion.div
              key={aayam.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="glass-card hover-lift h-full">
                <CardContent className="pt-4 flex gap-3">
                  <div className={`w-10 h-10 rounded-lg ${aayam.color} flex items-center justify-center shrink-0`}>
                    <aayam.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{aayam.name}</h3>
                    <p className="text-[10px] text-primary font-devanagari mb-1">{aayam.hindi}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{aayam.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Madhya Bharat Prant - 8 Vibhags */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" /> मध्यभारत प्रांत — 8 विभाग
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {vibhags.map((v, i) => (
            <motion.div
              key={v}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className={`glass-card text-center py-3 px-2 hover-lift ${v === 'Bhopal' ? 'border-primary/40 bg-primary/5' : ''}`}>
                <p className="text-xs font-medium">{v}</p>
                <p className="text-[10px] text-muted-foreground">Vibhag</p>
                {v === 'Bhopal' && (
                  <Badge className="mt-1.5 text-[9px] bg-primary/10 text-primary px-1.5">Current</Badge>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <Link href="/dayitv" className="block">
          <Card className="glass-card hover-lift cursor-pointer border-info/30 hover:border-info/60 transition-colors h-full">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--info)/.12)] flex items-center justify-center shrink-0">
                <Network className="w-5 h-5 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Dayitv</p>
                <p className="text-[10px] text-muted-foreground font-devanagari">संगठन संरचना देखें</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/vimarsh" className="block">
          <Card className="glass-card hover-lift cursor-pointer border-warning/30 hover:border-warning/60 transition-colors h-full">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--warning)/.12)] flex items-center justify-center shrink-0">
                <MessagesSquare className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Vimarsh</p>
                <p className="text-[10px] text-muted-foreground font-devanagari">15 विमर्श विषय खोजें</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/library" className="block">
          <Card className="glass-card hover-lift cursor-pointer border-success/30 hover:border-success/60 transition-colors h-full">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--success)/.12)] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">E-Library</p>
                <p className="text-[10px] text-muted-foreground font-devanagari">IKS पुस्तकें पढ़ें</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}
