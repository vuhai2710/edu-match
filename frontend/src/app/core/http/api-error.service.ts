import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorService {
  readonly lastError = signal<string | null>(null);

  setError(message: string): void {
    this.lastError.set(message);
  }

  clear(): void {
    this.lastError.set(null);
  }
}
