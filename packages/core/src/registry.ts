import type { GenrePack } from './pack';
import type { TargetAdapter } from './adapter';

/** A tiny string→item registry used for Genre Packs and Target Adapters. */
export class Registry<T> {
  private items = new Map<string, T>();
  register(key: string, item: T): this {
    this.items.set(key, item);
    return this;
  }
  get(key: string): T {
    const item = this.items.get(key);
    if (!item) throw new Error(`not registered: ${key}`);
    return item;
  }
  has(key: string): boolean {
    return this.items.has(key);
  }
  list(): string[] {
    return [...this.items.keys()];
  }
}

export const packRegistry = new Registry<GenrePack>();
export const adapterRegistry = new Registry<TargetAdapter>();
