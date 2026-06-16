import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ProvinceDto,
  SubjectListItemDto,
} from '../../api/generated/client/models';
import {
  AddressService,
  SubjectsService,
} from '../../api/generated/client/services';

@Injectable({ providedIn: 'root' })
export class LookupCacheService {
  private static readonly ttlMs = 24 * 60 * 60 * 1000;

  private readonly addressApi = inject(AddressService);
  private readonly subjectsApi = inject(SubjectsService);

  private subjectsCache: SubjectListItemDto[] | null = null;
  private subjectsLoadedAt = 0;
  private subjectsPromise: Promise<SubjectListItemDto[]> | null = null;

  private provincesCache: ProvinceDto[] | null = null;
  private provincesLoadedAt = 0;
  private provincesPromise: Promise<ProvinceDto[]> | null = null;

  getSubjects(force = false): Promise<SubjectListItemDto[]> {
    if (!force && this.subjectsCache && this.isFresh(this.subjectsLoadedAt)) {
      return Promise.resolve(this.subjectsCache);
    }

    if (!force && this.subjectsPromise) {
      return this.subjectsPromise;
    }

    this.subjectsPromise = firstValueFrom(this.subjectsApi.getSubjects())
      .then((response) => {
        this.subjectsCache = response.data ?? [];
        this.subjectsLoadedAt = Date.now();
        return this.subjectsCache;
      })
      .finally(() => {
        this.subjectsPromise = null;
      });

    return this.subjectsPromise;
  }

  getProvinces(force = false): Promise<ProvinceDto[]> {
    if (!force && this.provincesCache && this.isFresh(this.provincesLoadedAt)) {
      return Promise.resolve(this.provincesCache);
    }

    if (!force && this.provincesPromise) {
      return this.provincesPromise;
    }

    this.provincesPromise = firstValueFrom(this.addressApi.getProvinces())
      .then((response) => {
        this.provincesCache = response.data ?? [];
        this.provincesLoadedAt = Date.now();
        return this.provincesCache;
      })
      .finally(() => {
        this.provincesPromise = null;
      });

    return this.provincesPromise;
  }

  invalidate(): void {
    this.subjectsCache = null;
    this.provincesCache = null;
    this.subjectsLoadedAt = 0;
    this.provincesLoadedAt = 0;
  }

  private isFresh(loadedAt: number): boolean {
    return loadedAt > 0 && Date.now() - loadedAt < LookupCacheService.ttlMs;
  }
}
