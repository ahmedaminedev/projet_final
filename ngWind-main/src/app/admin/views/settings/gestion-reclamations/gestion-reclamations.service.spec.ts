import { TestBed } from '@angular/core/testing';

import { GestionReclamationsService } from './gestion-reclamations.service';

describe('GestionReclamationsService', () => {
  let service: GestionReclamationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionReclamationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
