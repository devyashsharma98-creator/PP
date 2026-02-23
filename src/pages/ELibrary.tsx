import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Download, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const books = [
  { id: '1', title: 'Arthashastra - Kautilya', category: 'Rajneeti', description: 'Ancient treatise on statecraft, economic policy, and military strategy.', pages: 420 },
  { id: '2', title: 'Rasaratna Samucchaya', category: 'Rasashastra', description: 'Classical text on Indian alchemy and metallurgy - preparation of metals and minerals.', pages: 310 },
  { id: '3', title: 'Vastu Shastra Vimarsh', category: 'Vastu', description: 'Comprehensive analysis of ancient Indian architecture and spatial sciences.', pages: 280 },
  { id: '4', title: 'Surya Siddhanta', category: 'Jyotish', description: 'Astronomical treatise covering planetary positions, eclipses, and cosmography.', pages: 350 },
  { id: '5', title: 'Charaka Samhita', category: 'Ayurveda', description: 'Foundational text of Ayurvedic medicine covering diagnosis and treatment.', pages: 620 },
  { id: '6', title: 'Shulba Sutras', category: 'Ganit', description: 'Ancient mathematical texts containing geometry for altar construction.', pages: 190 },
  { id: '7', title: 'Brihat Samhita - Varahamihira', category: 'Vigyan', description: 'Encyclopedic work on astronomy, weather, architecture, and gemology.', pages: 480 },
  { id: '8', title: 'Yoga Sutras - Patanjali', category: 'Darshan', description: 'Classical text on the theory and practice of yoga philosophy.', pages: 150 },
  { id: '9', title: 'Natyashastra - Bharata', category: 'Kala', description: 'Ancient treatise on performing arts including drama, dance, and music.', pages: 540 },
];

const categoryColors: Record<string, string> = {
  Rajneeti: 'bg-primary/10 text-primary',
  Rasashastra: 'bg-[hsl(var(--warning)/.15)] text-warning',
  Vastu: 'bg-[hsl(var(--info)/.15)] text-info',
  Jyotish: 'bg-[hsl(var(--success)/.15)] text-success',
  Ayurveda: 'bg-[hsl(var(--success)/.15)] text-success',
  Ganit: 'bg-primary/10 text-primary',
  Vigyan: 'bg-[hsl(var(--info)/.15)] text-info',
  Darshan: 'bg-accent text-accent-foreground',
  Kala: 'bg-[hsl(var(--warning)/.15)] text-warning',
};

export default function ELibrary() {
  const [search, setSearch] = useState('');

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">E-Library</h1>
          <p className="text-muted-foreground text-sm">Indian Knowledge System (IKS) - भारतीय ज्ञान परम्परा</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search books, topics..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-card hover-lift h-full flex flex-col">
              {/* Book visual header */}
              <div className="h-28 navy-gradient rounded-t-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-3 text-6xl font-devanagari text-primary-foreground/20">ॐ</div>
                </div>
                <BookOpen className="w-10 h-10 text-primary-foreground/80" />
              </div>
              <CardContent className="pt-4 flex-1 flex flex-col space-y-2">
                <Badge className={`${categoryColors[book.category] || ''} w-fit text-[10px]`}>{book.category}</Badge>
                <h3 className="font-semibold text-sm leading-snug">{book.title}</h3>
                <p className="text-xs text-muted-foreground flex-1">{book.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {book.pages} pages
                  </span>
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary">
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No books found matching "{search}"</p>
        </div>
      )}

      {/* Vimarsh - 15 Discussion Topics */}
      <div className="pt-4">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" /> विमर्श - Discussion Topics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'भारतीय शिक्षा पद्धति', 'स्वदेशी अर्थव्यवस्था', 'वैदिक गणित',
            'आयुर्वेद एवं स्वास्थ्य', 'पर्यावरण संरक्षण', 'ग्राम स्वराज',
            'भारतीय विज्ञान परंपरा', 'सामाजिक समरसता', 'राष्ट्रीय सुरक्षा',
            'सांस्कृतिक विरासत', 'युवा नेतृत्व विकास', 'महिला सशक्तिकरण',
            'डिजिटल भारत', 'कृषि एवं जल संरक्षण', 'भारतीय भाषाओं का संवर्धन',
          ].map((topic, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="glass-card hover-lift cursor-pointer">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium font-devanagari">{topic}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
