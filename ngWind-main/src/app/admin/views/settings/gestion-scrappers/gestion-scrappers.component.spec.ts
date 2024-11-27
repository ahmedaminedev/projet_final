import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionScrappersComponent } from './gestion-scrappers.component';

describe('GestionScrappersComponent', () => {
  let component: GestionScrappersComponent;
  let fixture: ComponentFixture<GestionScrappersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionScrappersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionScrappersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
