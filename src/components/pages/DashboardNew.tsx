"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CountUp from "react-countup";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isValid } from "date-fns";
import {
  Plus, CalendarDays, MapPin, User, CheckCircle2, Clock, Eye,
  ArrowRight, BarChart3, Users, TrendingUp, X, Link2, ClipboardCheck,
  Phone, Building2, Trash2, SlidersHorizontal, Vote, Lightbulb, FileText,
  RotateCcw, Sparkles, QrCode, Bell,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { cn } from "@/lib/utils";
import { Masthead } from "@/components/Masthead";
import { useEvents, useCreateEvent, useDeleteEvent, useSubmitEventForReview, usePublishEvent } from '@/hooks/api/use-events';
import { useUnreadCount, useMarkAllNotificationsRead } from '@/hooks/api/use-notifications';
import { useAppContext } from "@/context/AppContext";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Draft: "status-draft",
    "Submitted by Unit": "status-pending-review",
    "Pending Aayam Review": "status-pending-review",
    "Pending Vibhag Review": "status-pending-approval",
    "Pending Prant Authorization": "status-pending-approval",
    "Pending Prant Dual Authorization": "status-pending-approval",
    Published: "status-published",
    "Escalated to Kshetra": "status-pending-approval",
    "Returned for Revision": "status-draft",
    Rejected: "status-cancelled",
    Cancelled: "status-cancelled",
  };
  return map[status] || "";
};

const eventStatusHi: Record<string, string> = {
  Draft: "प्रारूप",
  "Submitted by Unit": "इकाई द्वारा प्रस्तुत",
  "Pending Aayam Review": "आयाम समीक्षा प्रतीक्षित",
  "Pending Vibhag Review": "विभाग समीक्षा प्रतीक्षित",
  "Pending Prant Authorization": "प्रांत अनुमोदन प्रतीक्षित",
  "Pending Prant Dual Authorization": "प्रांत दोहरा अनुमोदन प्रतीक्षित",
  Published: "प्रकाशित",
  "Escalated to Kshetra": "क्षेत्र को अग्रेषित",
  "Returned for Revision": "संशोधन के लिए लौटाया",
  Rejected: "अस्वीकृत",
  Cancelled: "रद्द",
};

const checklistItems = [
  { key: 'designing', en: 'Designing', hi: 'डिज़ाइन' },
  { key: 'food', en: 'Food', hi: 'भोजन' },
  { key: 'seating', en: 'Seating', hi: 'आसन व्यवस्था' },
  { key: 'transport', en: 'Transport', hi: 'परिवहन' },
  { key: 'accommodation', en: 'Accommodation', hi: 'आवास' },
  { key: 'soundMic', en: 'Sound & Mic', hi: 'ध्वनि' },
  { key: 'camera', en: 'Camera', hi: 'कैमरा' },
  { key: 'screen', en: 'Screen', hi: 'स्क्रीन' },
  { key: 'lights', en: 'Lights', hi: 'प्रकाश' },
];

export default function Dashboard() {
  const { role, lang, permissions } = useAppContext();
  const router = useRouter();
  const { addToast } = useToast();
  const t = useT();
  
  // API hooks
  const { data: events = [], isLoading, error, refetch } = useEvents();
  const createEventMutation = useCreateEvent();
  const deleteEventMutation = useDeleteEvent();
  const submitEventMutation = useSubmitEventForReview();
  const publishEventMutation = usePublishEvent();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAllReadMutation = useMarkAllNotificationsRead();
  
  // UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTab, setFormTab] = useState("pre");
  const [dateValue, setDateValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", unit: "",
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
    report: "", fileName: "", videoUrl: "", posterName: "",
  });

  const statusLabel = (status: string) => lang === 'hi' ? (eventStatusHi[status] ?? status) : status;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = parseISO(dateValue);
    if (!form.title || !isValid(selectedDate)) return;

    try {
      await createEventMutation.mutateAsync({
        title: form.title,
        description: form.description,
        starts_at: selectedDate.toISOString(),
        unit_id: undefined,
        department_id: undefined,
      });
      
      setForm({
        title: "", description: "", unit: "",
        checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
        report: "", fileName: "", videoUrl: "", posterName: "",
      });
      setDateValue("");
      setFormTab("pre");
      setDialogOpen(false);
      setSubmitted(true);
      addToast(t('Event submitted for review!', 'कार्यक्रम समीक्षा के लिए भेजा गया!'), 'success');
      router.push("/dashboard");
    } catch (err) {
      addToast(t('Failed to submit event', 'कार्यक्रम भेजने में विफल'), 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEventMutation.mutateAsync(id);
      addToast(t('Event deleted', 'कार्यक्रम हटाया गया'), 'success');
    } catch (err) {
      addToast(t('Failed to delete event', 'कार्यक्रम हटाने में विफल'), 'error');
    }
  };

  const handlePublishEvent = async (id: string) => {
    try {
      await publishEventMutation.mutateAsync(id);
      addToast(t('Event published!', 'कार्यक्रम प्रकाशित!'), 'success');
    } catch (err) {
      addToast(t('Failed to publish event', 'कार्यक्रम प्रकाशित करने में विफल'), 'error');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch (err) {
      // Silent fail
    }
  };

  // Stats
  const totalEvents = events.length;
  const published = events.filter(e => e.status === "Published").length;
  const pending = events.filter(e => 
    e.status?.includes("Pending") || e.status === "Submitted by Unit"
  ).length;
  const draft = events.filter(e => e.status === "Draft").length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load dashboard data. Please try again.
            <Button onClick={() => refetch()} className="mt-2" size="sm">Retry</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Masthead title="Dashboard" titleHi="डैशबोर्ड" subtitle="Overview" subtitleHi="अवलोकन" />
      
      {/* Notification Badge */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
            onClick={handleMarkAllNotificationsRead}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          </Button>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={totalEvents} duration={1} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={published} duration={1} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={pending} duration={1} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CountUp end={draft} duration={1} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Events</CardTitle>
            {permissions.canCreateEvent && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Event title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Event description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        placeholder="Unit name"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createEventMutation.isPending}>
                        {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events found. Create your first event to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.starts_at ? format(new Date(event.starts_at), 'dd MMM yyyy') : 'No date'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusBadge(event.status)}>
                        {statusLabel(event.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard?event=${event.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {permissions.canPublishEvent && event.status?.includes('Pending') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePublishEvent(event.id)}
                          disabled={publishEventMutation.isPending}
                        >
                          Publish
                        </Button>
                      )}
                      {permissions.canCreateEvent && event.status === 'Draft' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={deleteEventMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}