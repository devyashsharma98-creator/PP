"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';

const books = [
  { id: '1', title: 'Arthashastra - Kautilya', hindiTitle: 'अर्थशास्त्र - कौटिल्य', category: 'Rajneeti', hindiCategory: 'राजनीति', description: 'Ancient treatise on statecraft, economic policy, and military strategy.', hindiDesc: 'राजनीति, अर्थनीति और सैन्य रणनीति पर प्राचीन ग्रंथ।', tags: ['कौटिल्य', 'चाणक्य', 'भारत', 'नीति'], pages: 420 },
  { id: '2', title: 'Rasaratna Samucchaya', hindiTitle: 'रसरत्न समुच्चय', category: 'Rasashastra', hindiCategory: 'रसशास्त्र', description: 'Classical text on Indian alchemy and metallurgy - preparation of metals and minerals.', hindiDesc: 'भारतीय रसायन और धातुविज्ञान पर शास्त्रीय ग्रंथ।', tags: ['रसायन', 'धातु', 'भारतीय विज्ञान'], pages: 310 },
  { id: '3', title: 'Vastu Shastra Vimarsh', hindiTitle: 'वास्तु शास्त्र विमर्श', category: 'Vastu', hindiCategory: 'वास्तु', description: 'Comprehensive analysis of ancient Indian architecture and spatial sciences.', hindiDesc: 'प्राचीन भारतीय स्थापत्य और स्थान-विज्ञान का विश्लेषण।', tags: ['वास्तु', 'स्थापत्य', 'भारत'], pages: 280 },
  { id: '4', title: 'Surya Siddhanta', hindiTitle: 'सूर्य सिद्धांत', category: 'Jyotish', hindiCategory: 'ज्योतिष', description: 'Astronomical treatise covering planetary positions, eclipses, and cosmography.', hindiDesc: 'ग्रह स्थिति, ग्रहण और ब्रह्मांड विज्ञान पर खगोलीय ग्रंथ।', tags: ['सूर्य', 'ज्योतिष', 'खगोल', 'भारत'], pages: 350 },
  { id: '5', title: 'Charaka Samhita', hindiTitle: 'चरक संहिता', category: 'Ayurveda', hindiCategory: 'आयुर्वेद', description: 'Foundational text of Ayurvedic medicine covering diagnosis and treatment.', hindiDesc: 'आयुर्वेदिक चिकित्सा का मूलभूत ग्रंथ।', tags: ['आयुर्वेद', 'चरक', 'चिकित्सा', 'भारत'], pages: 620 },
  { id: '6', title: 'Shulba Sutras', hindiTitle: 'शुल्ब सूत्र', category: 'Ganit', hindiCategory: 'गणित', description: 'Ancient mathematical texts containing geometry for altar construction.', hindiDesc: 'यज्ञ-वेदी निर्माण हेतु ज्यामिति पर प्राचीन गणितीय ग्रंथ।', tags: ['गणित', 'ज्यामिति', 'भारत', 'वेद'], pages: 190 },
  { id: '7', title: 'Brihat Samhita - Varahamihira', hindiTitle: 'बृहत् संहिता - वराहमिहिर', category: 'Vigyan', hindiCategory: 'विज्ञान', description: 'Encyclopedic work on astronomy, weather, architecture, and gemology.', hindiDesc: 'खगोल, मौसम, स्थापत्य और रत्न-विज्ञान पर विश्वकोश।', tags: ['विज्ञान', 'खगोल', 'भारत', 'वराहमिहिर'], pages: 480 },
  { id: '8', title: 'Yoga Sutras - Patanjali', hindiTitle: 'योग सूत्र - पतंजलि', category: 'Darshan', hindiCategory: 'दर्शन', description: 'Classical text on the theory and practice of yoga philosophy.', hindiDesc: 'योग दर्शन के सिद्धांत और अभ्यास पर शास्त्रीय ग्रंथ।', tags: ['योग', 'पतंजलि', 'दर्शन', 'भारत'], pages: 150 },
  { id: '9', title: 'Natyashastra - Bharata', hindiTitle: 'नाट्यशास्त्र - भरत', category: 'Kala', hindiCategory: 'कला', description: 'Ancient treatise on performing arts including drama, dance, and music.', hindiDesc: 'नाट्य, नृत्य और संगीत सहित प्रदर्शन कलाओं पर प्राचीन ग्रंथ।', tags: ['नाट्य', 'कला', 'संगीत', 'भारत', 'भरत'], pages: 540 },
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
  const { lang } = useAppContext();
  const t = useT();
  const [search, setSearch] = useState('');

  const q = search.toLowerCase().trim();
  const filtered = books.filter(b =>
    !q ||
    b.title.toLowerCase().includes(q) ||
    b.hindiTitle.includes(search.trim()) ||
    b.category.toLowerCase().includes(q) ||
    b.hindiCategory.includes(search.trim()) ||
    b.description.toLowerCase().includes(q) ||
    b.hindiDesc.includes(search.trim()) ||
    b.tags.some(t => t.includes(search.trim()) || t.toLowerCase().includes(q))
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("E-Library", "ई-पुस्तकालय")}</h1>
          <p className="text-muted-foreground text-sm">{t("Indian Knowledge System (IKS)", "भारतीय ज्ञान परंपरा")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search books / पुस्तक खोजें..."
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
                <Badge className={`${categoryColors[book.category] || ''} w-fit text-[10px]`}>{book.category} · {book.hindiCategory}</Badge>
                <h3 className="font-semibold text-sm leading-snug">{lang === 'hi' ? book.hindiTitle : book.title}</h3>
                <p className="text-xs text-muted-foreground flex-1">{lang === 'hi' ? book.hindiDesc : book.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {book.pages} {t("pages", "पृष्ठ")}
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

    </motion.div>
  );
}
