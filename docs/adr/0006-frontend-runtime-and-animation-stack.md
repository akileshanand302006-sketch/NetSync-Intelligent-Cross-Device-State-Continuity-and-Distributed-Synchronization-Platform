# ADR 0006: Frontend Runtime Architecture, Design System, and Animation Stack

**Status:** Accepted  
**Date:** October 2026  
**Deciders:** NetSync Core Team  
**Consulted:** Section 3, Section 7.1

---

## Context and Problem Statement

NetSync features an iOS-inspired spatial computing interface: Liquid Glass surfaces, 3D ambient particle mesh canvas, floating capsule navigation, command palette (`Cmd+K`), and smooth tab transitions.

The prompt specifies:
- *"Preserve NetSync's existing premium visual identity: spatial iOS-inspired Liquid Glass, floating capsule navigation, refined emerald accents, dark and light themes, cinematic network imagery, and restrained motion graphics."*
- *"Use Framer Motion plus GSAP. Drop Anime.js (a third overlapping library). Keep Rive only for small state-machine icons."*
- *"Convert the existing application into a seamless single-page application experience, allowing users to navigate between all existing sections without full-page reloads."*

---

## Decision Drivers

1. **Non-Negotiable Rule 2:** Preserve and protect. Do not rewrite working UI from scratch.
2. **Instant Performance:** Single-page navigation must avoid full page reloads and render immediately with zero flicker.
3. **Bundle Efficiency:** Avoid carrying multiple redundant animation runtimes (Anime.js + Motion + GSAP).

---

## Decision Outcome

Chosen Option: **Preserve the High-Performance Vite 8 / React 19 SPA with Standardized Motion & GSAP Stack**.

### Architectural Decisions:
1. **SPA Router & State:** The frontend operates as a seamless single-page application (`apps/web/src/App.jsx`), managing history via `window.history.pushState` and `popstate` listeners with deep linking.
2. **Design System & Spatial Glass Tokens:**
   - Centralized CSS tokens in `src/index.css` handle light (`pearl glass`, obsidian text, emerald accents) and dark (`obsidian glass`, silver highlights, glowing accents) themes.
   - Reusable components (`SpatialGlassSurface`, `FloatingGlassNavbar`, `FloatingGlassDock`, `LiquidGlassButton`, `LiquidGlassInput`, `GlassCommandPalette`).
3. **Animation Stack Pruning:**
   - Standardize on `motion` (v14.1.0, Framer Motion for React 19) for view transitions, layout animations, and modal spring physics.
   - Use `gsap` (v3.15.0) for complex multi-stage timelines (e.g., life-of-a-request packet waterfall, congestion control sawtooth curves).
   - Prune `animejs` from `package.json` to reduce bundle weight and prevent engine fragmentation.
4. **Accessible Three.js 3D Fallback:**
   - The 3D canvas mesh in `NetworkMesh3D.jsx` provides spatial visualization of peer topology.
   - Respects `prefers-reduced-motion` and automatically disables or renders a static 2D vector graphic when WebGL is unavailable or on low-power mobile devices.

---

## Consequences

### Positive
- Retains 100% of the polished, interactive spatial Liquid Glass product experience.
- Eliminates redundant bundle weight by dropping unused `animejs`.
- Guaranteed 60 FPS UI transitions without full-page reloads.

### Negative / Trade-offs
- The build uses Vite for the client application rather than Next.js App Router; if Next.js server components are later required, a BFF layer can be introduced without disrupting client assets.
