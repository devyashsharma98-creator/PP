"use client";

import { useState, useCallback } from "react";
import { Users, Plus, Clock, Activity, Trash2, Search, X } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useVolunteers, useVolunteerSummary, useCreateActivity, useDeleteActivity, useVolunteerActivities, useEnrollVolunteer } from "@/hooks/api/use-volunteers";
import { useUsers } from "@/hooks/api/use-users";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Volunteer {
  id: string;
  profileId: string;
  displayName?: string | null;
  email?: string | null;
  skills?: string[];
  joinedAt?: string | null;
  totalHours: number;
  activityCount: number;
}

interface Activity {
  id: string;
  volunteerId: string;
  activityType: string;
  description?: string | null;
  hoursLogged?: number | null;
  date: string;
}

const ACTIVITY_LABELS: Record<string, { en: string; hi: string }> = {
  shakha_attendance: { en: "Shakha Attendance", hi: "शाखा उपस्थिति" },
  event_duty: { en: "Event Duty", hi: "कार्यक्रम ड्यूटी" },
  training: { en: "Training", hi: "प्रशिक्षण" },
  outreach: { en: "Outreach", hi: "प्रचार" },
  admin: { en: "Admin", hi: "प्रशासन" },
  other: { en: "Other", hi: "अन्य" },
};

export function VolunteersPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();

  const { data: volunteers = [], isLoading, isError } = useVolunteers();
  const { data: summary } = useVolunteerSummary();
  const typedVolunteers = volunteers as Volunteer[];
  const enrollMutation = useEnrollVolunteer();

  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activityType: "event_duty", description: "", hoursLogged: 2, date: new Date().toISOString().slice(0, 16),
  });

  const { data: users = [] } = useUsers({ limit: 100 });
  const enrolledProfileIds = new Set(typedVolunteers.map((v) => v.profileId));
  const filteredEnrollCandidates = (users as Array<{ id: string; displayName: string | null; email: string | null }>)
    .filter((u) => !enrolledProfileIds.has(u.id))
    .filter((u) => !enrollSearch || (u.displayName ?? u.email ?? "").toLowerCase().includes(enrollSearch.toLowerCase()));

  const { data: activities = [], isLoading: activitiesLoading } = useVolunteerActivities(selectedVolunteer ?? "");
  const typedActivities = activities as Activity[];
  const createActivityMutation = useCreateActivity(selectedVolunteer ?? "");
  const deleteActivityMutation = useDeleteActivity();

  const handleLogActivity = useCallback(async () => {
    if (!selectedVolunteer || createActivityMutation.isPending) return;
    try {
      await createActivityMutation.mutateAsync({
        activityType: newActivity.activityType,
        description: newActivity.description,
        hoursLogged: newActivity.hoursLogged,
        date: new Date(newActivity.date).toISOString(),
      });
      setShowLogActivity(false);
      setNewActivity({ activityType: "event_duty", description: "", hoursLogged: 2, date: new Date().toISOString().slice(0, 16) });
      addToast(t("Activity logged!", "गतिविधि दर्ज की गई!"), "success");
    } catch {
      addToast(t("Failed to log activity", "गतिविधि दर्ज करने में विफल"), "error");
    }
  }, [selectedVolunteer, newActivity, createActivityMutation, t, addToast]);

  const handleEnroll = useCallback(async (profileId: string) => {
    if (enrollMutation.isPending) return;
    try {
      await enrollMutation.mutateAsync(profileId);
      setShowEnroll(false);
      setEnrollSearch("");
      addToast(t("Volunteer enrolled!", "स्वयंसेवक नामांकित!"), "success");
    } catch {
      addToast(t("Failed to enroll volunteer", "स्वयंसेवक नामांकन विफल"), "error");
    }
  }, [enrollMutation, addToast, t]);

  const [confirmDeleteActivity, setConfirmDeleteActivity] = useState<string | null>(null);

  const handleDeleteActivity = useCallback(async (activityId: string) => {
    try {
      await deleteActivityMutation.mutateAsync(activityId);
    } catch {
      addToast(t("Failed to delete", "हटाने में विफल"), "error");
    }
  }, [deleteActivityMutation, addToast, t]);

  return (
    <Card id="volunteers" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Volunteers", "स्वयंसेवक")}
          </CardTitle>
          {summary && (
            <Badge variant="outline" className="text-xs ml-1">
              {summary.total} {t("active", "सक्रिय")}
            </Badge>
          )}
        </div>
        {permissions.canManageVolunteers && (
          <Button size="sm" onClick={() => setShowEnroll(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("Enroll Volunteer", "स्वयंसेवक जोड़ें")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("Failed to load volunteers", "स्वयंसेवक लोड करने में विफल")}</p>
          </div>
        ) : typedVolunteers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("No volunteer profiles yet.", "अभी तक कोई स्वयंसेवक प्रोफ़ाइल नहीं।")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {typedVolunteers.map((v) => (
              <div key={v.id}>
                <button
                  onClick={() => setSelectedVolunteer(selectedVolunteer === v.id ? null : v.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedVolunteer === v.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{v.displayName ?? v.email ?? v.profileId.slice(0, 8)}</p>
                      {v.skills && v.skills.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {v.skills.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.totalHours}h</span>
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{v.activityCount}</span>
                    </div>
                  </div>
                </button>
                {selectedVolunteer === v.id && (
                  <div className="pl-4 mt-2 space-y-2">
                    {permissions.canLogActivity && (
                      <Button size="sm" variant="outline" onClick={() => setShowLogActivity(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        {t("Log Activity", "गतिविधि दर्ज करें")}
                      </Button>
                    )}
                    {activitiesLoading ? (
                      <div className="flex justify-center py-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : typedActivities.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("No activities recorded.", "कोई गतिविधि दर्ज नहीं।")}</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {typedActivities.map((a) => {
                          const label = ACTIVITY_LABELS[a.activityType] ?? ACTIVITY_LABELS.other;
                          return (
                            <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{lang === "hi" ? label.hi : label.en}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
                                {a.hoursLogged && <span className="text-xs text-muted-foreground">({a.hoursLogged}h)</span>}
                              </div>
                              {permissions.canManageVolunteers && (
                                <button onClick={() => setConfirmDeleteActivity(a.id)} className="text-destructive/60 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Enroll Volunteer Dialog */}
        <Dialog open={showEnroll} onOpenChange={(open) => { setShowEnroll(open); if (!open) setEnrollSearch(""); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("Enroll Volunteer", "स्वयंसेवक नामांकित करें")}</DialogTitle>
              <DialogDescription>
                {t("Select a member to enroll as a volunteer.", "किसी सदस्य को स्वयंसेवक के रूप में नामांकित करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("Search members…", "सदस्य खोजें…")}
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                />
                {enrollSearch && (
                  <button className="absolute right-2 top-2.5" onClick={() => setEnrollSearch("")}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                {filteredEnrollCandidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {enrolledProfileIds.size > 0 && !enrollSearch
                      ? t("All members are already enrolled.", "सभी सदस्य पहले से नामांकित हैं।")
                      : t("No matching members found.", "कोई मिलान सदस्य नहीं मिला।")}
                  </p>
                ) : (
                  filteredEnrollCandidates.map((u) => (
                    <button
                      key={u.id}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center justify-between gap-2"
                      onClick={() => handleEnroll(u.id)}
                      disabled={enrollMutation.isPending}
                    >
                      <span className="font-medium">{u.displayName ?? u.email ?? u.id.slice(0, 8)}</span>
                      {u.email && <span className="text-xs text-muted-foreground truncate">{u.email}</span>}
                    </button>
                  ))
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowEnroll(false)}>{t("Cancel", "रद्द करें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showLogActivity} onOpenChange={setShowLogActivity}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Log Activity", "गतिविधि दर्ज करें")}</DialogTitle>
              <DialogDescription>
                {t("Record a volunteer activity entry.", "स्वयंसेवक गतिविधि रिकॉर्ड करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Activity Type", "गतिविधि प्रकार")}</Label>
                <Select value={newActivity.activityType} onValueChange={(v) => setNewActivity(p => ({ ...p, activityType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Description", "विवरण")}</Label>
                <Textarea value={newActivity.description} onChange={(e) => setNewActivity(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Hours", "घंटे")}</Label>
                  <Input type="number" min={1} value={newActivity.hoursLogged} onChange={(e) => setNewActivity(p => ({ ...p, hoursLogged: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Date", "तारीख")}</Label>
                  <Input type="datetime-local" value={newActivity.date} onChange={(e) => setNewActivity(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLogActivity(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleLogActivity} disabled={createActivityMutation.isPending}>{t("Log", "दर्ज करें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!confirmDeleteActivity} onOpenChange={(o) => { if (!o) setConfirmDeleteActivity(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Delete activity?", "गतिविधि हटाएँ?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("This activity record will be permanently deleted.", "यह गतिविधि रिकॉर्ड स्थायी रूप से हटा दिया जाएगा।")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel", "रद्द करें")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (confirmDeleteActivity) handleDeleteActivity(confirmDeleteActivity); setConfirmDeleteActivity(null); }}
              >
                {t("Delete", "हटाएँ")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
