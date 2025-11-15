/**
 * ThemeSwitcher Component
 *
 * UI component for switching between Panda CSS themes.
 * Provides dropdown selector with automatic theme switching.
 *
 * Session 4: Theme switching UI
 *
 * @example Basic usage
 * ```tsx
 * import { ThemeSwitcher } from '@/features/panda/ThemeSwitcher';
 *
 * function App() {
 *   return (
 *     <div>
 *       <header>
 *         <ThemeSwitcher />
 *       </header>
 *       <main>Content</main>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Custom styling
 * ```tsx
 * <ThemeSwitcher className="my-theme-switcher" />
 * ```
 */

import { h } from 'preact';
import { useTheme } from './useTheme';
import { cn } from '../../lib/classnames';

export interface ThemeSwitcherProps {
  /** Additional CSS class names */
  className?: string;

  /** Label for the theme selector (default: "Theme:") */
  label?: string;

  /** Hide label (default: false) */
  hideLabel?: boolean;
}

/**
 * ThemeSwitcher component
 *
 * Displays a dropdown for switching between available Panda CSS themes.
 * Automatically hidden if no themes are available or Panda CSS is not loaded.
 */
export function ThemeSwitcher({
  className,
  label = 'Theme:',
  hideLabel = false
}: ThemeSwitcherProps) {
  const theme = useTheme();

  // Hide if no Panda CSS or no themes available
  if (!theme || !theme.hasThemes) {
    return null;
  }

  const handleThemeChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    theme.setTheme(target.value);
  };

  return (
    <div className={cn('theme-switcher', className)}>
      {!hideLabel && (
        <label htmlFor="theme-select" className="theme-switcher__label">
          {label}
        </label>
      )}
      <select
        id="theme-select"
        className="theme-switcher__select"
        value={theme.activeTheme || ''}
        onChange={handleThemeChange}
      >
        {theme.availableThemes.map((themeName) => {
          const themeData = theme.getTheme(themeName);
          const displayName = themeData?.description || themeName;

          return (
            <option key={themeName} value={themeName}>
              {displayName}
            </option>
          );
        })}
      </select>
    </div>
  );
}
