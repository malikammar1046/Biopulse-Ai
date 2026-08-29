# PMOSense Web — Performance & Bundle Audit

**Date:** August 29, 2026  
**Audited Directory:** `apps/web`  
**Branch:** `performance/web-optimization`  

---

## 1. Initial Baseline Measurements (Pre-Optimization)

- **Total Initial JS Bundle:** `1,556.91 kB` (1.55 MB uncompressed, `422.30 kB` gzip)
- **Total Initial CSS:** `92.58 kB` (`13.02 kB` gzip)
- **Modules Transformed:** `2,839`
- **Initial Chunks:** Single monolithic `dist/assets/index-*.js` chunk (No route-level or component-level code-splitting).

---

## 2. Largest JS Chunk & Dependency Contributors

| Dependency / Component | Approx. Size (Uncompressed) | Usage / Impact |
| :--- | :--- | :--- |
| `three` | ~600 kB | 3D WebGL rendering engine |
| `@react-three/drei` | ~350 kB | R3F helpers (`MeshDistortMaterial`, `Float`, `Line`) |
| `@react-three/fiber` | ~120 kB | React Three.js reconciliation |
| `framer-motion` | ~120 kB | Page transitions & micro-interactions |
| `lucide-react` | ~80 kB | Iconography |
| `react-router-dom` / `react` / `react-dom` | ~150 kB | Core application framework |

---

## 3. Key Performance Bottlenecks Identified

### A. Monolithic Routing (No Route Splitting)
- `App.tsx` statically imports all public pages (`Home`, `About`, `HowItWorks`, `Features`, `Contact`), auth pages (`Login`, `Register`), and placeholder pages.
- When a user lands on `/`, the browser downloads code for all 13 pages and their sub-sections.

### B. Global 3D / WebGL Execution on Critical Path
- `HeroSection.tsx` on the Home page immediately executes `VitalOrb`, mounting a real-time WebGL Canvas with 6 lights, `MeshDistortMaterial`, 50 inflowing particles, and continuous `useFrame` render loops before initial paint.
- `VitalOrb` and `ReproductiveSystem3D` are also mounted multiple times in below-the-fold CTA sections, causing multiple concurrent WebGL contexts on low-power devices.

### C. Unused Dependencies & Dead Code
- `@supabase/supabase-js` is listed in `package.json` dependencies but has zero imports in `src/`.
- `apps/web/src/App.css` (2.89 kB) is legacy Vite boilerplate and is not imported anywhere.
- `apps/web/src/assets/hero.png`, `react.svg`, `vite.svg` are unused assets.

### D. Expensive Animations & Visual Redundancy
- High count of infinite Framer Motion loops (`repeat: Infinity`) animating blur, scale, and opacity simultaneously.
- Heavy stacking of high-radius blur filters (`blur-[160px]`, `blur-[180px]`, `backdrop-blur-xl`).
- High-resolution remote photography with multiple layers in `HumanSymptomExperienceSection.tsx`.

---

## 4. Optimization Strategy & Action Plan

1. **Remove Dead Code & Dependencies**:
   - Prune `@supabase/supabase-js` from `package.json`.
   - Remove `App.css` and unused template assets.
2. **Route-Level Code Splitting**:
   - Implement `React.lazy()` + `Suspense` for all pages in `App.tsx`.
3. **Three.js & 3D Decoupling**:
   - Lazy-load 3D WebGL canvases only when needed.
   - Show instant lightweight CSS/SVG biological visuals initially so first paint is sub-second.
   - Replace purely decorative below-the-fold CTAs with ultra-fast GPU-accelerated CSS/SVG biological pulses.
   - Optimize geometry, lights, and pause off-screen WebGL rendering.
4. **Framer Motion & CSS Streamlining**:
   - Replace CPU-heavy infinite loops with lightweight CSS transforms.
   - Optimize blur layer density.
   - Add `prefers-reduced-motion` compliance.
5. **Vite Bundle Splitting**:
   - Configure manual chunking for vendor libraries (`three`, `framer-motion`, `lucide-react`, `react-vendor`).
