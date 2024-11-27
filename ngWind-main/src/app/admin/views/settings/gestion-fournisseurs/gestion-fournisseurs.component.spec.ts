import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionFournisseursComponent } from './gestion-fournisseurs.component';

describe('GestionFournisseursComponent', () => {
  let component: GestionFournisseursComponent;
  let fixture: ComponentFixture<GestionFournisseursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionFournisseursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionFournisseursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
