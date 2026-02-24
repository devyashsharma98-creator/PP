"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Network, Crown, Shield, User } from 'lucide-react';
import { useT } from '@/lib/useT';

const aayamColors: Record<string, string> = {
  Yuva: 'bg-[hsl(var(--info)/.15)] text-info',
  Mahila: 'bg-accent text-accent-foreground',
  Shodh: 'bg-[hsl(var(--success)/.15)] text-success',
  Prachar: 'bg-primary/10 text-primary',
  Vimarsh: 'bg-[hsl(var(--warning)/.15)] text-warning',
};

const vibhags = [
  {
    name: 'Bhopal Vibhag',
    sanyojak: 'Shri Rajendra Jain',
    isCurrent: true,
    aayams: [
      { name: 'Yuva', pramukh: 'Suresh Yadav', contact: '98265XXXXX' },
      { name: 'Mahila', pramukh: 'Sunita Chouhan', contact: '98270XXXXX' },
      { name: 'Shodh', pramukh: 'Kavita Singh', contact: '98264XXXXX' },
      { name: 'Prachar', pramukh: 'Ramesh Sharma', contact: '98261XXXXX' },
      { name: 'Vimarsh', pramukh: 'Anil Verma', contact: '98263XXXXX' },
    ],
  },
  { name: 'Vidisha Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Sehore Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Narmadapuram Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Rajgarh Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Gwalior Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Jabalpur Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Indore Vibhag', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
];

export default function Dayitv() {
  const t = useT();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Bhopal Vibhag']));

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">{t("Dayitv", "दायित्व")}</h1>
        <p className="text-muted-foreground text-sm">{t("Organizational Structure", "संगठन संरचना")}</p>
      </div>

      {/* Kshetra */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-t-4 border-t-[hsl(var(--warning))]">
          <CardContent className="pt-4 flex items-center gap-4">
            <Crown className="w-8 h-8 text-warning shrink-0" />
            <div>
              <Badge className="bg-[hsl(var(--warning)/.15)] text-warning mb-1.5 text-[10px]">Kshetra Level</Badge>
              <h3 className="font-semibold text-sm">Kshetriya Pramukh</h3>
              <p className="text-xs text-muted-foreground">Shri [Name] · Madhya Kshetra</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-center"><div className="w-0.5 h-5 bg-border" /></div>

      {/* Prant */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card border-t-4 border-t-info">
          <CardContent className="pt-4 flex items-center gap-4">
            <Shield className="w-8 h-8 text-info shrink-0" />
            <div>
              <Badge className="bg-[hsl(var(--info)/.15)] text-info mb-1.5 text-[10px]">Prant Level</Badge>
              <h3 className="font-semibold text-sm">Prant Sanyojak</h3>
              <p className="text-xs text-muted-foreground">Shri Digvijay Chaturvedi · Madhya Bharat Prant</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-center"><div className="w-0.5 h-5 bg-border" /></div>

      {/* Vibhags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Vibhag Level — 8 विभाग</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vibhags.map((vibhag, i) => {
            const isOpen = expanded.has(vibhag.name);
            return (
              <motion.div
                key={vibhag.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Card className={`glass-card overflow-hidden ${vibhag.isCurrent ? 'border-primary/30' : ''}`}>
                  <button
                    className="w-full text-left"
                    onClick={() => vibhag.aayams.length > 0 && toggle(vibhag.name)}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{vibhag.name}</h3>
                            {vibhag.isCurrent && (
                              <Badge className="text-[9px] bg-primary/10 text-primary px-1.5">{t("Current", "वर्तमान")}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vibhag Sanyojak: {vibhag.sanyojak}
                          </p>
                        </div>
                        {vibhag.aayams.length > 0 && (
                          isOpen
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                  </button>

                  <AnimatePresence>
                    {isOpen && vibhag.aayams.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-4 pb-3 pt-2 space-y-1.5">
                          {vibhag.aayams.map(aayam => (
                            <div
                              key={aayam.name}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 px-3 rounded-lg bg-muted/40"
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <Badge className={`text-[9px] ${aayamColors[aayam.name]} shrink-0`}>{aayam.name}</Badge>
                                <span className="text-xs font-medium">{aayam.pramukh}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground pl-6 sm:pl-0">{aayam.contact}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
