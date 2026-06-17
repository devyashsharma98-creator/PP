"use client";

import { useState, useCallback, useEffect } from "react";
import { Building2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useOrg, useUpdateOrg } from "@/hooks/api/use-org";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function OrgSettingsPanel() {
  const { lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();
  const { data: org, isLoading } = useOrg();
  const updateMutation = useUpdateOrg();

  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");

  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setNameHi(org.nameHi ?? "");
    }
  }, [org]);

  const handleSave = useCallback(async () => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        name: name.trim() || undefined,
        nameHi: nameHi.trim() || undefined,
      });
      addToast(t("Org settings updated!", "संगठन सेटिंग अपडेट!"), "success");
    } catch {
      addToast(t("Failed to update org settings.", "संगठन सेटिंग अपडेट करने में विफल।"), "error");
    }
  }, [name, nameHi, updateMutation, t, addToast]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">{t("Org Settings", "संगठन सेटिंग")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : org ? (
          <div className="space-y-4 max-w-lg">
            <div className="text-xs text-muted-foreground">
              {t("Org Code", "संगठन कोड")}: <span className="font-mono">{org.orgCode}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("Name (EN)", "नाम (EN)")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("Name (HI)", "नाम (HI)")}</Label>
                <Input value={nameHi} onChange={(e) => setNameHi(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>{t("Save", "सहेजें")}</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("Failed to load org settings.", "संगठन सेटिंग लोड करने में विफल।")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
