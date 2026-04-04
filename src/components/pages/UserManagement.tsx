"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Search, Shield, Mail, Phone, MapPin, X, CheckCircle2 } from "lucide-react";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { Masthead } from "@/components/Masthead";

const API_BASE = '/api/v1';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || 'API request failed');
  return data.data as T;
}

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  is_active: boolean;
  roles: string[];
}

interface Role {
  id: string;
  code: string;
  name: string;
  name_hi: string | null;
}

export default function UserManagement() {
  const t = useT();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: '', display_name: '', phone: '' });
  const [selectedRole, setSelectedRole] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => fetchApi<User[]>(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => fetchApi<Role[]>('/users/roles'),
  });

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.display_name) return;
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      setCreateOpen(false);
      setNewUser({ email: '', display_name: '', phone: '' });
      addToast(t('User created!', 'उपयोगकर्ता बनाया गया!'), 'success');
    } catch (e) {
      addToast(t('Failed to create user', 'उपयोगकर्ता बनाने में विफल'), 'error');
    }
  };

  const handleAssignRole = async (userId: string) => {
    if (!selectedRole) return;
    try {
      await fetchApi(`/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ role_id: selectedRole }),
      });
      setAssignOpen(null);
      setSelectedRole("");
      addToast(t('Role assigned!', 'भूमिका सौंपी गई!'), 'success');
    } catch (e) {
      addToast(t('Failed to assign role', 'भूमिका सौंपने में विफल'), 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="User Management"
        sealHi="उपयोगकर्ता प्रबंधन"
        title="User Directory"
        titleHi="उपयोगकर्ता निर्देशिका"
        subtitle="Manage users, assign roles, and coordinate institutional access."
        subtitleHi="उपयोगकर्ता प्रबंधन, भूमिका असाइनमेंट और संस्थागत पहुंच समन्वय।"
        contexts={[
          { labelEn: "Total users", labelHi: "कुल उपयोगकर्ता", valueEn: `${users.length}`, valueHi: `${users.length}`, detailEn: "Active institutional members", detailHi: "सक्रिय संस्थागत सदस्य" },
          { labelEn: "Roles", labelHi: "भूमिकाएं", valueEn: `${roles.length}`, valueHi: `${roles.length}`, detailEn: "Available role types", detailHi: "उपलब्ध भूमिका प्रकार" },
          { labelEn: "Scope", labelHi: "क्षेत्र", valueEn: "Bhopal Vibhag", valueHi: "भोपाल विभाग", detailEn: "Regional user management", detailHi: "क्षेत्रीय उपयोगकर्ता प्रबंधन" },
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("Search users...", "उपयोगकर्ता खोजें...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> {t("Add User", "उपयोगकर्ता जोड़ें")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-popover">
            <DialogHeader>
              <DialogTitle className="font-devanagari">{t("Create User", "उपयोगकर्ता बनाएं")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t("Display Name", "प्रदर्शन नाम")}</Label>
                <Input value={newUser.display_name} onChange={e => setNewUser(p => ({ ...p, display_name: e.target.value }))} />
              </div>
              <div>
                <Label>{t("Email", "ईमेल")}</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>{t("Phone", "फ़ोन")}</Label>
                <Input value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreateUser}>{t("Create", "बनाएं")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="institution-panel hover-lift h-full">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg saffron-gradient flex items-center justify-center shrink-0">
                        <span className="text-sm text-white font-bold">{user.display_name?.charAt(0) || '?'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{user.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email || '—'}</p>
                      </div>
                    </div>
                    <Badge variant={user.is_active ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {user.is_active ? t("Active", "सक्रिय") : t("Inactive", "निष्क्रिय")}
                    </Badge>
                  </div>

                  {user.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {user.phone}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {user.roles.map(role => (
                      <Badge key={role} variant="outline" className="text-[10px] gap-1">
                        <Shield className="w-2.5 h-2.5" /> {role}
                      </Badge>
                    ))}
                  </div>

                  <Dialog open={assignOpen === user.id} onOpenChange={open => !open && setAssignOpen(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                        <Shield className="w-3 h-3" /> {t("Assign Role", "भूमिका सौंपें")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm bg-popover">
                      <DialogHeader>
                        <DialogTitle className="font-devanagari">{t("Assign Role", "भूमिका सौंपें")}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{user.display_name}</p>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger><SelectValue placeholder={t("Select role...", "भूमिका चुनें...")} /></SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} {r.name_hi ? `(${r.name_hi})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button className="w-full" onClick={() => handleAssignRole(user.id)} disabled={!selectedRole}>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> {t("Assign", "सौंपें")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {users.length === 0 && !isLoading && (
        <Card className="institution-panel">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground font-devanagari">
              {t("No users found.", "कोई उपयोगकर्ता नहीं मिला।")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? t("Try a different search.", "भिन्न खोज आज़माएं।") : t("Add your first user to get started.", "शुरू करने के लिए अपना पहला उपयोगकर्ता जोड़ें।")}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
