import { TestBed } from '@angular/core/testing';

import { ConsultFournisseurByScraperService } from './consult-fournisseur-by-scraper.service';

describe('ConsultFournisseurByScraperService', () => {
  let service: ConsultFournisseurByScraperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultFournisseurByScraperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
