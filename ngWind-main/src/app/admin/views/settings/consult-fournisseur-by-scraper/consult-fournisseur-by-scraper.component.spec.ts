import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultFournisseurByScraperComponent } from './consult-fournisseur-by-scraper.component';

describe('ConsultFournisseurByScraperComponent', () => {
  let component: ConsultFournisseurByScraperComponent;
  let fixture: ComponentFixture<ConsultFournisseurByScraperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultFournisseurByScraperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsultFournisseurByScraperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
