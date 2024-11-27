import { TestBed } from '@angular/core/testing';

import { MagicSearchService } from './magic-search.service';

describe('MagicSearchService', () => {
  let service: MagicSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MagicSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
