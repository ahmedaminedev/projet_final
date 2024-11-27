import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FournisseurStatsComponent } from './fournisseur-stats.component';

describe('FournisseurStatsComponent', () => {
  let component: FournisseurStatsComponent;
  let fixture: ComponentFixture<FournisseurStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FournisseurStatsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FournisseurStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
