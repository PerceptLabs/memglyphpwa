/**
 * Panda CSS Provider
 *
 * Wraps the application (or a subtree) with Panda CSS context.
 * Manages PandaCssManager lifecycle and provides context to components.
 *
 * Session 3: Provider with recipe support
 */

import { h, ComponentChildren } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { PandaContext, type PandaCssContextValue } from './PandaContext';
import { PandaCssManager } from './PandaCssManager';
import type { DbClient } from '../../db/client';

interface PandaProviderProps {
  /** Database client (required to load Panda CSS resources) */
  dbClient: DbClient | null;

  /** Children to wrap with Panda CSS context */
  children: ComponentChildren;
}

/**
 * PandaProvider component
 *
 * Initializes PandaCssManager and provides context to child components.
 *
 * @example
 * ```tsx
 * <PandaProvider dbClient={dbClient}>
 *   <App />
 * </PandaProvider>
 * ```
 */
export function PandaProvider({ dbClient, children }: PandaProviderProps) {
  const [manager] = useState(() => new PandaCssManager());
  const [initialized, setInitialized] = useState(false);

  // Initialize manager when dbClient changes
  useEffect(() => {
    if (!dbClient) {
      setInitialized(false);
      return;
    }

    manager.init(dbClient)
      .then((success) => {
        setInitialized(success);
      })
      .catch(() => {
        setInitialized(false);
      });

    // Cleanup on unmount or when dbClient changes
    return () => {
      manager.cleanup();
    };
  }, [dbClient, manager]);

  // Memoize context value to avoid unnecessary re-renders
  const contextValue: PandaCssContextValue | null = useMemo(() => {
    if (!initialized) {
      return null;
    }

    const state = manager.getState();

    return {
      tokens: state.tokens,
      getToken: (path: string) => manager.getToken(path),
      getRecipe: (name: string) => manager.getRecipe(name),
      recipe: (name: string, variants = {}) => manager.recipe(name, variants),
      recipeStyles: (name: string, variants = {}) => manager.recipeStyles(name, variants),
      injectCssIntoShadowRoot: (shadowRoot: ShadowRoot, css: string) =>
        manager.injectCssIntoShadowRoot(shadowRoot, css),
      getCss: () => manager.getCss(),
      getTheme: (name: string) => manager.getTheme(name),
      getActiveTheme: () => manager.getActiveTheme(),
      listThemes: () => manager.listThemes(),
      setTheme: (themeName: string) => manager.setTheme(themeName),
      isLoaded: manager.isLoaded(),
      loading: state.loading,
      error: state.error,
      recipeCount: state.recipes.size,
      themeCount: state.themes.size
    };
  }, [initialized, manager]);

  return h(PandaContext.Provider, { value: contextValue }, children);
}
