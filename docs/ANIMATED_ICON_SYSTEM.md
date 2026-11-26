# Animated Icon System — P0 (#64)

Owner: SVG agent; platform integration coordinated with Designer/A01 (#6, #53). Source: src/design-system/icons/. Inline React SVG is the source of truth; no external assets or runtime dependencies. Soft Vibrant default, eight palettes, independent per-format overrides and motion opt-out. Colors are validated; solid foreground is selected by contrast. No changes to project JSON, brand kit or Remotion output.

## Preview
Run npm ci, then npm run dev and open http://127.0.0.1:5173/icon-lab.html (use the actual Vite port). This is a development-only entry; default production build and navigation remain unchanged. Preview provides native color inputs, sizes, hover/loop/none, pause and reset. Palette selection replaces custom colors; theme and motion-enabled persist under shorts-studio.icon-theme.v1. Storage failure is shown; no external requests. Browser reduced-motion overrides the selected motion.

## Integration contract
Import AnimatedIcon and IconThemeProvider from src/design-system/icons (relative imports), and import src/design-system/icons/motion.css once in the host. Wrap the app in one provider after coordination. Without provider the default theme is used. Example: <AnimatedIcon name="shorts" size={80} motion="hover" />. Decorative by default; provide label only for meaningful standalone imagery. Hover is one cycle; loop is opt-in and paused offscreen; static is default. For production endless loops provide an accessible pause control. Existing Button strips size-prop children alongside text by policy; don't override it. Keep utility Lucide icons.

## Verification
npm run typecheck; npm test (both tests use .test.ts to match existing glob); npm run build. Browser check: open lab, change each preset and color, reload, verify persistence, hover/loop/off and reduced motion, repeated icons, narrow viewport. Do not claim these pass until actually run. No global screen changes in P0. Next: coordinate ContentLaunchPanel, MarketingHome and main provider, then navigation/editor and registry extension.
