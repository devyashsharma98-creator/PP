"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, Mail, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const members = [
  { id: '1', name: 'Ramesh Sharma', role: 'Unit Head', aayam: 'Prachar', contact: '98261XXXXX', email: 'ramesh@example.com', unit: 'Bhopal Shahar' },
  { id: '2', name: 'Priya Patel', role: 'Karyakarta', aayam: 'Mahila', contact: '98262XXXXX', email: 'priya@example.com', unit: 'Vidisha' },
  { id: '3', name: 'Anil Verma', role: 'Unit Head', aayam: 'Vimarsh', contact: '98263XXXXX', email: 'anil@example.com', unit: 'Sehore' },
  { id: '4', name: 'Kavita Singh', role: 'Karyakarta', aayam: 'Shodh', contact: '98264XXXXX', email: 'kavita@example.com', unit: 'Raisen' },
  { id: '5', name: 'Suresh Yadav', role: 'Aayam Pramukh', aayam: 'Yuva', contact: '98265XXXXX', email: 'suresh@example.com', unit: 'Hoshangabad' },
  { id: '6', name: 'Neha Gupta', role: 'Karyakarta', aayam: 'Prachar', contact: '98266XXXXX', email: 'neha@example.com', unit: 'Bhopal Shahar' },
  { id: '7', name: 'Vikram Tiwari', role: 'Unit Head', aayam: 'Vimarsh', contact: '98267XXXXX', email: 'vikram@example.com', unit: 'Vidisha' },
  { id: '8', name: 'Deepa Mishra', role: 'Karyakarta', aayam: 'Mahila', contact: '98268XXXXX', email: 'deepa@example.com', unit: 'Sehore' },
  { id: '9', name: 'Rajendra Jain', role: 'Vibhag Pramukh', aayam: 'Shodh', contact: '98269XXXXX', email: 'rajendra@example.com', unit: 'Bhopal' },
  { id: '10', name: 'Sunita Chouhan', role: 'Aayam Pramukh', aayam: 'Mahila', contact: '98270XXXXX', email: 'sunita@example.com', unit: 'Raisen' },
];

const aayamColors: Record<string, string> = {
  Yuva: 'bg-[hsl(var(--info)/.15)] text-info',
  Mahila: 'bg-accent text-accent-foreground',
  Shodh: 'bg-[hsl(var(--success)/.15)] text-success',
  Prachar: 'bg-primary/10 text-primary',
  Vimarsh: 'bg-[hsl(var(--warning)/.15)] text-warning',
};

export default function Directory() {
  const [search, setSearch] = useState('');
  const [selectedAayam, setSelectedAayam] = useState<string | null>(null);

  const filtered = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.aayam.toLowerCase().includes(search.toLowerCase()) ||
      m.unit.toLowerCase().includes(search.toLowerCase());
    
    const matchesAayam = selectedAayam ? m.aayam === selectedAayam : true;
    
    return matchesSearch && matchesAayam;
  });

  const aayams = ['Yuva', 'Mahila', 'Shodh', 'Prachar', 'Vimarsh'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sampark Directory</h1>
          <p className="text-muted-foreground text-sm font-devanagari">सम्पर्क सूची - Member contacts across all units</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-10" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={selectedAayam === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedAayam(null)}
        >
          All Ayam
        </Badge>
        {aayams.map(aayam => (
          <Badge 
            key={aayam}
            variant={selectedAayam === aayam ? 'default' : 'outline'}
            className={cn(
              "cursor-pointer",
              selectedAayam !== aayam && (aayamColors[aayam] || '')
            )}
            onClick={() => setSelectedAayam(aayam)}
          >
            {aayam}
          </Badge>
        ))}
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Aayam</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member, i) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.role}</TableCell>
                  <TableCell>
                    <Badge className={`${aayamColors[member.aayam] || ''} text-[10px]`}>{member.aayam}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{member.contact}</span>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No members found.</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
