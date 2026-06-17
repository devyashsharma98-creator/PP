"use client";

import { useState } from "react";
import { Users, ShieldAlert, Building2 } from "lucide-react";
import UserManagement from "@/components/pages/UserManagement";
import { AuditLogPanel } from "./AuditLogPanel";
import { OrgSettingsPanel } from "./OrgSettingsPanel";
import { useT } from "@/lib/useT";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/AppContext";

export default function SuperAdminDashboard() {
  const t = useT();
  const { permissions } = useAppContext();
  const [tab, setTab] = useState("users");

  const tabs = [
    { id: "users", label: t("Users", "उपयोगकर्ता"), icon: Users, show: permissions.canManageUsers },
    { id: "audit", label: t("Audit Logs", "ऑडिट लॉग"), icon: ShieldAlert, show: permissions.canViewAuditLogs },
    { id: "org", label: t("Org Settings", "संगठन सेटिंग"), icon: Building2, show: permissions.canManageOrg },
  ].filter((t) => t.show);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon className="h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="audit"><AuditLogPanel /></TabsContent>
        <TabsContent value="org"><OrgSettingsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
