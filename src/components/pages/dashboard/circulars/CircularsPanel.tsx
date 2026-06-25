"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Megaphone, Trash2, CheckCheck, AlertCircle, ArrowUp } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useCirculars, useCreateCircular, useDeleteCircular, useAcknowledgeCircular, useUnreadCirculars } from "@/hooks/api/use-circulars";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRIORITY_CONFIG = {
  low: { label: "Low", labelHi: "निम्न", icon: ArrowUp, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  normal: { label: "Normal", labelHi: "सामान्य", icon: Bell, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", labelHi: "उच्च", icon: AlertCircle, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgent", labelHi: "अति आवश्यक", icon: Megaphone, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
} as const;

interface Circular {
  id: string;
  title: string;
  titleHi?: string | null;
  body: string;
  bodyHi?: string | null;
  priority: string;
  scope: string;
  authorName?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export function CircularsPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCircular, setNewCircular] = useState({
    title: "", titleHi: "", body: "", bodyHi: "",
    priority: "normal", scope: "org",
  });

  const filters = activeTab === "unread" ? { unreadOnly: "true" } : undefined;
  const { data: circulars = [], isLoading, isError } = useCirculars(filters);
  const typedCirculars = circulars as Circular[];
  const { data: unreadData } = useUnreadCirculars();

  const createMutation = useCreateCircular();
  const deleteMutation = useDeleteCircular();
  const acknowledgeMutation = useAcknowledgeCircular();

  const handleCreate = useCallback(async () => {
    if (!newCircular.title.trim() || !newCircular.body.trim() || createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({
        title: newCircular.title.trim(),
        titleHi: newCircular.titleHi.trim() || undefined,
        body: newCircular.body.trim(),
        bodyHi: newCircular.bodyHi.trim() || undefined,
        priority: newCircular.priority,
        scope: newCircular.scope,
      });
      setShowCreate(false);
      setNewCircular({ title: "", titleHi: "", body: "", bodyHi: "", priority: "normal", scope: "org" });
      addToast(t("Circular published!", "परिपत्र प्रकाशित!"), "success");
    } catch {
      addToast(t("Failed to create circular", "परिपत्र बनाने में विफल"), "error");
    }
  }, [newCircular, createMutation, t, addToast]);

  const handleAcknowledge = useCallback(async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
      addToast(t("Marked as read", "पढ़ा हुआ चिह्नित"), "success");
    } catch {
      addToast(t("Failed to acknowledge", "पुष्टि करने में विफल"), "error");
    }
  }, [acknowledgeMutation, addToast, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast(t("Circular deleted", "परिपत्र हटा दिया गया"), "info");
    } catch {
      addToast(t("Failed to delete", "हटाने में विफल"), "error");
    }
  }, [deleteMutation, addToast, t]);

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card id="circulars" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Circulars", "परिपत्र")}
          </CardTitle>
          {unreadData && unreadData.count > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">
              {unreadData.count} {t("unread", "अपठित")}
            </Badge>
          )}
        </div>
        {permissions.canCreateCircular && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("Circular", "परिपत्र")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">{t("All", "सभी")}</TabsTrigger>
            <TabsTrigger value="unread">
              {t("Unread", "अपठित")}
              {unreadData && unreadData.count > 0 && (
                <span className="ml-1.5 text-xs">({unreadData.count})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {renderList()}
          </TabsContent>
          <TabsContent value="unread" className="mt-0">
            {renderList()}
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("Publish Circular", "परिपत्र प्रकाशित करें")}</DialogTitle>
              <DialogDescription>
                {t("Broadcast an announcement to the organisation.", "संगठन को एक घोषणा प्रसारित करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Title", "शीर्षक")}</Label>
                <Input value={newCircular.title} onChange={(e) => setNewCircular(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
                <Input value={newCircular.titleHi} onChange={(e) => setNewCircular(p => ({ ...p, titleHi: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Body", "विवरण")}</Label>
                <Textarea value={newCircular.body} onChange={(e) => setNewCircular(p => ({ ...p, body: e.target.value }))} rows={5} />
              </div>
              <div className="space-y-2">
                <Label>{t("Body (Hindi)", "विवरण (हिंदी)")}</Label>
                <Textarea value={newCircular.bodyHi} onChange={(e) => setNewCircular(p => ({ ...p, bodyHi: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Priority", "प्राथमिकता")}</Label>
                  <Select value={newCircular.priority} onValueChange={(v) => setNewCircular(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("Low", "निम्न")}</SelectItem>
                      <SelectItem value="normal">{t("Normal", "सामान्य")}</SelectItem>
                      <SelectItem value="high">{t("High", "उच्च")}</SelectItem>
                      <SelectItem value="urgent">{t("Urgent", "अति आवश्यक")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Scope", "दायरा")}</Label>
                  <Select value={newCircular.scope} onValueChange={(v) => setNewCircular(p => ({ ...p, scope: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org">{t("Entire Org", "पूरा संगठन")}</SelectItem>
                      <SelectItem value="unit">{t("Unit", "इकाई")}</SelectItem>
                      <SelectItem value="department">{t("Department", "विभाग")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleCreate} disabled={!newCircular.title.trim() || !newCircular.body.trim() || createMutation.isPending}>
                  {t("Publish", "प्रकाशित करें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  function renderList() {
    if (isError) {
      return (
        <div className="text-center py-8 text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t("Failed to load circulars", "परिपत्र लोड करने में विफल")}</p>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }
    if (typedCirculars.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {activeTab === "unread"
              ? t("No unread circulars.", "कोई अपठित परिपत्र नहीं।")
              : t("No circulars yet.", "अभी तक कोई परिपत्र नहीं।")}
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <AnimatePresence>
          {typedCirculars.map((circular) => {
            const pc = PRIORITY_CONFIG[circular.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.normal;
            const expanded = expandedId === circular.id;
            const expired = isExpired(circular.expiresAt);

            return (
              <motion.div
                key={circular.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className={`border rounded-lg transition-colors ${expired ? "opacity-50" : ""} ${!circular.readAt && !expired ? "border-l-2 border-l-primary" : ""}`}
              >
                <div
                  onClick={() => setExpandedId(expanded ? null : circular.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(expanded ? null : circular.id); } }}
                  className="w-full text-left p-3 flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] px-1.5 py-0 font-medium ${pc.color}`}>
                        {t(pc.label, pc.labelHi)}
                      </Badge>
                      {expired && (
                        <Badge variant="outline" className="text-[10px]">
                          {t("Expired", "समाप्त")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {lang === "hi" && circular.titleHi ? circular.titleHi : circular.title}
                    </p>
                    {circular.authorName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Link href={`/directory?search=${encodeURIComponent(circular.authorName)}`} className="hover:text-primary hover:underline">
                          {circular.authorName}
                        </Link>
                        {circular.publishedAt && (
                          <> · {new Date(circular.publishedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!circular.readAt && !expired && permissions.canCreateTask && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcknowledge(circular.id); }}
                        className="p-1.5 hover:bg-muted rounded"
                        title={t("Mark as read", "पढ़ा हुआ चिह्नित करें")}
                      >
                        <CheckCheck className="h-4 w-4 text-primary" />
                      </button>
                    )}
                    {permissions.canCreateCircular && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(circular.id); }}
                        className="p-1.5 hover:bg-muted rounded text-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-3 pb-3 border-t pt-2"
                  >
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {lang === "hi" && circular.bodyHi ? circular.bodyHi : circular.body}
                    </p>
                    {circular.readAt && (
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <CheckCheck className="h-3 w-3" />
                        {t("Read on", "पढ़ा गया")} {new Date(circular.readAt).toLocaleString()}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }
}
