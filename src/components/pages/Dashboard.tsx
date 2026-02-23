"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Plus, CalendarDays, MapPin, User, CheckCircle2, Clock, Eye,
  ArrowRight, BarChart3, Users, TrendingUp,
} from 'lucide-react';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Draft: 'status-draft',
    'Pending Aayam Review': 'status-pending-review',
    'Pending Final Approval': 'status-pending-approval',
    Published: 'status-published',
  };
  return map[status] || '';
};

export default function Dashboard() {
  const { role, events, addEvent, updateEventStatus } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTab, setFormTab] = useState('pre');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);
  console.log('Dashboard Selected Date:', selectedDate);
  const [form, setForm] = useState({
    title: '', description: '', unit: '',
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
    report: '', fileName: '', videoUrl: '', posterName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !selectedDate) return;
    addEvent({
      title: form.title,
      description: form.description,
      date: format(selectedDate, 'dd MMM yyyy'),
      unit: form.unit || 'Bhopal',
      submittedBy: 'Current User',
      checklist: form.checklist,
      report: form.report,
      imageUrl: '',
    });
    setForm({
      title: '', description: '', unit: '',
      checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
      report: '', fileName: '', videoUrl: '', posterName: '',
    });
    setSelectedDate(undefined);
    setFormTab('pre');
    setDialogOpen(false);
  };

  const toggleChecklist = (key: keyof typeof form.checklist) => {
    setForm(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  };

  // Role-specific content
  if (role === 'vibhag_pramukh') {
    const totalEvents = events.length;
    const published = events.filter(e => e.status === 'Published').length;
    const pending = events.filter(e => e.status === 'Pending Final Approval');
    const units = new Set(events.map(e => e.unit)).size;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vibhag Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of all activities across Bhopal Vibhag</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: totalEvents, icon: BarChart3, color: 'text-primary' },
            { label: 'Published', value: published, icon: CheckCircle2, color: 'text-success' },
            { label: 'Pending Approval', value: pending.length, icon: Clock, color: 'text-warning' },
            { label: 'Active Units', value: units, icon: Users, color: 'text-info' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-70`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Final Approvals Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No events pending final approval.</p>
            ) : (
              <div className="space-y-3">
                {pending.map(event => (
                  <motion.div key={event.id} layout className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.unit} · {event.date}</p>
                    </div>
                    <Button size="sm" onClick={() => updateEventStatus(event.id, 'Published')}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Publish to Feed
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (role === 'aayam_pramukh') {
    const pendingReview = events.filter(e => e.status === 'Pending Aayam Review');
    const forwarded = events.filter(e => e.status === 'Pending Final Approval' || e.status === 'Published');

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Aayam Review Board</h1>
          <p className="text-muted-foreground text-sm">Review and forward events submitted by Unit Heads</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Reviews */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Pending Reviews ({pendingReview.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReview.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">All caught up! No pending reviews.</p>
              ) : (
                pendingReview.map(event => (
                  <motion.div key={event.id} layout className="p-4 rounded-lg bg-accent/50 border border-border/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <MapPin className="w-3 h-3" />{event.unit}
                          <CalendarDays className="w-3 h-3 ml-2" />{event.date}
                        </p>
                      </div>
                      <Badge className={statusBadge(event.status)}>{event.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <Button size="sm" onClick={() => updateEventStatus(event.id, 'Pending Final Approval')}>
                      Review & Forward <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Forwarded */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" /> Forwarded ({forwarded.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forwarded.map(event => (
                <div key={event.id} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{event.title}</p>
                    <Badge className={statusBadge(event.status)}>{event.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{event.unit} · {event.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Unit Head View
  const myEvents = events.filter(e => e.submittedBy === 'Current User' || true); // show all for demo
  const checklistItems: { key: keyof typeof form.checklist; label: string }[] = [
    { key: 'designing', label: 'Designing (डिज़ाइनिंग)' },
    { key: 'food', label: 'Food (भोजन)' },
    { key: 'seating', label: 'Sitting & Place (बैठक व स्थान)' },
    { key: 'transport', label: 'Transport (परिवहन)' },
    { key: 'accommodation', label: 'Accommodation (आवास)' },
    { key: 'soundMic', label: 'Sound + Music (ध्वनि)' },
    { key: 'camera', label: 'Camera (कैमरा)' },
    { key: 'screen', label: 'Screen (स्क्रीन)' },
    { key: 'lights', label: 'Lights (रोशनी)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gatividhi Dashboard</h1>
          <p className="text-muted-foreground text-sm">Create and track events for your unit</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Create New Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-popover">
            <DialogHeader>
              <DialogTitle>New Gatividhi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Event Title</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter event name" required />
                </div>
                <div>
                  <Label>Date</Label>
                  <Popover open={calOpen} onOpenChange={setCalOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-picker-trigger"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        type="button"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                        {selectedDate ? format(selectedDate, 'dd MMM yyyy') : <span className="text-muted-foreground">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                      onClick={() => {
                        console.log('PopoverContent Clicked');
                        setSelectedDate(new Date(2026, 1, 25));
                        setCalOpen(false);
                      }}
                    >
                      <Calendar
                        id="date-picker-calendar"
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. Bhopal" />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
              </div>

              <Tabs value={formTab} onValueChange={setFormTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="pre" className="flex-1">Vyavastha (व्यवस्थाएं)</TabsTrigger>
                  <TabsTrigger value="post" className="flex-1">Vritt (विस्तृत)</TabsTrigger>
                </TabsList>
                <TabsContent value="pre" className="space-y-3 pt-2">
                  {checklistItems.map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <Checkbox
                        checked={form.checklist[item.key]}
                        onCheckedChange={() => toggleChecklist(item.key)}
                        id={item.key}
                      />
                      <Label htmlFor={item.key} className="text-sm cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="post" className="space-y-3 pt-2">
                  <div>
                    <Label>Vritt (विस्तृत)</Label>
                    <Textarea value={form.report} onChange={e => setForm(p => ({ ...p, report: e.target.value }))} rows={3} placeholder="Write the detailed post-event report..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Upload Photos</Label>
                      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setForm(p => ({ ...p, fileName: 'photos_event.zip' }))}>
                        {form.fileName ? (
                          <p className="text-foreground font-medium text-xs">📷 {form.fileName}</p>
                        ) : (
                          <p className="text-xs">📷 Photos (simulated)</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Upload Video</Label>
                      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setForm(p => ({ ...p, videoUrl: 'event_video.mp4' }))}>
                        {form.videoUrl ? (
                          <p className="text-foreground font-medium text-xs">🎥 {form.videoUrl}</p>
                        ) : (
                          <p className="text-xs">🎥 Video (simulated)</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Upload Poster</Label>
                    <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setForm(p => ({ ...p, posterName: 'event_poster.jpg' }))}>
                      {form.posterName ? (
                        <p className="text-foreground font-medium text-xs">🖼️ {form.posterName}</p>
                      ) : (
                        <p className="text-xs">🖼️ Upload Poster (simulated)</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full">Submit for Review</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {myEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass-card hover-lift h-full">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm leading-snug flex-1 mr-2">{event.title}</h3>
                    <Badge className={`${statusBadge(event.status)} text-[10px] shrink-0`}>{event.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.unit}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" /> {event.submittedBy}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
