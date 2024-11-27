import { TestBed } from '@angular/core/testing';

import { GestionProduitsPagesService } from './gestion-produits-pages.service';

describe('GestionProduitsPagesService', () => {
  let service: GestionProduitsPagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionProduitsPagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
