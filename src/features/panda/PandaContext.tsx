/**
 * Panda CSS Context
 *
 * Provides Panda CSS state and helpers to components via React Context.
 */

import { createContext } from 'preact';
import type { PandaTokens, PandaRecipe, RecipeVariants } from './types';

export interface PandaCssContextValue {
  /** Design tokens (null if not loaded) */
  tokens: PandaTokens | null;

  /** Get a token value by path (e.g., 'colors.primary') */
  getToken: (path: string) => string | number | undefined;

  /** Get a recipe by name (Session 3) */
  getRecipe: (name: string) => PandaRecipe | undefined;

  /** Apply a recipe with variants, returns className string (Session 3) */
  recipe: (name: string, variants?: RecipeVariants) => string | undefined;

  /** Get inline styles for a recipe (Session 3) */
  recipeStyles: (name: string, variants?: RecipeVariants) => Record<string, string | number>;

  /** Inject CSS into a Shadow Root (Session 3) */
  injectCssIntoShadowRoot: (shadowRoot: ShadowRoot, css: string) => void;

  /** Get current CSS for manual injection (Session 3) */
  getCss: () => string;

  /** Check if Panda CSS is loaded */
  isLoaded: boolean;

  /** Loading state */
  loading: boolean;

  /** Error message (if any) */
  error: string | null;

  /** Recipe count */
  recipeCount: number;
}

/**
 * Panda CSS Context
 *
 * Provides access to Panda CSS design tokens and utilities.
 */
export const PandaContext = createContext<PandaCssContextValue | null>(null);
