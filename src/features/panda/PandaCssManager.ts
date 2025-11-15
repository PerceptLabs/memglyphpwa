/**
 * Panda CSS Manager
 *
 * Handles loading and managing Panda CSS resources from GlyphCase:
 * - Design tokens from /gc/ui/tokens.json
 * - Static CSS from /gc/ui/panda/styles.css
 * - Recipes from /gc/ui/panda/recipes/*.json (Session 3)
 * - Themes from /gc/ui/panda/themes/*.json (Session 4)
 *
 * Session 2 Scope: Foundation - tokens and global CSS injection only
 */

import { getLogger } from '@logtape/logtape';
import type { DbClient } from '../../db/client';
import type { PandaTokens, PandaCssState } from './types';

const logger = getLogger(['panda-css']);

export class PandaCssManager {
  private state: PandaCssState = {
    tokens: null,
    recipes: new Map(),
    themes: new Map(),
    activeTheme: null,
    cssLoaded: false,
    loading: false,
    error: null
  };

  private dbClient: DbClient | null = null;
  private styleElement: HTMLStyleElement | null = null;

  /**
   * Initialize Panda CSS with a database client
   */
  async init(dbClient: DbClient): Promise<boolean> {
    this.dbClient = dbClient;
    this.state.loading = true;
    this.state.error = null;

    try {
      // Load tokens
      await this.loadTokens();

      // Load global CSS
      await this.loadCss();

      // Load recipes (Session 3)
      await this.loadRecipes();

      logger.info('Panda CSS initialized', {
        hasTokens: this.state.tokens !== null,
        cssLoaded: this.state.cssLoaded,
        recipeCount: this.state.recipes.size
      });

      this.state.loading = false;
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.state.error = errorMsg;
      this.state.loading = false;

      logger.error('Failed to initialize Panda CSS', {
        error: errorMsg
      });

      return false;
    }
  }

  /**
   * Load design tokens from /gc/ui/tokens.json
   */
  private async loadTokens(): Promise<void> {
    if (!this.dbClient) {
      throw new Error('DbClient not initialized');
    }

    try {
      // Read tokens file from sqlar
      const blob = await this.dbClient.getPageBlob('gc/ui/tokens.json');
      const text = await blob.text();
      const tokens = JSON.parse(text) as PandaTokens;

      // Validate version (informational only)
      if (tokens.version) {
        logger.info('Panda CSS tokens loaded', {
          version: tokens.version,
          categories: Object.keys(tokens).filter(k => k !== 'version')
        });
      }

      this.state.tokens = tokens;
    } catch (err) {
      // Check if file simply doesn't exist (expected for Cases without Panda CSS)
      if (err instanceof Error && err.message.includes('not found')) {
        logger.debug('No Panda CSS tokens found', {
          path: '/gc/ui/tokens.json',
          note: 'Expected for Cases without Panda CSS'
        });
        this.state.tokens = null;
        return;
      }

      // Parsing or other errors
      logger.warn('Failed to load Panda CSS tokens', {
        error: err instanceof Error ? err.message : String(err),
        fallback: 'Continuing without design tokens'
      });

      this.state.tokens = null;
    }
  }

  /**
   * Load static CSS from /gc/ui/panda/styles.css and inject globally
   */
  private async loadCss(): Promise<void> {
    if (!this.dbClient) {
      throw new Error('DbClient not initialized');
    }

    try {
      // Read CSS file from sqlar
      const blob = await this.dbClient.getPageBlob('gc/ui/panda/styles.css');
      const css = await blob.text();

      // Inject into document
      this.injectCss(css);

      logger.info('Panda CSS styles injected', {
        length: css.length,
        method: 'global <style> tag'
      });

      this.state.cssLoaded = true;
    } catch (err) {
      // Check if file simply doesn't exist
      if (err instanceof Error && err.message.includes('not found')) {
        logger.debug('No Panda CSS styles found', {
          path: '/gc/ui/panda/styles.css',
          note: 'Expected for Cases without Panda CSS'
        });
        this.state.cssLoaded = false;
        return;
      }

      // Other errors
      logger.warn('Failed to load Panda CSS styles', {
        error: err instanceof Error ? err.message : String(err),
        fallback: 'Continuing without global styles'
      });

      this.state.cssLoaded = false;
    }
  }

  /**
   * Inject CSS into the document
   */
  private injectCss(css: string): void {
    // Remove existing Panda CSS if present
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-panda-css', 'true');
    this.styleElement.textContent = css;

    // Append to head
    document.head.appendChild(this.styleElement);

    logger.debug('CSS injected into document', {
      element: 'style[data-panda-css]'
    });
  }

  /**
   * Detect if an element is within a Shadow DOM
   *
   * Session 3: Shadow DOM detection
   */
  private isInShadowDOM(element: HTMLElement | null): ShadowRoot | null {
    if (!element) return null;

    let current: Node | null = element;

    while (current) {
      if (current instanceof ShadowRoot) {
        return current;
      }
      current = current.parentNode || (current as any).host;
    }

    return null;
  }

  /**
   * Inject CSS into a Shadow Root
   *
   * Session 3: Shadow DOM style injection
   */
  injectCssIntoShadowRoot(shadowRoot: ShadowRoot, css: string): void {
    // Check if shadow root already has Panda CSS
    const existing = shadowRoot.querySelector('style[data-panda-css]');
    if (existing) {
      existing.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.setAttribute('data-panda-css', 'true');
    style.textContent = css;

    // Prepend to shadow root (so component styles can override)
    shadowRoot.prepend(style);

    logger.debug('CSS injected into Shadow Root', {
      element: 'style[data-panda-css]',
      location: 'ShadowRoot'
    });
  }

  /**
   * Get CSS content for injection
   *
   * Returns the loaded static CSS, or empty string if not loaded.
   * Useful for manual Shadow DOM injection.
   */
  getCss(): string {
    if (!this.styleElement) {
      return '';
    }
    return this.styleElement.textContent || '';
  }

  /**
   * Load recipes from /gc/ui/panda/recipes/*.json
   *
   * Session 3: Recipe loading system
   */
  private async loadRecipes(): Promise<void> {
    if (!this.dbClient) {
      throw new Error('DbClient not initialized');
    }

    try {
      // Query sqlar for all recipe files
      const recipeFiles = await this.dbClient.query(
        `SELECT name FROM sqlar WHERE name LIKE 'gc/ui/panda/recipes/%.json' ORDER BY name`,
        []
      );

      if (!recipeFiles || recipeFiles.length === 0) {
        logger.debug('No Panda CSS recipes found', {
          path: '/gc/ui/panda/recipes/',
          note: 'Expected for Cases without recipes'
        });
        return;
      }

      logger.info('Loading Panda CSS recipes', {
        count: recipeFiles.length,
        files: recipeFiles.map((r: any) => r.name)
      });

      // Load each recipe file
      for (const row of recipeFiles) {
        const fileName = row.name as string;

        try {
          // Load recipe file
          const blob = await this.dbClient.getPageBlob(fileName);
          const text = await blob.text();
          const recipe = JSON.parse(text) as PandaRecipe;

          // Validate recipe (basic check)
          if (!recipe.name) {
            logger.warn('Recipe missing name field', {
              file: fileName,
              action: 'Skipping recipe'
            });
            continue;
          }

          // Validate recipe structure (detailed)
          const validation = this.validateRecipe(recipe, fileName);
          if (!validation.valid) {
            logger.warn('Invalid recipe structure', {
              file: fileName,
              errors: validation.errors,
              action: 'Skipping recipe'
            });
            continue;
          }

          // Store in cache
          this.state.recipes.set(recipe.name, recipe);

          logger.debug('Recipe loaded', {
            name: recipe.name,
            file: fileName,
            hasBase: !!recipe.base,
            variantCount: recipe.variants ? Object.keys(recipe.variants).length : 0
          });

        } catch (err) {
          logger.warn('Failed to load recipe', {
            file: fileName,
            error: err instanceof Error ? err.message : String(err),
            action: 'Skipping recipe'
          });
        }
      }

      logger.info('Panda CSS recipes loaded', {
        loaded: this.state.recipes.size,
        available: recipeFiles.length
      });

    } catch (err) {
      // Check if sqlar table doesn't exist or other query errors
      if (err instanceof Error && (err.message.includes('no such table') || err.message.includes('not found'))) {
        logger.debug('No recipe files found in sqlar', {
          note: 'Expected for Cases without Panda CSS'
        });
        return;
      }

      // Other errors
      logger.warn('Failed to load recipes', {
        error: err instanceof Error ? err.message : String(err),
        fallback: 'Continuing without recipes'
      });
    }
  }

  /**
   * Validate recipe structure
   *
   * Session 3: Recipe validation
   */
  private validateRecipe(recipe: PandaRecipe, fileName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!recipe.name || typeof recipe.name !== 'string') {
      errors.push('Missing or invalid "name" field');
    }

    // Check base styles (optional, but must be object if present)
    if (recipe.base !== undefined && typeof recipe.base !== 'object') {
      errors.push('"base" must be an object');
    }

    // Check variants (optional, but must be object if present)
    if (recipe.variants !== undefined) {
      if (typeof recipe.variants !== 'object') {
        errors.push('"variants" must be an object');
      } else {
        // Validate each variant group
        for (const [variantName, variantValues] of Object.entries(recipe.variants)) {
          if (typeof variantValues !== 'object') {
            errors.push(`Variant "${variantName}" must be an object`);
            continue;
          }

          // Check each variant value is an object
          for (const [valueName, styles] of Object.entries(variantValues)) {
            if (typeof styles !== 'object') {
              errors.push(`Variant "${variantName}.${valueName}" must be an object`);
            }
          }
        }
      }
    }

    // Check defaultVariants (optional, but must be object if present)
    if (recipe.defaultVariants !== undefined && typeof recipe.defaultVariants !== 'object') {
      errors.push('"defaultVariants" must be an object');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get current state
   */
  getState(): PandaCssState {
    return { ...this.state };
  }

  /**
   * Get design tokens
   */
  getTokens(): PandaTokens | null {
    return this.state.tokens;
  }

  /**
   * Check if Panda CSS is loaded
   */
  isLoaded(): boolean {
    return this.state.tokens !== null || this.state.cssLoaded;
  }

  /**
   * Get a specific token value by path
   *
   * @example
   * getToken('colors.primary') → '#6366f1'
   * getToken('spacing.md') → '16px'
   */
  getToken(path: string): string | number | undefined {
    if (!this.state.tokens) {
      return undefined;
    }

    const parts = path.split('.');
    let current: any = this.state.tokens;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Get a recipe by name
   *
   * Session 3: Recipe helpers
   */
  getRecipe(name: string): PandaRecipe | undefined {
    return this.state.recipes.get(name);
  }

  /**
   * Apply a recipe with variant props
   *
   * Returns a className string that can be used with the cn() helper.
   * The actual styles are in the global CSS or Shadow DOM styles.
   *
   * Session 3: Recipe application
   *
   * @example
   * recipe('badge', { style: 'success' })
   * // → 'panda-badge panda-badge--style-success'
   */
  recipe(name: string, variants: RecipeVariants = {}): string | undefined {
    const recipe = this.state.recipes.get(name);
    if (!recipe) {
      logger.debug('Recipe not found', { name });
      return undefined;
    }

    const classNames: string[] = [];

    // Add base class
    classNames.push(`panda-${name}`);

    // Add variant classes
    if (recipe.variants) {
      for (const [variantName, selectedValue] of Object.entries(variants)) {
        if (selectedValue && recipe.variants[variantName]) {
          if (recipe.variants[variantName][selectedValue]) {
            classNames.push(`panda-${name}--${variantName}-${selectedValue}`);
          } else {
            logger.warn('Invalid recipe variant value', {
              recipe: name,
              variant: variantName,
              value: selectedValue,
              available: Object.keys(recipe.variants[variantName])
            });
          }
        }
      }
    }

    // Apply default variants if not specified
    if (recipe.defaultVariants) {
      for (const [variantName, defaultValue] of Object.entries(recipe.defaultVariants)) {
        if (variants[variantName] === undefined) {
          classNames.push(`panda-${name}--${variantName}-${defaultValue}`);
        }
      }
    }

    return classNames.join(' ');
  }

  /**
   * Get inline styles for a recipe (alternative to CSS classes)
   *
   * Useful when CSS injection is not available or for dynamic styling.
   * Merges base styles with selected variant styles.
   *
   * Session 3: Recipe style object
   *
   * @example
   * recipeStyles('badge', { style: 'success' })
   * // → { display: 'inline-flex', backgroundColor: '#10b981', ... }
   */
  recipeStyles(name: string, variants: RecipeVariants = {}): Record<string, string | number> {
    const recipe = this.state.recipes.get(name);
    if (!recipe) {
      logger.debug('Recipe not found', { name });
      return {};
    }

    const styles: Record<string, string | number> = {};

    // Merge base styles
    if (recipe.base) {
      Object.assign(styles, this.interpolateTokens(recipe.base));
    }

    // Merge variant styles
    if (recipe.variants) {
      for (const [variantName, selectedValue] of Object.entries(variants)) {
        if (selectedValue && recipe.variants[variantName]?.[selectedValue]) {
          const variantStyles = recipe.variants[variantName][selectedValue];
          Object.assign(styles, this.interpolateTokens(variantStyles));
        }
      }
    }

    // Apply default variants if not specified
    if (recipe.defaultVariants) {
      for (const [variantName, defaultValue] of Object.entries(recipe.defaultVariants)) {
        if (variants[variantName] === undefined && recipe.variants?.[variantName]?.[defaultValue]) {
          const variantStyles = recipe.variants[variantName][defaultValue];
          Object.assign(styles, this.interpolateTokens(variantStyles));
        }
      }
    }

    return styles;
  }

  /**
   * Interpolate token references in style values
   *
   * Replaces {token.path} references with actual token values.
   *
   * Session 3: Token interpolation
   *
   * @example
   * interpolateTokens({ color: '{colors.primary}' })
   * // → { color: '#6366f1' }
   */
  private interpolateTokens(styles: Record<string, string | number>): Record<string, string | number> {
    const result: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(styles)) {
      if (typeof value === 'string' && value.includes('{')) {
        // Extract token path from {token.path}
        const tokenMatch = value.match(/\{([^}]+)\}/);
        if (tokenMatch) {
          const tokenPath = tokenMatch[1];
          const tokenValue = this.getToken(tokenPath);

          if (tokenValue !== undefined) {
            result[key] = String(tokenValue);
          } else {
            logger.warn('Token not found during interpolation', {
              path: tokenPath,
              style: key,
              fallback: value
            });
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Remove injected CSS
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Reset state
    this.state = {
      tokens: null,
      recipes: new Map(),
      themes: new Map(),
      activeTheme: null,
      cssLoaded: false,
      loading: false,
      error: null
    };

    this.dbClient = null;

    logger.info('Panda CSS cleaned up');
  }
}

/**
 * Singleton instance (optional - can also be created per-case)
 */
export const pandaCssManager = new PandaCssManager();
