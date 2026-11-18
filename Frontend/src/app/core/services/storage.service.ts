import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  read<T>(key: string, isExpectedType: (value: unknown) => value is T): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return null;
      }
      const value: unknown = JSON.parse(stored);
      if (!isExpectedType(value)) {
        console.error(`Stored data for "${key}" has an unexpected format.`);
        return null;
      }
      return value;
    } catch (error) {
      console.error(`Could not read stored data for "${key}".`, error);
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Could not save data for "${key}".`, error);
      throw error;
    }
  }
}
