/**
 * usePandaCss Hook
 *
 * Provides access to Panda CSS design tokens, recipes, and helpers.
 *
 * Returns null if Panda CSS is not available for the current GlyphCase.
 * This enables graceful degradation to base component styles.
 *
 * Session 3: Now includes recipe support and Shadow DOM utilities
 *
 * @example Basic token usage
 * ```tsx
 * import { usePandaCss } from '@/features/panda/usePandaCss';
 * import { cn } from '@/lib/classnames';
 *
 * function MyComponent() {
 *   const panda = usePandaCss();
 *   const primaryColor = panda?.getToken('colors.primary');
 *
 *   return (
 *     <div style={{ color: primaryColor }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Recipe with className
 * ```tsx
 * function Badge({ status }: { status: 'success' | 'warning' | 'critical' }) {
 *   const panda = usePandaCss();
 *
 *   return (
 *     <span className={cn(
 *       'badge',                          // Base class (always)
 *       panda?.recipe('badge', { style: status })  // Panda recipe (optional)
 *     )}>
 *       {status}
 *     </span>
 *   );
 * }
 * ```
 *
 * @example Recipe with inline styles
 * ```tsx
 * function Card() {
 *   const panda = usePandaCss();
 *   const cardStyles = panda?.recipeStyles('card', { variant: 'elevated' });
 *
 *   return (
 *     <div style={cardStyles || defaultCardStyles}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Shadow DOM usage
 * ```tsx
 * function WebComponent() {
 *   const panda = usePandaCss();
 *   const shadowRef = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     if (!shadowRef.current || !panda) return;
 *
 *     const shadow = shadowRef.current.attachShadow({ mode: 'open' });
 *     const css = panda.getCss();
 *     panda.injectCssIntoShadowRoot(shadow, css);
 *   }, [panda]);
 *
 *   return <div ref={shadowRef}>Shadow DOM content</div>;
 * }
 * ```
 */

import { useContext } from 'preact/hooks';
import { PandaContext } from './PandaContext';
import type { PandaCssContextValue } from './PandaContext';

export function usePandaCss(): PandaCssContextValue | null {
  const context = useContext(PandaContext);

  // Return null if Panda CSS not available (graceful degradation)
  if (!context || !context.isLoaded) {
    return null;
  }

  return context;
}
