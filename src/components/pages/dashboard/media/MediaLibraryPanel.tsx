"use client";

import { useState, useCallback } from "react";
import { Image, FileText, Video, Music, Trash2, Upload, Search, HardDrive } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useMediaAssets, useMediaSummary, useCreateMediaAsset, useDeleteMediaAsset } from "@/hooks/api/use-media";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface MediaAsset {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  category: string;
  altText?: string | null;
  altTextHi?: string | null;
  tags?: string[];
  width?: number | null;
  height?: number | null;
  uploadedByName?: string | null;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  image: <Image className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, { en: string; hi: string }> = {
  image: { en: "Image", hi: "छवि" },
  document: { en: "Document", hi: "दस्तावेज़" },
  video: { en: "Video", hi: "वीडियो" },
  audio: { en: "Audio", hi: "ऑडियो" },
  other: { en: "Other", hi: "अन्य" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileExt(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "";
}

export function MediaLibraryPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const filters: Record<string, string> = {};
  if (categoryFilter) filters.category = categoryFilter;
  if (search.trim()) filters.search = search.trim();

  const { data: assets = [], isLoading, isError } = useMediaAssets(filters);
  const { data: summary } = useMediaSummary();
  const typedAssets = assets as MediaAsset[];

  const [showUpload, setShowUpload] = useState(false);
  const [newAsset, setNewAsset] = useState({
    filename: "", storageKey: "", mimeType: "image/jpeg", sizeBytes: 0,
    category: "image", altText: "", altTextHi: "", bucket: "media",
  });

  const createAssetMutation = useCreateMediaAsset();
  const deleteAssetMutation = useDeleteMediaAsset();

  const handleUpload = useCallback(async () => {
    if (!newAsset.filename || !newAsset.storageKey || createAssetMutation.isPending) return;
    try {
      await createAssetMutation.mutateAsync({
        filename: newAsset.filename,
        storageKey: newAsset.storageKey,
        mimeType: newAsset.mimeType,
        sizeBytes: newAsset.sizeBytes,
        category: newAsset.category,
        altText: newAsset.altText || undefined,
        altTextHi: newAsset.altTextHi || undefined,
        bucket: newAsset.bucket,
      });
      setShowUpload(false);
      setNewAsset({ filename: "", storageKey: "", mimeType: "image/jpeg", sizeBytes: 0, category: "image", altText: "", altTextHi: "", bucket: "media" });
      addToast(t("Media asset recorded!", "मीडिया संपत्ति दर्ज की गई!"), "success");
    } catch {
      addToast(t("Failed to record media asset", "मीडिया संपत्ति दर्ज करने में विफल"), "error");
    }
  }, [newAsset, createAssetMutation, t, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteAssetMutation.mutateAsync(id);
      addToast(t("Media asset deleted", "मीडिया संपत्ति हटा दी गई"), "success");
    } catch {
      addToast(t("Failed to delete", "हटाने में विफल"), "error");
    }
  }, [deleteAssetMutation, addToast, t]);

  return (
    <Card id="media-library" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Media Library", "मीडिया लाइब्रेरी")}
          </CardTitle>
          {summary && (
            <div className="flex items-center gap-2 ml-2">
              <Badge variant="outline" className="text-xs">
                {summary.totalAssets} {t("files", "फ़ाइलें")}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatBytes(summary.totalSizeBytes)}
              </span>
            </div>
          )}
        </div>
        {permissions.canUploadMedia && (
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload className="h-3.5 w-3.5 mr-1" />
            {t("Record Asset", "संपत्ति दर्ज करें")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search media...", "मीडिया खोजें...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder={t("All", "सभी")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t("All", "सभी")}</SelectItem>
              {Object.keys(CATEGORY_LABELS).map((cat) => (
                <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat][lang === "hi" ? "hi" : "en"]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("Failed to load media library", "मीडिया लाइब्रेरी लोड करने में विफल")}</p>
          </div>
        ) : typedAssets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("No media assets yet.", "अभी तक कोई मीडिया संपत्ति नहीं।")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {typedAssets.map((asset) => (
              <div key={asset.id} className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors">
                <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground/60">
                  {asset.mimeType.startsWith("image/") ? (
                    <img src={asset.storageKey} alt={asset.altText ?? asset.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      {CATEGORY_ICONS[asset.category] ?? <FileText className="h-8 w-8" />}
                      <span className="text-[10px] font-mono">{getFileExt(asset.filename)}</span>
                    </div>
                  )}
                </div>
                {permissions.canDeleteMedia && (
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-background/80 rounded-full p-1 text-destructive hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="p-2">
                  <p className="text-xs truncate font-medium">{asset.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {CATEGORY_LABELS[asset.category]?.[lang === "hi" ? "hi" : "en"] ?? asset.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(asset.sizeBytes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Record Media Asset", "मीडिया संपत्ति दर्ज करें")}</DialogTitle>
              <DialogDescription>
                {t("Register an uploaded file in the media library.", "अपलोड की गई फ़ाइल को मीडिया लाइब्रेरी में पंजीकृत करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Filename", "फ़ाइल नाम")}</Label>
                <Input value={newAsset.filename} onChange={(e) => setNewAsset(p => ({ ...p, filename: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Storage Key / URL", "भंडारण कुंजी / URL")}</Label>
                <Input value={newAsset.storageKey} onChange={(e) => setNewAsset(p => ({ ...p, storageKey: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("MIME Type", "MIME प्रकार")}</Label>
                  <Select value={newAsset.mimeType} onValueChange={(v) => setNewAsset(p => ({ ...p, mimeType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/jpeg">image/jpeg</SelectItem>
                      <SelectItem value="image/png">image/png</SelectItem>
                      <SelectItem value="image/webp">image/webp</SelectItem>
                      <SelectItem value="image/svg+xml">image/svg+xml</SelectItem>
                      <SelectItem value="application/pdf">application/pdf</SelectItem>
                      <SelectItem value="video/mp4">video/mp4</SelectItem>
                      <SelectItem value="audio/mpeg">audio/mpeg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Category", "श्रेणी")}</Label>
                  <Select value={newAsset.category} onValueChange={(v) => setNewAsset(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Size (bytes)", "आकार (बाइट्स)")}</Label>
                  <Input type="number" min={1} value={newAsset.sizeBytes} onChange={(e) => setNewAsset(p => ({ ...p, sizeBytes: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Alt Text (EN)", "वैकल्पिक पाठ (EN)")}</Label>
                  <Input value={newAsset.altText} onChange={(e) => setNewAsset(p => ({ ...p, altText: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUpload(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleUpload} disabled={createAssetMutation.isPending}>{t("Record", "दर्ज करें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
