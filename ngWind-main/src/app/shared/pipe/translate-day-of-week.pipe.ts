
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translateDayOfWeek',
  standalone: true

})
export class TranslateDayOfWeekPipe implements PipeTransform {
  private dayTranslations: { [key: string]: string } = {
    'mon': 'Lundi',
    'tue': 'Mardi',
    'wed': 'Mercredi',
    'thu': 'Jeudi',
    'fri': 'Vendredi',
    'sat': 'Samedi',
    'sun': 'Dimanche'
  };

  transform(value: string): string {
    return this.dayTranslations[value.toLowerCase()] || value;
  }
}
