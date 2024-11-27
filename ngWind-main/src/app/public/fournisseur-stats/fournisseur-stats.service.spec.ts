import { TestBed } from '@angular/core/testing';

import { FournisseurStatsService } from './fournisseur-stats.service';

describe('FournisseurStatsService', () => {
  let service: FournisseurStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FournisseurStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
