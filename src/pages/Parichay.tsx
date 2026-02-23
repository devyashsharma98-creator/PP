import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCircle, MapPin, Phone, Mail, Camera, Edit } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function Parichay() {
  const { role } = useAppContext();

  const profile = {
    name: 'Ramesh Sharma',
    role: role === 'unit_head' ? 'Unit Head' : role === 'aayam_pramukh' ? 'Aayam Pramukh' : 'Vibhag Pramukh',
    aayam: 'Prachar',
    unit: 'Bhopal Shahar',
    phone: '98261XXXXX',
    email: 'ramesh@example.com',
    joinDate: '2020-01-15',
    bio: 'Dedicated karyakarta working towards cultural awakening and national development through grassroots activities.',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Parichay <span className="font-devanagari text-muted-foreground text-lg">परिचय</span></h1>

      <Card className="glass-card overflow-hidden">
        <div className="h-24 saffron-gradient relative">
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-primary-foreground/80 hover:text-primary-foreground">
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        <CardContent className="pt-0 -mt-10">
          <div className="flex items-end gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-card border-4 border-card flex items-center justify-center shadow-md">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <Badge className="status-pending-review text-xs">{profile.role}</Badge>
            </div>
            <Button variant="outline" size="sm" className="ml-auto mb-1">
              <Edit className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Aayam (आयाम)', value: profile.aayam },
              { label: 'Unit', value: profile.unit, icon: MapPin },
              { label: 'Phone', value: profile.phone, icon: Phone },
              { label: 'Email', value: profile.email, icon: Mail },
              { label: 'Member Since', value: new Date(profile.joinDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  {item.icon && <item.icon className="w-3.5 h-3.5 text-primary" />}
                  {item.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
