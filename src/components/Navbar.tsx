import { useAppContext, roleLabels, type Role } from '@/context/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { role, setRole, events } = useAppContext();

  const pendingCount = role === 'aayam_pramukh'
    ? events.filter(e => e.status === 'Pending Aayam Review').length
    : role === 'vibhag_pramukh'
    ? events.filter(e => e.status === 'Pending Final Approval').length
    : 0;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">प्रज्ञा प्रवाह</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        {pendingCount > 0 && (
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {pendingCount}
            </Badge>
          </div>
        )}

        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
          <Shield className="w-4 h-4 text-primary" />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 text-sm font-medium w-[160px] focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
