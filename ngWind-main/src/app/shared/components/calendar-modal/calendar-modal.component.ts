import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CalendarEvent, CalendarEventTimesChangedEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { catchError, of, Subject, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isSameMonth } from 'date-fns';
import { CommonModule } from '@angular/common';
import { ScrapingService } from 'src/app/admin/views/settings/gestion-pages/scraping.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendar-modal',
  templateUrl: './calendar-modal.component.html',
  styleUrls: ['./calendar-modal.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CalendarModule]
})
export class CalendarModalComponent implements OnInit, OnChanges {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  activeDayIsOpen: boolean = true;
  refresh: Subject<any> = new Subject();

  @Input() pageId: number | null = null;
  @Input() jobs: any = {};  // Change to any for better flexibility

  configurationForm: FormGroup;
  editConfiguration: boolean = false;
  selectedFrequency: string = 'DAILY';
  daysOfWeekOptions = [
    { display: 'Monday', value: 'mon' },
    { display: 'Tuesday', value: 'tue' },
    { display: 'Wednesday', value: 'wed' },
    { display: 'Thursday', value: 'thu' },
    { display: 'Friday', value: 'fri' },
    { display: 'Saturday', value: 'sat' },
    { display: 'Sunday', value: 'sun' }
  ];  hasJobForCurrentPage: boolean = false;
  hours: number[] = Array.from({ length: 23 }, (_, i) => i + 1);  // List of hours from 1 to 23
  minutes: number[] = Array.from({ length: 60 }, (_, i) => i);  // List of minutes from 0 to 59


  constructor(
    private fb: FormBuilder,
    private modal: NgbModal,
    private scrapingService: ScrapingService
  ) {
    this.configurationForm = this.fb.group({
      frequency: ['DAILY', Validators.required],
      hour: [0, [Validators.required, Validators.min(0), Validators.max(23)]],
      minute: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
      dayOfWeek: [''],
      day: 0
    });
  }

  ngOnInit(): void {
    this.updateEventsFromJobs();
    this.checkIfPageHasJob();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobs'] && changes['jobs'].currentValue) {
      this.updateEventsFromJobs();
      this.checkIfPageHasJob();
    }
  }

  onSubmit(): void {
    if (this.configurationForm.invalid) {
      return;
    }

    const jobData = {
      page_id: this.pageId,
      frequency: this.configurationForm.value.frequency,
      hour: this.configurationForm.value.hour,
      minute: this.configurationForm.value.minute,
      day_of_week: this.configurationForm.value.dayOfWeek,
      day: this.configurationForm.value.day
    };

    this.scrapingService.addConfigurationSchedule(jobData).subscribe(
      response => {
        console.log('Configuration added successfully', response);

        // Swal notification for successful addition
        Swal.fire({
          title: 'Success!',
          text: 'Configuration added successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Actualiser la liste des jobs après ajout
        this.scrapingService.getRunningJobs().subscribe(
          response => {
            this.jobs = response.running_jobs;
            this.updateEventsFromJobs();
            this.checkIfPageHasJob();
          },
          error => {
            console.error('Error fetching jobs', error);
          }
        );
      },
      error => {
        console.error('Error adding configuration', error);

        // Swal notification for error
        Swal.fire({
          title: 'Error!',
          text: error,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    );
  }
  onFrequencyChange(event: any): void {
    this.selectedFrequency = event.target.value;
  }

  updateEventsFromJobs(): void {
    if (!Array.isArray(this.jobs)) {
      console.error('Jobs is not an array:', this.jobs);
      return;
    }

    this.events = this.jobs.map(job => {
      return {
        title: 'Page : ' + job.args[0],
        start: new Date(job.next_run_time),
        end: new Date(job.next_run_time),
        color: job.args[0] === this.pageId ? { primary: '#ff5722', secondary: '#ffccbc' } : { primary: '#1e90ff', secondary: '#D1E8FF' },
        draggable: true,
        resizable: { beforeStart: true, afterEnd: true },
      };
    });
  }

  checkIfPageHasJob(): void {
    if (!Array.isArray(this.jobs)) {
      console.error('Jobs is not an array:', this.jobs);
      return;
    }

    this.hasJobForCurrentPage = this.jobs.some(job => job.args[0] === this.pageId);
    this.editConfiguration = this.hasJobForCurrentPage;
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      this.viewDate = date;
      this.activeDayIsOpen = events.length > 0 && this.activeDayIsOpen !== true;
    }
  }

  handleEvent(action: string, event: CalendarEvent): void {
    console.log('Event action:', action, event);
  }

  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next(undefined);
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  closeOpenMonthViewDay(): void {
    this.activeDayIsOpen = false;
  }

  addEvent(): void {
    this.events = [
      ...this.events,
      {
        title: 'Nouvel événement',
        start: new Date(),
        end: new Date(),
        color: { primary: '#1e90ff', secondary: '#D1E8FF' },
        draggable: true,
        resizable: { beforeStart: true, afterEnd: true },
      },
    ];
  }

  deleteEvent(eventToDelete: CalendarEvent): void {
    this.events = this.events.filter(event => event !== eventToDelete);
  }






  onDeleteJob(jobId: number): void {
    // Afficher une boîte de dialogue de confirmation
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action supprimera la configuration du job et elle ne pourra pas être annulée !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        // Appel du service de suppression
        this.scrapingService.deletejob(jobId).pipe(
          tap(response => {
            console.log('Suppression réussie, réponse:', response); // Log de la réponse

            // Mise à jour de la liste des jobs après suppression
            this.jobs = this.jobs.filter((job: { id: number; }) => job.id !== jobId);
            console.log('Jobs après suppression:', this.jobs); // Log de la liste des jobs

            this.scrapingService.getRunningJobs().subscribe(
              response => {
                this.jobs = response.running_jobs;
                this.updateEventsFromJobs();
                this.checkIfPageHasJob();
              },
              error => {
                console.error('Error fetching jobs', error);
              }
            );

            // Notification de succès après la suppression
            Swal.fire({
              title: 'Supprimé!',
              text: response.message, // Utiliser le message de la réponse de l'API
              icon: 'success',
              confirmButtonText: 'OK'
            });
          }),
          catchError(error => {
            console.error('Échec de la suppression', error);

            // Notification d'erreur en cas d'échec de la suppression
            Swal.fire({
              title: 'Erreur!',
              text: error || 'La suppression a échoué. Veuillez réessayer.',
              icon: 'error',
              confirmButtonText: 'OK'
            });

            return of(null);
          })
        ).subscribe();
      }
    });
  }









}
