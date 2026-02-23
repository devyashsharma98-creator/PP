"use client";

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, CalendarDays, MapPin, CheckCircle2, Activity } from 'lucide-react';

const historyItems = [
  { date: '2026-02-15', title: 'Yuva Sangam organized', unit: 'Bhopal Shahar', type: 'Event' },
  { date: '2026-01-20', title: 'Joined Prachar Aayam', unit: 'Bhopal', type: 'Milestone' },
  { date: '2025-12-10', title: 'Bharatiya Vigyan Pradarshani', unit: 'Raisen', type: 'Event' },
  { date: '2025-11-05', title: 'Promoted to Unit Head', unit: 'Bhopal Shahar', type: 'Milestone' },
  { date: '2025-09-18', title: 'Samajik Samarasta Sammelan', unit: 'Sehore', type: 'Event' },
  { date: '2025-08-15', title: 'Independence Day celebration', unit: 'Bhopal Shahar', type: 'Event' },
  { date: '2025-06-01', title: 'Completed Karyakarta Training', unit: 'Vidisha', type: 'Milestone' },
  { date: '2025-03-22', title: 'E-Library contribution - 5 books uploaded', unit: 'Bhopal', type: 'Contribution' },
  { date: '2024-12-01', title: 'First event organized as Karyakarta', unit: 'Bhopal Shahar', type: 'Event' },
  { date: '2024-08-10', title: 'Onboarded as Karyakarta', unit: 'Bhopal Shahar', type: 'Milestone' },
];

const typeColors: Record<string, string> = {
  Event: 'status-pending-review',
  Milestone: 'status-published',
  Contribution: 'status-pending-approval',
};

export default function AapKaItihas() {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-2xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-primary" /> Aaj ka Itihas
        </h1>
        <p className="text-muted-foreground text-sm font-devanagari">आज का इतिहास - {today} | Today in History</p>
      </div>

      {/* Historical Facts Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
          <CalendarDays className="w-5 h-5 text-primary" /> ऐतिहासिक तथ्य (Historical Facts)
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { year: '1969', event: 'हिंदी सिनेमा की मशहूर अभिनेत्री मधुबाला का निधन हुआ था।' },
            { year: '1969', event: 'प्रसिद्ध ऐतिहासिक उपन्यासकार वृंदावनलाल वर्मा का निधन हुआ।' },
            { year: '1954', event: 'बाबा हरदेव सिंह, संत निरंकारी मिशन के आध्यात्मिक गुरु का जन्म।' },
            { year: '1468', event: 'छापेखाने के आविष्कारक जोहान गुटेनबर्ग का निधन।' },
          ].map((fact, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card border-l-4 border-l-primary hover-lift">
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  <span className="text-lg font-bold text-primary/80 shrink-0 w-12">{fact.year}</span>
                  <p className="text-sm font-devanagari leading-relaxed">{fact.event}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Activity Timeline Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
          <Activity className="w-5 h-5 text-primary" /> आपकी गतिविधियाँ (Your Activities)
        </h2>
        <div className="relative pt-2">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-6 bottom-4 w-0.5 bg-border" />

          <div className="space-y-4">
            {historyItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex gap-4 relative"
              >
                <div className="w-8 h-8 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center z-10 shrink-0 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <Card className="glass-card flex-1 hover-lift">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <Badge className={`${typeColors[item.type]} text-[10px] shrink-0`}>{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{item.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.unit}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
