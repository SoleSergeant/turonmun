/**
 * Field definitions for admin-editable site content. The admin editor
 * (Admin → Site content) is generated from these, and the public pages read
 * the values through useContent().
 */
export type Field =
  | { key: string; label: string; type: 'text' | 'textarea' | 'url' | 'image' | 'date'; hint?: string }
  | { key: string; label: string; type: 'number'; hint?: string }
  | { key: string; label: string; type: 'boolean'; hint?: string }
  /** A list of plain strings (one per line in the editor). */
  | { key: string; label: string; type: 'strings'; hint?: string }
  /** A list of objects, e.g. FAQ items or sponsors. */
  | { key: string; label: string; type: 'list'; fields: Field[]; itemLabel: string; titleKey?: string; hint?: string; newItem?: Record<string, unknown> }
  /** A nested object shown as a sub-group. */
  | { key: string; label: string; type: 'group'; fields: Field[]; hint?: string; collapsed?: boolean };

export interface Section<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  title: string;
  /** Sidebar group in the editor. */
  group: string;
  description?: string;
  fields: Field[];
  defaults: T;
}
