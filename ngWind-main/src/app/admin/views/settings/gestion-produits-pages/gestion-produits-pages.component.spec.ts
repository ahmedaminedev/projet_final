import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionProduitsPagesComponent } from './gestion-produits-pages.component';

describe('GestionProduitsPagesComponent', () => {
  let component: GestionProduitsPagesComponent;
  let fixture: ComponentFixture<GestionProduitsPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProduitsPagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionProduitsPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
