"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, BookOpen, Download, FileText, Filter, Star, Eye,
  ChevronRight, Library, BookMarked, Sparkles, Compass, TrendingUp
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';

// ── ELibrary Context Types ────────────────────────────────────────────────

type ELibraryContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function ELibraryMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: ELibraryContextItem[];
}) {
  return (
    <div className="dashboard-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Knowledge Preservation', 'ज्ञान परंपरा संरक्षण')}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('Institutional E-Library', 'संस्थागत ई-पुस्तकालय')}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'A curated repository of foundational Bharatiya Knowledge Systems (IKS) texts, preserved for research and intellectual awakening.',
                'भारतीय ज्ञान परंपरा (IKS) के आधारभूत ग्रंथों का एक संकलित भंडार, जो शोध और बौद्धिक जागरण हेतु सुरक्षित है।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-context-grid sm:grid-cols-2 lg:grid-cols-3">
        {contexts.map((context) => (
          <div key={context.labelEn} className="dashboard-context-card">
            <p className="shell-copy">{t(context.labelEn, context.labelHi)}</p>
            <p className="dashboard-context-value">{t(context.valueEn, context.valueHi ?? context.valueEn)}</p>
            <p className="dashboard-context-detail">{t(context.detailEn, context.detailHi)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Book Data ────────────────────────────────────────────────────────────────

interface Book {
  id: string;
  title: string;
  titleHi: string;
  author: string;
  category: string;
  pages: number;
  year: string;
  rating: number;
  description: string;
  descriptionHi: string;
  color: string; // accent color for cover placeholder
}

const books: Book[] = [
  {
    id: '1', title: 'Arthashastra', titleHi: 'अर्थशास्त्र', author: 'Kautilya',
    category: 'Rajneeti', pages: 320, year: '~300 BCE', rating: 5,
    description: 'Ancient treatise on statecraft, economic policy and military strategy.',
    descriptionHi: 'राजनीति, अर्थनीति और सैन्य रणनीति पर प्राचीन ग्रंथ।',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: '2', title: 'Rasaratna Samucchaya', titleHi: 'रसरत्न समुच्चय', author: 'Vagbhata',
    category: 'Rasashastra', pages: 280, year: '13th Century', rating: 4,
    description: 'Classical text on Indian alchemy and medicinal chemistry.',
    descriptionHi: 'भारतीय रसायन शास्त्र और औषधीय रसायन विज्ञान पर शास्त्रीय ग्रंथ।',
    color: 'from-yellow-600 to-amber-700',
  },
  {
    id: '3', title: 'Vastu Shastra Vimarsh', titleHi: 'वास्तु शास्त्र विमर्श', author: 'Various',
    category: 'Vastu', pages: 190, year: 'Modern', rating: 4,
    description: 'Comprehensive overview of Vastu science and its modern applications.',
    descriptionHi: 'वास्तु विज्ञान और उसके आधुनिक अनुप्रयोगों का व्यापक अवलोकन।',
    color: 'from-sky-600 to-blue-700',
  },
  {
    id: '4', title: 'Brihat Samhita', titleHi: 'बृहत्संहिता', author: 'Varahamihira',
    category: 'Jyotish', pages: 410, year: '6th Century', rating: 5,
    description: 'Encyclopedic work covering astronomy, astrology, weather, and architecture.',
    descriptionHi: 'खगोल विज्ञान, ज्योतिष, मौसम और वास्तुकला पर विश्वकोशीय रचना।',
    color: 'from-violet-600 to-purple-700',
  },
  {
    id: '5', title: 'Charaka Samhita', titleHi: 'चरक संहिता', author: 'Charaka',
    category: 'Ayurveda', pages: 520, year: '~100 BCE', rating: 5,
    description: 'Foundational text of Ayurveda covering diagnosis, treatment and medicine.',
    descriptionHi: 'आयुर्वेद का मूलभूत ग्रंथ — निदान, चिकित्सा और औषधि।',
    color: 'from-emerald-600 to-green-700',
  },
  {
    id: '6', title: 'Shulba Sutras', titleHi: 'शुल्ब सूत्र', author: 'Various Rishis',
    category: 'Ganit', pages: 140, year: '~800 BCE', rating: 4,
    description: 'Ancient mathematical texts on geometry for altar construction.',
    descriptionHi: 'वेदी निर्माण हेतु ज्यामिति पर प्राचीन गणितीय ग्रंथ।',
    color: 'from-cyan-600 to-teal-700',
  },
  {
    id: '7', title: 'Surya Siddhanta', titleHi: 'सूर्य सिद्धांत', author: 'Mayasura',
    category: 'Vigyan', pages: 240, year: '~400 CE', rating: 5,
    description: 'Ancient astronomical treatise — planetary positions, eclipses, time calculation.',
    descriptionHi: 'प्राचीन खगोलीय ग्रंथ — ग्रह स्थिति, ग्रहण और काल गणना।',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: '8', title: 'Yoga Sutras', titleHi: 'योग सूत्र', author: 'Patanjali',
    category: 'Darshan', pages: 195, year: '~200 BCE', rating: 5,
    description: 'Foundational text on yoga philosophy — eight limbs of yoga.',
    descriptionHi: 'योग दर्शन का मूल ग्रंथ — अष्टांग योग।',
    color: 'from-indigo-500 to-blue-700',
  },
  {
    id: '9', title: 'Natyashastra', titleHi: 'नाट्यशास्त्र', author: 'Bharata Muni',
    category: 'Kala', pages: 360, year: '~200 BCE', rating: 4,
    description: 'Comprehensive treatise on performing arts — drama, dance, music.',
    descriptionHi: 'प्रदर्शन कला पर व्यापक ग्रंथ — नाटक, नृत्य, संगीत।',
    color: 'from-rose-500 to-pink-700',
  },
];

const categories = ['All', 'Rajneeti', 'Rasashastra', 'Vastu', 'Jyotish', 'Ayurveda', 'Ganit', 'Vigyan', 'Darshan', 'Kala'];

const categoryLabelsHi: Record<string, string> = {
  All: 'सभी', Rajneeti: 'राजनीति', Rasashastra: 'रसशास्त्र', Vastu: 'वास्तु',
  Jyotish: 'ज्योतिष', Ayurveda: 'आयुर्वेद', Ganit: 'गणित', Vigyan: 'विज्ञान',
  Darshan: 'दर्शन', Kala: 'कला',
};

// ── Book Cover Placeholder ───────────────────────────────────────────────────

function BookCover({ book, isHi }: { book: Book; isHi: boolean }) {
  return (
    <div className={`w-full aspect-[3/4] rounded-xl bg-gradient-to-br ${book.color} relative overflow-hidden group-hover:shadow-lg transition-shadow`}>
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-3 left-3 right-3 bottom-3 border border-white/40 rounded-lg" />
        <div className="absolute top-5 left-5 right-5 bottom-5 border border-white/20 rounded-md" />
      </div>
      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div>
          <BookMarked className="w-5 h-5 text-white/60 mb-2" />
          <h3 className="font-devanagari text-white font-bold text-sm leading-snug drop-shadow-md">
            {isHi ? book.titleHi : book.title}
          </h3>
        </div>
        <div>
          <div className="h-px bg-white/30 mb-2" />
          <p className="text-white/70 text-[10px] font-medium">{book.author}</p>
          <p className="text-white/40 text-[9px]">{book.year}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ELibrary() {
  const { lang } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const filtered = books.filter(b => {
    const matchCategory = activeCategory === 'All' || b.category === activeCategory;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase())
      || b.titleHi.includes(search)
      || b.author.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const contexts: ELibraryContextItem[] = [
    {
      labelEn: "Collection Depth",
      labelHi: "संग्रह गहराई",
      valueEn: `${books.length} Standard Texts`,
      valueHi: `${books.length} मानक ग्रंथ`,
      detailEn: "Digitized foundational works of Bharatiya knowledge.",
      detailHi: "भारतीय ज्ञान के डिजिटल मूलभूत कार्य।",
    },
    {
      labelEn: "Active Disciplines",
      labelHi: "सक्रिय विषय",
      valueEn: `${categories.length - 1} Subject Areas`,
      valueHi: `${categories.length - 1} विषय क्षेत्र`,
      detailEn: "From Arthashastra to Ayurveda and beyond.",
      detailHi: "अर्थशास्त्र से आयुर्वेद और उससे आगे तक।",
    },
    {
      labelEn: "Institutional Archiving",
      labelHi: "संस्थागत संग्रहण",
      valueEn: "Rare Text Preservation",
      valueHi: "दुर्लभ ग्रंथ संरक्षण",
      detailEn: "Ensuring scholarly access to civilisational wisdom.",
      detailHi: "सभ्यतागत ज्ञान तक विद्वत्तापूर्ण पहुंच सुनिश्चित करना।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <ELibraryMasthead t={t} contexts={contexts} />

      {/* Search + Category Filters */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search the archives...', 'संग्रह में खोजें...')}
              className="pl-10 h-11 rounded-xl bg-background/50 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 bg-muted/30 border-border/60">
              <Filter className="w-3.5 h-3.5 opacity-60" /> {t('Filter by Subject', 'विषय अनुसार')}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all font-devanagari",
                activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-background/50 border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {isHi ? categoryLabelsHi[cat] : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Book Grid */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="section-seal">{t('The Archive', 'ग्रंथ संग्रहालय')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((book, i) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className="group cursor-pointer"
                onClick={() => setSelectedBook(selectedBook?.id === book.id ? null : book)}
              >
                <div className={cn(
                  "relative transition-all duration-300 transform group-hover:-translate-y-1",
                  selectedBook?.id === book.id && "ring-2 ring-primary ring-offset-4 ring-offset-background rounded-xl"
                )}>
                  <BookCover book={book} isHi={isHi} />
                </div>
                <div className="mt-3 space-y-1 px-1">
                  <h3 className="text-sm font-bold truncate font-devanagari text-foreground/90">
                    {isHi ? book.titleHi : book.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate">{book.author}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={cn(
                        "w-2.5 h-2.5",
                        j < book.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
                      )} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <BookMarked className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">{t('No texts found in this discipline.', 'इस विषय में कोई ग्रंथ नहीं मिला।')}</p>
        </div>
      )}

      {/* Selected Book Detail Panel */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card className="institution-panel border-primary/20 shadow-xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 via-primary to-orange-600" />
              <CardContent className="py-8 px-8 flex flex-col sm:flex-row gap-8">
                <div className="w-40 shrink-0 shadow-2xl shadow-black/20 transform -rotate-1">
                  <BookCover book={selectedBook} isHi={isHi} />
                </div>
                <div className="flex-1 space-y-5">
                  <div className="space-y-1">
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold uppercase tracking-widest mb-2">
                      {isHi ? categoryLabelsHi[selectedBook.category] : selectedBook.category}
                    </Badge>
                    <h2 className="text-3xl font-bold font-devanagari tracking-tight">
                      {isHi ? selectedBook.titleHi : selectedBook.title}
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium">{selectedBook.author} · <span className="text-primary/60">{selectedBook.year}</span></p>
                  </div>
                  
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/40">
                    <p className={`text-base text-foreground/80 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                      {isHi ? selectedBook.descriptionHi : selectedBook.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary/60" />
                      <span className="text-sm font-bold">{selectedBook.pages} <span className="text-muted-foreground font-normal">{t('pages', 'पृष्ठ')}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={cn(
                          "w-4 h-4",
                          j < selectedBook.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
                        )} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button size="lg" className="gap-2 px-8 rounded-full shadow-lg shadow-primary/20">
                      <Eye className="w-4 h-4" /> {t('Read Online', 'ऑनलाइन पढ़ें')}
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2 px-8 rounded-full border-border/60 hover:bg-muted/50">
                      <Download className="w-4 h-4" /> {t('Download PDF', 'PDF डाउनलोड')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sutra-divider" />

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <Card className="institution-panel border-primary/15 bg-primary/5 hover:border-primary/30 transition-all shadow-sm">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="font-bold text-base font-devanagari text-foreground/90">
                {t('Contribute to the Civilisational Record', 'सभ्यतागत अभिलेख में योगदान दें')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari">
                {t('Upload digitized PDFs of rare Bharatiya texts to expand our community library.', 'हमारे सामुदायिक पुस्तकालय का विस्तार करने के लिए दुर्लभ ग्रंथों की डिजिटल PDF अपलोड करें।')}
              </p>
            </div>
            <Button variant="outline" className="shrink-0 h-11 px-8 rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-xs gap-2">
              <BookOpen className="w-4 h-4" /> {t('Upload Text', 'ग्रंथ अपलोड करें')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
