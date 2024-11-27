import { TestBed } from '@angular/core/testing';

import { CatgoriepageService } from './catgoriepage.service';

describe('CatgoriepageService', () => {
  let service: CatgoriepageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatgoriepageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
