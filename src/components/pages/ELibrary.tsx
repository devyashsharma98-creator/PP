"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, BookOpen, Download, FileText, Filter, Star, Eye,
  ChevronRight, Library, BookMarked, Sparkles, Compass, TrendingUp,
  User, Upload
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { useToast } from '@/components/ToastProvider';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';

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
  readUrl?: string | null;
  downloadUrl?: string | null;
}

// Built-in curated set, used as a fallback before the API responds or when the
// library table is not yet provisioned. The live data comes from
// GET /api/public/library (table: library_texts).
const FALLBACK_BOOKS: Book[] = [
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

// ── Sub-components ──────────────────────────────────────────────────────────

interface LibraryContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function ELibraryMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: LibraryContextItem[];
}) {
  return (
    <Masthead
      compact
      seal="Knowledge Preservation"
      sealHi="ज्ञान परंपरा संरक्षण"
      title="Institutional E-Library"
      titleHi="संस्थागत ई-पुस्तकालय"
      contexts={contexts.map((ctx) => ({
        labelEn: ctx.labelEn,
        labelHi: ctx.labelHi,
        valueEn: ctx.valueEn,
        valueHi: ctx.valueHi ?? ctx.valueEn,
        detailEn: ctx.detailEn,
        detailHi: ctx.detailHi,
      }))}
    />
  );
}

function BookCover({ book, isHi, size = "md" }: { book: Book; isHi: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={cn(
      "w-full aspect-[3/4] rounded-xl bg-gradient-to-br relative overflow-hidden group-hover:shadow-2xl transition-all duration-500",
      book.color,
      size === "lg" ? "shadow-2xl" : "shadow-lg"
    )}>
      {/* Manuscript-like texture/overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] opacity-20" />
      
      {/* Decorative borders */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 right-2 bottom-2 border border-white rounded-lg" />
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/40 rounded-md" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between z-10">
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <BookMarked className="w-4 h-4 text-white/80" />
          </div>
          <h3 className={cn(
            "font-devanagari text-white font-bold leading-tight drop-shadow-lg",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-xl"
          )}>
            {isHi ? book.titleHi : book.title}
          </h3>
        </div>
        
        <div className="space-y-1.5">
          <div className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest truncate">{book.author}</p>
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-[9px] font-medium">{book.year}</p>
            <div className="flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-white/40 text-white/40" />
              <span className="text-[8px] text-white/60 font-bold">{book.rating}.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20 backdrop-blur-sm" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ELibrary() {
  const { lang, permissions } = useAppContext();
  const t = useT();
  const { addToast } = useToast();
  const isHi = lang === 'hi';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>(FALLBACK_BOOKS);
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '', titleHi: '', author: '', category: 'Darshan', pages: 0, year: '',
    description: '', descriptionHi: '', readUrl: '', downloadUrl: '',
  });

  const loadBooks = useCallback(() => {
    fetch('/api/public/library')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setBooks(json.data as Book[]);
        }
      })
      .catch(() => {
        /* keep fallback set */
      });
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleUpload = useCallback(async () => {
    if (!uploadForm.title.trim() || !uploadForm.titleHi.trim() || !uploadForm.author.trim() || uploading) return;
    setUploading(true);
    try {
      const res = await fetch('/api/v1/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadForm.title.trim(),
          titleHi: uploadForm.titleHi.trim(),
          author: uploadForm.author.trim(),
          category: uploadForm.category,
          pages: Number(uploadForm.pages) || 0,
          year: uploadForm.year.trim(),
          description: uploadForm.description.trim(),
          descriptionHi: uploadForm.descriptionHi.trim(),
          readUrl: uploadForm.readUrl.trim() || undefined,
          downloadUrl: uploadForm.downloadUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Upload failed');
      addToast(t('Text added to library!', 'ग्रंथ पुस्तकालय में जोड़ा गया!'), 'success');
      setShowUpload(false);
      setUploadForm({ title: '', titleHi: '', author: '', category: 'Darshan', pages: 0, year: '', description: '', descriptionHi: '', readUrl: '', downloadUrl: '' });
      loadBooks();
    } catch (err) {
      addToast(t('Failed to add text', 'ग्रंथ जोड़ने में विफल'), 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(false);
    }
  }, [uploadForm, uploading, addToast, t, loadBooks]);

  const filtered = books.filter(b => {
    const matchCategory = activeCategory === 'All' || b.category === activeCategory;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase())
      || b.titleHi.includes(search)
      || b.author.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });
  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleBooks = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
    setSelectedBook(null);
  }, [search, activeCategory]);

  const contexts: LibraryContextItem[] = [
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-10">
      <ELibraryMasthead t={t} contexts={contexts} />

      {/* Search + Category Filters */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border/40 pb-6">
          <div className="relative w-full sm:w-[28rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search the archives...', 'संग्रह में खोजें...')}
              className="pl-11 h-12 rounded-2xl bg-background/50 border-border/70 focus:border-primary/40 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] py-1.5 px-4 bg-muted/40 border-border/60">
              <Filter className="w-3.5 h-3.5 mr-2 opacity-60" /> {t('Filter by Subject', 'विषय अनुसार')}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2.5 min-h-[44px] rounded-xl border transition-all font-devanagari shrink-0",
                activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'bg-background/60 border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {isHi ? categoryLabelsHi[cat] : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Book Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="section-seal">{t('The Archive', 'ग्रंथ संग्रहालय')}</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t(`Showing ${filtered.length} results`, `${filtered.length} परिणाम मिले`)}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {visibleBooks.map((book, i) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
                className="group cursor-pointer"
                onClick={() => setSelectedBook(selectedBook?.id === book.id ? null : book)}
              >
                <div className={cn(
                  "relative transition-all duration-500",
                  selectedBook?.id === book.id ? "ring-2 ring-primary ring-offset-8 ring-offset-background rounded-xl scale-105 shadow-2xl" : ""
                )}>
                  <BookCover book={book} isHi={isHi} />
                  
                  {/* Hover overlay badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBook(book);
                    }}
                    className="absolute inset-0 flex h-full min-h-[44px] w-full items-center justify-center rounded-xl bg-black/40 p-3 text-center opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 focus:opacity-100"
                    aria-label={t("View Details for book", "ग्रंथ का विवरण देखें")}
                  >
                    <span className="h-10 min-h-[44px] rounded-full bg-secondary px-4 text-center text-sm font-bold uppercase tracking-widest text-secondary-foreground shadow-lg">
                      {t('View Details', 'विवरण देखें')}
                    </span>
                  </button>
                </div>
                
                <div className="mt-4 space-y-1.5 px-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold truncate font-devanagari text-foreground/90 group-hover:text-primary transition-colors">
                    {isHi ? book.titleHi : book.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">{book.author}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={cn(
                          "w-2.5 h-2.5",
                          j < book.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20"
                        )} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={currentPage === 1}
              onClick={() => {
                setPage((value) => Math.max(1, value - 1));
                setSelectedBook(null);
              }}
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              {t('Previous', 'पिछला')}
            </Button>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {t(`Shelf ${currentPage} of ${pageCount}`, `शेल्फ ${currentPage}/${pageCount}`)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={currentPage === pageCount}
              onClick={() => {
                setPage((value) => Math.min(pageCount, value + 1));
                setSelectedBook(null);
              }}
            >
              {t('Next', 'अगला')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </section>

      {filtered.length === 0 && (
        <div className="text-center py-16 md:py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <BookMarked className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">{t('No texts found in this discipline.', 'इस विषय में कोई ग्रंथ नहीं मिला।')}</p>
          <Button variant="link" onClick={() => { setActiveCategory('All'); setSearch(''); }} className="mt-2 min-h-[44px] text-primary font-bold uppercase tracking-widest text-[10px]">
            {t('Clear all filters', 'फिल्टर हटाएँ')}
          </Button>
        </div>
      )}

      {/* Selected Book Detail Panel */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="pt-4"
          >
            <Card className="institution-panel border-primary/25 shadow-[0_32px_64px_-16px_hsl(var(--navy)/0.35)] overflow-hidden bg-background/60">
              <div className="h-2 bg-gradient-to-r from-amber-600 via-primary to-orange-700" />
              <CardContent className="py-10 px-8 md:px-12 flex flex-col md:flex-row gap-10 md:gap-16">
                <div className="w-56 shrink-0 mx-auto md:mx-0">
                  <div className="relative transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                    <BookCover book={selectedBook} isHi={isHi} size="lg" />
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] -z-10 blur-2xl" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-8">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                        {isHi ? categoryLabelsHi[selectedBook.category] : selectedBook.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.16em] bg-muted/30 border-border/60 px-3 py-1">
                        {t('Scholarly Record', 'विद्वत्तापूर्ण अभिलेख')}
                      </Badge>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold font-devanagari tracking-tight text-foreground/90">
                      {isHi ? selectedBook.titleHi : selectedBook.title}
                    </h2>
                    <div className="flex items-center gap-4 text-lg text-muted-foreground font-medium flex-wrap">
                      <span className="flex items-center gap-2"><User className="w-5 h-5 opacity-60" />{selectedBook.author}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="text-primary/70 font-bold tracking-tight">{selectedBook.year}</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                    <p className={`text-base md:text-lg text-foreground/80 leading-relaxed pl-4 ${isHi ? 'font-devanagari' : ''}`}>
                      {isHi ? selectedBook.descriptionHi : selectedBook.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-y border-border/50">
                    <div className="space-y-1">
                      <p className="shell-copy text-[10px]">{t('Pagination', 'पृष्ठ संख्या')}</p>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/60" />
                        <span className="text-base font-bold">{selectedBook.pages} <span className="text-muted-foreground font-normal text-xs">{t('pages', 'पृष्ठ')}</span></span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="shell-copy text-[10px]">{t('Scholarly Rating', 'विद्वत्तापूर्ण रेटिंग')}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={cn(
                            "w-4 h-4",
                            j < selectedBook.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
                          )} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="shell-copy text-[10px]">{t('Digital Integrity', 'डिजिटल अखंडता')}</p>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest mt-1">
                        Verified Archive
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <TooltipProvider>
                      {selectedBook.readUrl ? (
                        <Button asChild size="lg" className="w-full sm:w-auto gap-3 h-12 px-10 rounded-2xl shadow-xl shadow-primary/20 font-bold uppercase tracking-[0.16em] text-[11px]">
                          <a href={selectedBook.readUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4" /> {t('Read Online', 'ऑनलाइन पढ़ें')}
                          </a>
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="lg" disabled className="w-full sm:w-auto gap-3 h-12 px-10 rounded-2xl shadow-xl shadow-primary/20 font-bold uppercase tracking-[0.16em] text-[11px]">
                              <Eye className="w-4 h-4" /> {t('Read Online', 'ऑनलाइन पढ़ें')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-navy text-white border-navy-light">{t('No link provided', 'लिंक उपलब्ध नहीं')}</TooltipContent>
                        </Tooltip>
                      )}
                      {selectedBook.downloadUrl ? (
                        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto gap-3 h-12 px-10 rounded-2xl border-border/70 hover:bg-muted/50 font-bold uppercase tracking-[0.16em] text-[11px]">
                          <a href={selectedBook.downloadUrl} target="_blank" rel="noopener noreferrer" download>
                            <Download className="w-4 h-4" /> {t('Download PDF', 'PDF डाउनलोड')}
                          </a>
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="lg" variant="outline" disabled className="w-full sm:w-auto gap-3 h-12 px-10 rounded-2xl border-border/70 hover:bg-muted/50 font-bold uppercase tracking-[0.16em] text-[11px]">
                              <Download className="w-4 h-4" /> {t('Download PDF', 'PDF डाउनलोड')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-navy text-white border-navy-light">{t('No link provided', 'लिंक उपलब्ध नहीं')}</TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                    <Button variant="ghost" onClick={() => setSelectedBook(null)} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest px-6 h-12">
                      {t('Close Archive', 'अभिलेख बंद करें')}
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
        <Card className="institution-panel border-primary/15 bg-primary/5 hover:border-primary/30 transition-all shadow-md group">
          <CardContent className="py-4 px-4 flex flex-col md:flex-row items-center gap-4 md:gap-8 md:py-8 md:px-8">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <Library className="w-5 h-5 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <p className="font-bold text-base md:text-lg font-devanagari text-foreground/90">
                {t('Contribute to the Civilisational Record', 'सभ्यतागत अभिलेख में योगदान दें')}
              </p>
              <p className="text-xs text-muted-foreground font-devanagari leading-relaxed max-w-2xl md:text-sm">
                {t('Upload digitized PDFs of rare Bharatiya texts to expand our community library. Your contribution helps preserve our collective intellectual legacy.', 'हमारे सामुदायिक पुस्तकालय का विस्तार करने के लिए दुर्लभ ग्रंथों की डिजिटल PDF अपलोड करें। आपका योगदान हमारी सामूहिक बौद्धिक विरासत को संरक्षित करने में मदद करता है।')}
              </p>
            </div>
            {permissions?.canManageUsers ? (
              <Button
                variant="outline"
                className="shrink-0 h-9 px-5 md:h-12 md:px-10 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-bold uppercase tracking-[0.16em] text-[11px] gap-3 shadow-sm hover:shadow-lg transition-all"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="w-4 h-4" /> {t('Upload Text', 'ग्रंथ अपलोड करें')}
              </Button>
            ) : (
              <p className="shrink-0 text-xs text-muted-foreground max-w-[16rem] text-center md:text-right font-devanagari">
                {t('Curated by institutional editors. Contact your unit to contribute.', 'संस्थागत संपादकों द्वारा चयनित। योगदान हेतु अपनी इकाई से संपर्क करें।')}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-lg bg-popover max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Add Library Text', 'ग्रंथ जोड़ें')}</DialogTitle>
            <DialogDescription>
              {t('Add a curated text to the institutional E-Library.', 'संस्थागत ई-पुस्तकालय में एक चयनित ग्रंथ जोड़ें।')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('Title (English)', 'शीर्षक (अंग्रेज़ी)')}</Label>
              <Input value={uploadForm.title} onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>{t('Title (Hindi)', 'शीर्षक (हिंदी)')}</Label>
              <Input value={uploadForm.titleHi} onChange={(e) => setUploadForm((p) => ({ ...p, titleHi: e.target.value }))} dir="auto" className="font-devanagari" />
            </div>
            <div>
              <Label>{t('Author', 'लेखक')}</Label>
              <Input value={uploadForm.author} onChange={(e) => setUploadForm((p) => ({ ...p, author: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t('Category', 'श्रेणी')}</Label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>{t('Pages', 'पृष्ठ')}</Label>
                <Input type="number" value={uploadForm.pages} onChange={(e) => setUploadForm((p) => ({ ...p, pages: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>{t('Year', 'वर्ष')}</Label>
                <Input value={uploadForm.year} onChange={(e) => setUploadForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{t('Description (English)', 'विवरण (अंग्रेज़ी)')}</Label>
              <Textarea rows={2} value={uploadForm.description} onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>{t('Description (Hindi)', 'विवरण (हिंदी)')}</Label>
              <Textarea rows={2} value={uploadForm.descriptionHi} onChange={(e) => setUploadForm((p) => ({ ...p, descriptionHi: e.target.value }))} dir="auto" className="font-devanagari" />
            </div>
            <div>
              <Label>{t('Read URL', 'पठन लिंक')} <span className="text-muted-foreground text-xs">({t('optional', 'वैकल्पिक')})</span></Label>
              <Input type="url" value={uploadForm.readUrl} onChange={(e) => setUploadForm((p) => ({ ...p, readUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>{t('Download URL', 'डाउनलोड लिंक')} <span className="text-muted-foreground text-xs">({t('optional', 'वैकल्पिक')})</span></Label>
              <Input type="url" value={uploadForm.downloadUrl} onChange={(e) => setUploadForm((p) => ({ ...p, downloadUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowUpload(false)}>{t('Cancel', 'रद्द करें')}</Button>
              <Button onClick={handleUpload} disabled={!uploadForm.title.trim() || !uploadForm.titleHi.trim() || !uploadForm.author.trim() || uploading}>
                {uploading ? t('Adding...', 'जोड़ा जा रहा...') : t('Add Text', 'ग्रंथ जोड़ें')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
