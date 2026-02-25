"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Flame, Globe, Target, Users, Search, Megaphone, MessagesSquare,
  BookOpen, Network, ArrowRight, Eye, Compass, Sparkles, Star,
  Heart, Home, Leaf, Shield, Zap, ChevronDown,
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { useState } from 'react';

// ── Data ─────────────────────────────────────────────────────────────────────
const aayams = [
  {
    name: 'Yuva Aayam', hindi: 'युवा आयाम', icon: Users,
    color: 'text-orange-500 bg-orange-500/10',
    desc: 'Increasing participation of youth in Pragya Pravah through study circles, book discussions, and intellectual programs.',
  },
  {
    name: 'Mahila Aayam', hindi: 'महिला आयाम', icon: Users,
    color: 'text-rose-500 bg-rose-500/10',
    desc: 'Channeling the intellectual capabilities of women members to strengthen national discourse.',
  },
  {
    name: 'Shodh Aayam', hindi: 'शोध आयाम', icon: Search,
    color: 'text-blue-500 bg-blue-500/10',
    desc: 'Long-form research on various topics, publishing findings, and conducting book/group discussions.',
  },
  {
    name: 'Prachar Aayam', hindi: 'प्रचार आयाम', icon: Megaphone,
    color: 'text-emerald-500 bg-emerald-500/10',
    desc: 'Disseminating activities and curated content across social media and other channels.',
  },
  {
    name: 'Vimarsh Aayam', hindi: 'विमर्श आयाम', icon: MessagesSquare,
    color: 'text-violet-500 bg-violet-500/10',
    desc: 'Identifying current narratives, preparing counter-narratives — मंडन और खंडन की रणनीति।',
  },
];

const vibhags = [
  'Bhopal', 'Vidisha', 'Sehore', 'Narmadapuram',
  'Rajgarh', 'Gwalior', 'Jabalpur', 'Indore',
];

const MISSION_POINTS = [
  {
    num: '01', icon: Compass,
    color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-l-orange-500',
    hi: 'हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्रचना की दिशा एवं सूत्रों की खोज करना।',
    en: 'Discovering directions for age-appropriate reconstruction of national life in every sphere based on Hindu values.',
    tag: { hi: 'युगानुकूल पुनर्रचना', en: 'Age-appropriate Reconstruction' },
  },
  {
    num: '02', icon: Globe,
    color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500',
    hi: 'भारतीयत्व एवं समग्र मानवता में विश्वास रखने वाले विचारशील लोगों एवं प्रबुद्ध विशेषज्ञ मंडलों (Think Tanks) का शक्तिशाली व सक्रिय वैश्विक तंत्र खड़ा करना।',
    en: 'Building a powerful global network of thinkers and enlightened Think Tanks who believe in Bharatiyatva and universal humanity.',
    tag: { hi: 'वैश्विक तंत्र', en: 'Global Network' },
  },
  {
    num: '03', icon: Sparkles,
    color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-l-amber-500',
    hi: "भारतीय नागरिकों में 'स्व बोध' जागृत करने हेतु वातावरण तैयार करना।",
    en: "Creating an environment to awaken 'Swa Bodh' — self-awareness and civilisational consciousness — among Indian citizens.",
    tag: { hi: 'स्व बोध जागरण', en: 'Swa Bodh Awakening' },
  },
  {
    num: '04', icon: Star,
    color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-l-violet-500',
    hi: 'प्रज्ञा के क्षेत्र में वैश्विक नेतृत्व करने की दिशा में भारत को तैयार करना।',
    en: 'Preparing India for global leadership in the field of Pragya — intellectual wisdom and knowledge.',
    tag: { hi: 'वैश्विक नेतृत्व', en: 'Global Leadership' },
  },
];

const PANCH = [
  {
    num: '१', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30',
    hi: 'सामाजिक समरसता', en: 'Social Harmony',
    desc: 'जाति-भेद और ऊँच-नीच की भावना समाप्त करके समाज में एकता और सद्भाव बढ़ाना।',
    descEn: 'Ending caste discrimination and promoting unity and harmony among all sections of society.',
  },
  {
    num: '२', icon: Home, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    hi: 'कुटुंब प्रबोधन', en: 'Family Awakening',
    desc: 'परिवार के मूल्यों को बढ़ावा देना, संयुक्त परिवार की परंपरा और बच्चों में संस्कारों का विकास।',
    descEn: 'Strengthening family values, joint family traditions and cultivating good values in children.',
  },
  {
    num: '३', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
    hi: 'पर्यावरण संरक्षण', en: 'Environmental Protection',
    desc: 'प्रकृति को माता मानकर उसकी रक्षा करना, पर्यावरण के अनुकूल जीवनशैली अपनाना।',
    descEn: 'Treating nature as mother, adopting eco-friendly lifestyles and conserving natural resources.',
  },
  {
    num: '४', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
    hi: 'नागरिक कर्तव्य', en: 'Civic Duty',
    desc: 'हर नागरिक अपने अधिकारों के साथ-साथ कर्तव्यों के प्रति सजग रहे, राष्ट्रहित में योगदान दे।',
    descEn: 'Every citizen aware of duties alongside rights — contributing to national interest and upholding the Constitution.',
  },
  {
    num: '५', icon: Zap, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30',
    hi: 'स्व का बोध', en: 'Swa Bodh',
    desc: 'अपनी संस्कृति, सभ्यता और स्वदेशी उत्पादों के प्रति जागरूकता। आत्मनिर्भर भारत।',
    descEn: 'Awakening awareness about culture, civilisation and indigenous products. Promoting Atmanirbharta.',
  },
];

export default function Parichay() {
  const t = useT();
  const [expandedPanch, setExpandedPanch] = useState<number | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto pb-10">

      {/* ── Hero Card ── */}
      <Card className="glass-card overflow-hidden">
        <div className="h-28 saffron-gradient flex items-center px-6 gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Flame className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pragya Pravah</h1>
            <p className="text-white/80 text-sm font-devanagari mt-0.5">प्रज्ञा प्रवाह</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{t('Global Network', 'वैश्विक नेटवर्क')}</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-[10px]">{t('Think Tank Umbrella', 'थिंक टैंक')}</Badge>
            </div>
          </div>
        </div>
        <CardContent className="pt-5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pragya Pravah is a <strong className="text-foreground">global umbrella organization</strong> for
            national-first intellectuals, organizations, and think tanks — channeling prajna (wisdom) for{' '}
            <strong className="text-foreground">rashtra nirman</strong>.
          </p>
          {/* Vision inline */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-primary uppercase tracking-widest font-semibold mb-0.5">{t('Vision', 'दृष्टि')}</p>
              <p className="text-xs font-devanagari text-foreground/80 leading-relaxed">
                प्रज्ञा आधारित हिंदू जीवन मूल्यों से प्रेरित <strong>लोक कल्याणकारी वैश्विक समाज रचना।</strong>
              </p>
              <p className="text-[10px] text-muted-foreground italic mt-0.5">
                Building a welfare-oriented global society inspired by Pragya-based Hindu life values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Mission — 4 Points ── */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          {t('Mission — Four Objectives', 'लक्ष्य — चतुर्विध')}
        </h2>
        <div className="space-y-3">
          {MISSION_POINTS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-xl border-l-4 ${m.border} bg-card p-4 group hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <span className={`font-mono text-3xl font-bold ${m.color} opacity-15 group-hover:opacity-35 transition-opacity leading-none shrink-0 select-none`}>
                  {m.num}
                </span>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${m.bg} ${m.color} font-semibold`}>
                    {t(m.tag.en, m.tag.hi)}
                  </span>
                  <p className="text-xs font-devanagari text-foreground/80 leading-relaxed">{m.hi}</p>
                  <p className="text-[10px] text-muted-foreground italic">{m.en}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                  <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 5 Aayams ── */}
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

      {/* ── Panch Parivartan ── */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          {t('Five Social Transformations', 'पंच परिवर्तन')}
        </h2>
        <div className="space-y-2">
          {PANCH.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <button
                className={`w-full text-left rounded-xl border ${p.border} ${p.bg} p-4 transition-all hover:shadow-sm`}
                onClick={() => setExpandedPanch(expandedPanch === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-devanagari text-2xl font-bold ${p.color} opacity-30 shrink-0 select-none`}>
                    {p.num}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${p.bg} border ${p.border} flex items-center justify-center shrink-0`}>
                    <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`font-semibold text-sm font-devanagari ${p.color}`}>{p.hi}</p>
                    <p className="text-[10px] text-muted-foreground">{p.en}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedPanch === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.div>
                </div>
                {expandedPanch === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pl-16 space-y-1"
                  >
                    <p className="text-xs font-devanagari text-foreground/70 leading-relaxed">{p.desc}</p>
                    <p className="text-[10px] text-muted-foreground italic">{p.descEn}</p>
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Madhya Bharat Prant – 8 Vibhags ── */}
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

      {/* ── Navigation CTAs ── */}
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
