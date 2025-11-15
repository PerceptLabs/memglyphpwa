/**
 * useTheme Hook
 *
 * Provides theme management functionality for Panda CSS.
 *
 * Session 4: Theme switching and management
 *
 * @example Basic usage
 * ```tsx
 * import { useTheme } from '@/features/panda/useTheme';
 *
 * function MyComponent() {
 *   const { activeTheme, availableThemes, setTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <p>Current theme: {activeTheme || 'none'}</p>
 *       <select onChange={(e) => setTheme(e.target.value)}>
 *         {availableThemes.map(theme => (
 *           <option key={theme} value={theme}>{theme}</option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With theme details
 * ```tsx
 * function ThemeInfo() {
 *   const { getTheme, activeTheme } = useTheme();
 *   const theme = activeTheme ? getTheme(activeTheme) : null;
 *
 *   return (
 *     <div>
 *       {theme && (
 *         <>
 *           <h3>{theme.name}</h3>
 *           <p>{theme.description}</p>
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { usePandaCss } from './usePandaCss';
import type { PandaTheme } from './types';

export interface UseThemeReturn {
  /** Currently active theme name (null if none) */
  activeTheme: string | null;

  /** List of all available theme names */
  availableThemes: string[];

  /** Number of available themes */
  themeCount: number;

  /** Get a theme by name */
  getTheme: (name: string) => PandaTheme | undefined;

  /** Set active theme */
  setTheme: (themeName: string) => boolean;

  /** Check if Panda CSS themes are available */
  hasThemes: boolean;
}

/**
 * Hook for managing Panda CSS themes
 *
 * Returns null if Panda CSS is not available.
 */
export function useTheme(): UseThemeReturn | null {
  const panda = usePandaCss();

  if (!panda) {
    return null;
  }

  return {
    activeTheme: panda.getActiveTheme(),
    availableThemes: panda.listThemes(),
    themeCount: panda.themeCount,
    getTheme: panda.getTheme,
    setTheme: panda.setTheme,
    hasThemes: panda.themeCount > 0
  };
}
