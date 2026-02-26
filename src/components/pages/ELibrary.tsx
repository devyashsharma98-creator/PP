"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, BookOpen, Download, FileText, Filter, Star, Eye,
  ChevronRight, Library, BookMarked, Sparkles,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-devanagari">{t('E-Library', 'ई-पुस्तकालय')}</h1>
          </div>
          <p className="text-muted-foreground text-sm font-devanagari">
            {t('Curated collection of Bharatiya Knowledge Systems texts', 'भारतीय ज्ञान परंपरा की संकलित पुस्तकें')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <BookOpen className="w-3 h-3" /> {books.length} {t('Books', 'पुस्तकें')}
          </Badge>
        </div>
      </div>

      {/* Search + Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search by title, author...', 'शीर्षक, लेखक से खोजें...')}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[11px] px-3 py-1 rounded-full border transition-all font-devanagari ${activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
            >
              {isHi ? categoryLabelsHi[cat] : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((book, i) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.04 }}
              className="group cursor-pointer"
              onClick={() => setSelectedBook(selectedBook?.id === book.id ? null : book)}
            >
              <BookCover book={book} isHi={isHi} />
              <div className="mt-2 space-y-0.5 px-0.5">
                <h3 className="text-xs font-medium truncate font-devanagari">
                  {isHi ? book.titleHi : book.title}
                </h3>
                <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: book.rating }).map((_, j) => (
                    <Star key={j} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('No books found', 'कोई पुस्तक नहीं मिली')}</p>
        </div>
      )}

      {/* Selected Book Detail Panel */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="glass-card border-primary/20">
              <CardContent className="py-5 flex flex-col sm:flex-row gap-5">
                <div className="w-32 shrink-0">
                  <BookCover book={selectedBook} isHi={isHi} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-lg font-bold font-devanagari">
                      {isHi ? selectedBook.titleHi : selectedBook.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedBook.author} · {selectedBook.year}</p>
                  </div>
                  <p className={`text-sm text-foreground/70 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                    {isHi ? selectedBook.descriptionHi : selectedBook.description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <FileText className="w-3 h-3" /> {selectedBook.pages} {t('pages', 'पृष्ठ')}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                      {isHi ? categoryLabelsHi[selectedBook.category] : selectedBook.category}
                    </Badge>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: selectedBook.rating }).map((_, j) => (
                        <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Eye className="w-3.5 h-3.5" /> {t('Read Online', 'ऑनलाइन पढ़ें')}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" /> {t('Download PDF', 'PDF डाउनलोड')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card border-primary/15 bg-primary/5">
          <CardContent className="py-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-sm font-devanagari">
                {t('Want to contribute a book?', 'पुस्तक योगदान करना चाहते हैं?')}
              </p>
              <p className="text-xs text-muted-foreground font-devanagari">
                {t('Upload PDFs of rare Bharatiya texts for the community', 'समाज के लिए दुर्लभ भारतीय ग्रंथों की PDF अपलोड करें')}
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 text-xs gap-1">
              <BookOpen className="w-3.5 h-3.5" /> {t('Upload', 'अपलोड')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
