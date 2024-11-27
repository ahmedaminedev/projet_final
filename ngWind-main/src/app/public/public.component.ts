import { Component,OnInit,Renderer2,ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.css'],
  encapsulation: ViewEncapsulation.None  // Désactiver l'encapsulation

})
export class PublicComponent implements OnInit {

  constructor(private renderer: Renderer2) { }


  ngOnInit(): void {
    // Appliquer les styles au body
    this.renderer.setStyle(document.body, 'margin', '0');
    this.renderer.setStyle(document.body, 'font-family', '"Roboto", sans-serif');
    this.renderer.setStyle(document.body, 'font-size', '1rem');
    this.renderer.setStyle(document.body, 'font-weight', '400');
    this.renderer.setStyle(document.body, 'line-height', '1.5');
    this.renderer.setStyle(document.body, 'color', '#6C757D');
    this.renderer.setStyle(document.body, 'text-align', 'left');
    this.renderer.setStyle(document.body, 'background-color', '#F5F5F5');
  }

  ngOnDestroy(): void {
    // Réinitialiser les styles du body lors de la destruction du composant
    this.renderer.removeStyle(document.body, 'margin');
    this.renderer.removeStyle(document.body, 'font-family');
    this.renderer.removeStyle(document.body, 'font-size');
    this.renderer.removeStyle(document.body, 'font-weight');
    this.renderer.removeStyle(document.body, 'line-height');
    this.renderer.removeStyle(document.body, 'color');
    this.renderer.removeStyle(document.body, 'text-align');
    this.renderer.removeStyle(document.body, 'background-color');
  }
}
