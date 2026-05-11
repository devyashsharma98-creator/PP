# Parichay Page Redesign — Design Spec

**Date:** 2026-05-07
**Scope:** Complete redesign of `/parichay` landing page
**Approach:** Curtains.js + GSAP ScrollTrigger + Lenis (Approach B)

---

## 1. Goal

Transform the static institutional landing page into an immersive, scroll-driven story experience that communicates Pragya Pravah's identity through:
- A **timeline journey** (5 chapters)
- **Masonry content feeds** within each era
- **WebGL shader distortions** (liquid, chromatic aberration, wave, glass refraction)
- **3D card perspective tilts** on hover

---

## 2. Design Direction

### 2.1 Mood
Cinematic, institutional, warm. Not corporate. Not playful. Like a modern museum exhibit meets a public institution's annual report.

### 2.2 Color Palette
Keep existing tokens:
- **Saffron** `#f97316` — primary accent, CTAs, active states
- **Navy** `#0f172a` — dark mode background, deep contrast
- **Parchment** `#f5f0e8` — light mode surface, editorial warmth

Add:
- **Glass panels**: `bg-background/60 backdrop-blur-xl border border-white/10`
- **Shader canvas**: sits behind all content at `z-index: 0`, content floats at `z-index: 10+`

### 2.3 Typography
- **English + numbers**: IBM Plex Sans (`font-sans`)
- **Hindi**: IBM Plex Sans Devanagari (`font-devanagari`)
- **Display headings**: `text-5xl md:text-7xl font-bold tracking-tighter`
- **Body**: `text-base md:text-lg leading-relaxed`
- **Eyebrow labels**: `text-[11px] font-bold uppercase tracking-[0.3em] text-primary`

---

## 3. Chapter Structure

### Chapter 1 — "Pragya Pravah" (Hero)
- **Behavior**: Pins for 1.5s, then unlocks
- **Content**: Large bilingual title, tagline, scroll hint
- **Effect**: Liquid displacement shader on logo/crest image (mouse-follow ripple)
- **Layout**: Centered, full-bleed background texture

### Chapter 2 — "Our Work" (Workstreams)
- **Behavior**: Pins for 1.5s
- **Content**: 4 workstream cards (Aalekh, Prachar, Vimarsh, Vritt)
- **Layout**: 2×2 masonry grid → 1 column on mobile
- **Effect**: Chromatic aberration + RGB split on hover; 3D perspective tilt
- **Animation**: Cards stagger in from corners

### Chapter 3 — "Public Output" (Articles & Media)
- **Behavior**: No pin — free-scroll masonry feed
- **Content**: Featured article (large), 2 smaller articles, event thumbnails
- **Layout**: Asymmetric masonry (1 large left + 2 right, then 3-column row)
- **Effect**: Wave distortion on images as they enter viewport
- **Fallback**: Skeleton cards if no published articles

### Chapter 4 — "Join the Flow" (Participation Paths)
- **Behavior**: Pins for 1s
- **Content**: 3 participation paths (Review, Connect, Member Access)
- **Layout**: Full-width stacked cards with alternating slide directions
- **Effect**: Glass refraction shader on background images; backdrop-filter text panels

### Chapter 5 — "Enter" (Login CTA)
- **Behavior**: Pins for 1s
- **Content**: Large centered "Sign In" button
- **Layout**: Minimal, lots of breathing room
- **Effect**: Canvas 2D particle field (saffron dots drifting slowly); no WebGL

---

## 4. Navigation & Progress

- **Vertical progress line**: Fixed left edge, 2px wide, filled by scroll progress
- **Chapter dots**: 5 dots aligned with progress line, active dot scales up + glows
- **No top nav during scroll**: The existing top app bar hides on scroll down, reappears on scroll up (already implemented — keep this behavior)

---

## 5. Shader Specifications (Curtains.js)

### 5.1 Hero Liquid Displacement
- **Trigger**: Mouse movement (desktop only)
- **Uniforms**: `uMouse`, `uTime`, `uStrength` (0.02)
- **Effect**: Gentle ripple distortion on the hero image, like touching water
- **Mobile**: Static wave animation driven by `uTime` instead of mouse

### 5.2 Workstream Chromatic Aberration
- **Trigger**: Hover on card
- **Uniforms**: `uHover` (0→1), `uRGBSplit` (0→0.015)
- **Effect**: RGB channels separate slightly at image edges
- **Fallback**: CSS `filter: drop-shadow()` on non-WebGL browsers

### 5.3 Article Wave Distortion
- **Trigger**: Scroll position (via ScrollTrigger scrub)
- **Uniforms**: `uScrollProgress`, `uWaveFrequency` (3.0), `uWaveAmplitude` (0.02)
- **Effect**: Images undulate like fabric in wind as they enter viewport
- **Performance**: Only active when image is in viewport

### 5.4 Join Glass Refraction
- **Trigger**: Static (always on)
- **Uniforms**: `uTime`, `uNoiseScale` (2.5)
- **Effect**: Background images have subtle noise-driven refraction, like looking through textured glass

---

## 6. Scroll Mechanics (GSAP + Lenis)

### 6.1 Lenis Setup
```
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
})
```
- Sync Lenis scroll to GSAP ScrollTrigger ticker
- Disable on mobile if frame rate drops below 30fps

### 6.2 ScrollTrigger Pinning
```
ScrollTrigger.create({
  trigger: chapterRef,
  start: 'top top',
  end: '+=150%',
  pin: true,
  scrub: 1,
})
```
- Each pinned chapter: `start: 'top top'`, `end: '+=150%'`
- Animation timeline scrubbed to scroll progress
- Mobile: `pin: false`, use `start: 'top 80%'` with fade-in only

### 6.3 Transition Effects
- **1→2**: Logo opacity → 0, workstream icons scale from 0 → 1 with stagger
- **2→3**: Grid collapses to center strip, then expands to masonry
- **3→4**: Images blur + scale down, participation cards slide in from sides
- **4→5**: Cards converge to center, particle field fades in

---

## 7. Masonry Layout

### 7.1 CSS Grid Masonry (Native)
Use CSS `grid-template-rows: masonry` with `@supports` fallback:
```css
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: masonry;
  gap: 1.5rem;
}
@supports not (grid-template-rows: masonry) {
  .masonry-grid {
    display: flex;
    flex-wrap: wrap;
  }
}
```

### 7.2 Card Sizes
- **Featured article**: `grid-column: span 2; grid-row: span 2`
- **Standard article**: `grid-column: span 1; grid-row: span 1`
- **Event thumbnail**: `grid-column: span 1; aspect-ratio: 16/9`

---

## 8. Performance Budget

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Total JS (new) | < 150KB gzipped |
| WebGL canvas | 1 active context max |
| Shader complexity | Max 30 fragment instructions |

### 8.1 Optimizations
- Lazy-load Curtains.js only when hero is near viewport (`IntersectionObserver`)
- Use `will-change: transform` on animated elements
- Reduce motion: Respect `prefers-reduced-motion` — disable pinning, shaders, and particles
- Mobile: Disable mouse-follow shaders, simplify particle count to 20

---

## 9. Accessibility

- **Reduced motion**: All scroll pinning and shader effects disabled
- **Color contrast**: Text on glass panels must maintain WCAG AA (4.5:1)
- **Keyboard navigation**: Tab order follows visual flow, skip-link to main content
- **Screen readers**: Chapter headings are proper `<h2>` elements; decorative shaders have `aria-hidden`

---

## 10. Fallbacks

| Feature | Modern Browser | Older Browser | Reduced Motion |
|---------|---------------|---------------|----------------|
| Shaders | Curtains.js WebGL | Static images | Static images |
| Pinning | GSAP ScrollTrigger | Native scroll | Native scroll |
| 3D tilt | CSS `perspective` | Scale transform only | No transform |
| Particles | Canvas 2D | Static gradient | Static gradient |
| Masonry | CSS Grid | Flexbox wrap | Flexbox wrap |

---

## 11. New Dependencies

```json
{
  "gsap": "^3.12.7",
  "lenis": "^1.1.18",
  "curtainsjs": "^8.1.6"
}
```

**Note:** `react-curtains` is outdated (2021). Use `curtainsjs` directly with a custom React hook (`useCurtains`).

---

## 12. File Structure

```
src/components/parichay/
├── ParichayPage.tsx           # Main orchestrator
├── chapters/
│   ├── HeroChapter.tsx
│   ├── WorkstreamsChapter.tsx
│   ├── PublicOutputChapter.tsx
│   ├── JoinChapter.tsx
│   └── EnterChapter.tsx
├── shaders/
│   ├── liquidDisplacement.vert
│   ├── liquidDisplacement.frag
│   ├── chromaticAberration.vert
│   ├── chromaticAberration.frag
│   ├── waveDistortion.vert
│   ├── waveDistortion.frag
│   ├── glassRefraction.vert
│   └── glassRefraction.frag
├── effects/
│   ├── CurtainsCanvas.tsx     # Single WebGL canvas manager
│   ├── useCurtains.ts         # React hook for Curtains.js
│   ├── ParticleField.tsx      # Canvas 2D particles
│   └── PerspectiveCard.tsx    # 3D tilt hover wrapper
├── layout/
│   ├── ScrollProgress.tsx     # Left-edge progress line
│   └── MasonryGrid.tsx        # CSS Grid masonry wrapper
└── data/
    └── timelineContent.ts     # Content constants (moved from page)
```

---

## 13. Implementation Order

1. **Phase 1 — Foundation**: Install deps, set up Lenis + ScrollTrigger sync, create `ParichayPage.tsx` shell
2. **Phase 2 — Scroll Structure**: Implement 5 chapter components with pinning behavior
3. **Phase 3 — Content**: Migrate existing content into chapters, build masonry grid
4. **Phase 4 — Shaders**: Add Curtains.js canvas, implement 4 shader effects
5. **Phase 5 — Polish**: Particles, progress line, mobile optimizations, reduced motion

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebGL not supported | Medium | Static image fallback, feature detection |
| Low-end device lag | High | Disable shaders on <4GB RAM, reduce particles |
| Hydration mismatch | Medium | Client-only rendering for WebGL components |
| Bundle size increase | Low | Dynamic import `curtainsjs`, tree-shake GSAP |
| Scroll hijacking annoyance | Medium | Respect reduced motion, allow skip, pin duration <2s |

---

*Spec written and ready for review.*
