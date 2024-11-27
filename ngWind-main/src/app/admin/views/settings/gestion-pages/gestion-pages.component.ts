import { CommonModule, NgClass, NgFor, NgIf, NgStyle } from '@angular/common'
import { ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AdminService } from 'src/app/admin/admin.service'
import { User } from 'src/app/auth/Model/User.model'
import { pageTransition } from 'src/app/shared/utils/animations'
import Swal from 'sweetalert2'
import { CatgoriepageService } from '../gestion-categories/catgoriepage.service'
import { Categorie } from 'src/app/auth/Model/categorie.model'
import { PageService } from './page.service'
import { Page } from 'src/app/auth/Model/Page.model'
import { ScrapingService } from './scraping.service'
import { MatDialog } from '@angular/material/dialog'
import { catchError, map, Observable, of, Subscription } from 'rxjs'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { CalendarModalComponent } from 'src/app/shared/components/calendar-modal/calendar-modal.component'
import { Router, RouterModule } from '@angular/router'
import { AppRoutes } from 'src/app/app.routes'
import {
  AdminRoutes,
  ElementRoutes,
  SettingRoutes
} from 'src/app/admin/admin.routes'
import { CommonService } from 'src/app/_core/services/common.service'

@Component({
  selector: 'app-gestion-pages',
  animations: [pageTransition],
  imports: [
    NgClass,
    FormsModule,
    NgIf,
    NgFor,
    NgStyle,
    CalendarModalComponent,
    RouterModule,
    CommonModule
  ],
  standalone: true,
  templateUrl: './gestion-pages.component.html',
  styleUrls: ['./gestion-pages.component.css']
})
export class GestionPagesComponent implements OnInit {
  sidebarIsCollapsed: boolean = true
  readonly appRoutes = AppRoutes
  readonly adminRoutes = AdminRoutes
  readonly settingRoutes = SettingRoutes
  readonly elementRoutes = ElementRoutes
  private routerSubscription: Subscription = new Subscription()

  fournisseurs: User[] = []
  categories: any[] = []
  pages: Page[] = []
  selectedCategoryId: number | null = null
  selectedSubCategoryId: number | null = null
  parent_categorie: Categorie[] = []
  subCategories: Categorie[] = []
  selectedfournisseurid: number | null = null

  scrapingProgress: { [key: number]: number } = {} // Objet pour suivre la progression du scraping
  progressVisible: boolean = false // Visibilité de la barre de progression
  currentPageId: number | null = null // ID de la page en cours de scraping
  private alertDisplayed: { [pageId: number]: boolean } = {}
  jobs: any[] = [] // Array to store the jobs

  columnData = [
    { name: 'Fournisseur', key: 'username' },
    { name: 'Base URL', key: 'base_url' },
    { name: 'Page Suffix', key: 'page_suffix' },
    { name: 'Max Page Number', key: 'nombre_page_max' },
    { name: 'Type', key: 'Type' },
    { name: 'Etat Service', key: 'etat_service' },
    { name: 'Catégorie', key: 'category' }
  ]
  selectedPage :any
  rowData: Page[] = []
  pageData: number[] = [1, 2, 3, 4, 5]
  showButton: boolean = false
  isEditMode: boolean = false

  pageToEdit: Page | null = null
  page: Page = {
    id: 0,
    id_fournisseur: 0,
    username: '',
    base_url: '',
    page_suffix: '',
    nombre_page_max: 1,
    Type: 'Avec_pagination',
    etat_service: 'EN_ATTENTE',
    date_creation: new Date(),
    date_dernier_scraping: null,
    category: null
  }

  isFormVisible = false
  pageId: number | null = null
  pageButtonVisibility: Map<number, boolean> = new Map() // Utilisez une Map pour stocker l'état du bouton par pageId

  // Utilisation d'un type approprié pour les abonnements
  private progressSubscriptions: { [pageId: number]: Subscription } = {}
  showActions: boolean = false
  activePage: any = null

  constructor (
    private adminService: AdminService,
    private categorieService: CatgoriepageService,
    private pageService: PageService,
    private scrapingService: ScrapingService,
    private cdr: ChangeDetectorRef, // Ajoutez ChangeDetectorRef
    public readonly commonServices: CommonService,
    private router: Router
  ) {}

  ngOnInit (): void {
    this.loadFournisseurs()
    this.loadCategories()
    this.loadPages()
    this.loadProgressFromLocalStorage() // Ajoutez cette ligne
    this.loadScrapingProgress()
  }

  checkProductCount (pageId: number): Observable<boolean> {
    return this.pageService.get_count_product_page(pageId).pipe(
      map(response => response.product_count > 0),
      catchError(error => {
        console.error(
          'Erreur lors de la récupération du nombre de produits:',
          error
        )
        return of(false)
      })
    )
  }

  isButtonVisible (pageId: number): boolean {
    return this.pageButtonVisibility.get(pageId) ?? false
  }

  toggleActions(page: any) {
    // Vérifie si la page cliquée est déjà active
    if (this.activePage === page) {
      this.showActions = !this.showActions; // Basculer la visibilité du menu
      if (!this.showActions) {
        this.activePage = null; // Réinitialise activePage lorsque le menu est fermé
      }
    } else {
      this.activePage = page;
      this.showActions = true; // Affiche le menu pour une nouvelle page
    }
  }

  isActive(page: any): boolean {
    return this.activePage === page;
  }


  cancelScraping (page: Page) {
    this.scrapingService.cancelScraping(page.id).subscribe({
      next: response => {
        Swal.fire({
          icon: 'success',
          title: 'Scraping Annulé',
          text: `Le scraping pour la page ${page.base_url} a été annulé.`,
          confirmButtonText: 'OK'
        })

        // Réinitialiser l'état du scraping
        this.scrapingProgress[page.id] = 0
        this.clearProgressFromLocalStorage(page.id)
      },
      error: error => {
        Swal.fire({
          icon: 'error',
          title: "Erreur de l'annulation",
          text: `Erreur lors de l'annulation du scraping pour la page ${page.base_url}. Détails: ${error}`,
          confirmButtonText: 'OK'
        })
      }
    })
  }

  loadScrapingProgress () {
    this.pageService.getPages().subscribe(pages => {
      pages.forEach(page => {
        if (page.id) {
          this.progressSubscriptions[page.id] = this.scrapingService
            .onProgressUpdate(page.id)
            .subscribe({
              next: progress => {
                console.log(progress)
                if (progress === 100) {
                  this.scrapingProgress[page.id] = 0 // Réinitialiser la progression à la fin
                  this.clearProgressFromLocalStorage(page.id)
                } else {
                  this.scrapingProgress[page.id] = progress
                  this.saveProgressToLocalStorage(page.id, progress)
                }
                this.cdr.detectChanges()
              },
              error: error => {
                Swal.fire({
                  icon: 'error',
                  title: 'Erreur de Progression',
                  text: `Erreur lors de la mise à jour de la progression pour la page : ${page.base_url}. Détails: ${error}`,
                  confirmButtonText: 'OK'
                })
              }
            })
        }
      })
    })
  }

  loadFournisseurs () {
    this.adminService.getSuppliersConfimrmed().subscribe(data => {
      this.fournisseurs = data
      if (this.fournisseurs.length > 0) {
        this.page.id_fournisseur = this.fournisseurs[0]?.id || 0
        this.page.username = this.fournisseurs[0]?.username || ''
      }
    })
  }

  loadCategories () {
    this.categorieService.getCategories().subscribe(data => {
      this.categories = data
      this.parent_categorie = this.getParentCategories()
    })
  }

  onCategoryChange (event: any) {
    const selectedCategoryId = Number(event.target.value)
    this.selectedCategoryId = selectedCategoryId
    this.getSubCategories(selectedCategoryId)
    console.log(this.selectedSubCategoryId)
    // Réinitialiser la sous-catégorie sélectionnée si une nouvelle catégorie est sélectionnée
    this.selectedSubCategoryId = null
  }
  onSubCategoryChange (event: any) {
    this.selectedSubCategoryId = Number(event.target.value)
    console.log('Selected SubCategory ID:', this.selectedSubCategoryId)
  }

  loadPages () {
    this.pageService.getPages().subscribe(pages => {
      console.log('Pages récupérées:', pages) // Vérifiez les données ici
      this.pages = pages
      this.rowData = []

      this.pages.forEach(page => {
        const category = this.categories.find(c => c.id === page.category)
        this.checkProductCount(page.id).subscribe(isVisible => {
          this.pageButtonVisibility.set(page.id, isVisible)
        })
        if (category) {
          page.category = category
          page.subCategories = this.getSubCategories(category.id)
          page.categoryHierarchy = this.getCategoryHierarchy(category)
        }
        this.rowData.push(page)
      })
    })
  }

  getCategoryHierarchy (category: Categorie | null): string {
    if (!category) return ''

    let hierarchy = category.name
    let parent = this.categories.find(c => c.id === category.parent_category)

    while (parent) {
      hierarchy = `${parent.name} / ${hierarchy}`
      parent = this.categories.find(c => c.id === parent.parent_category)
    }

    return hierarchy
  }

  openForm (page?: Page) {
    console.log("donnerformulaire2",page)
    this.isFormVisible = true
    if (page) {
      this.isEditMode = true

      this.pageToEdit = page
      this.page = { ...page } // Pré-remplir le formulaire avec les données de la page à éditer
      console.log("donnerformulaire2",this.page.category)
      const category = this.categories.find(c => c.id === page.category)
      if (category) {
        page.category = category
        page.subCategories = this.getSubCategories(category.id)
        page.categoryHierarchy = this.getCategoryHierarchy(category)
      }
    } else {
      this.isEditMode = false
      this.page = {
        id: 0,
        id_fournisseur: 0,
        username: '',
        base_url: '',
        page_suffix: '',
        nombre_page_max: 1,
        Type: 'Avec_pagination',
        etat_service: 'EN_ATTENTE',
        date_creation: new Date(),
        date_dernier_scraping: null,
        category: null
      }
      this.selectedCategoryId = null
      this.selectedSubCategoryId = null
    }
  }

  submitForm () {
    const categoryId =
      this.selectedSubCategoryId !== null
        ? this.selectedSubCategoryId
        : this.selectedCategoryId || 0
    const userId = this.page.id_fournisseur

    // Validation des champs obligatoires
    if (!userId) {
      Swal.fire('Erreur', 'Le fournisseur est obligatoire.', 'error')
      return
    }


    if (this.isEditMode) {
      console.log("form donner",this.page)
      // Mise à jour d'une page existante
      this.pageService.updatePage(this.page.id, this.page).subscribe(
        () => {
          this.loadPages()
          Swal.fire('Succès', 'Page mise à jour avec succès.', 'success')
          this.isFormVisible = false
        },
        error => {
          Swal.fire(
            'Erreur',
            `Échec de la mise à jour de la page: ${error}`,
            'error'
          )
        }
      )
    } else {
      if (!categoryId) {
        Swal.fire('Erreur', 'La catégorie est obligatoire.', 'error')
        return
      }
      // Ajout d'une nouvelle page
      this.pageService.assignerPage(userId, categoryId, this.page).subscribe(
        newPage => {
          this.loadPages()
          Swal.fire('Succès', 'Page ajoutée avec succès.', 'success')
          this.isFormVisible = false
        },
        error => {
          Swal.fire('Erreur', `Échec de l'ajout de la page: ${error}`, 'error')
        }
      )
    }
  }

  cancelEdit () {
    this.isFormVisible = false
    this.pageToEdit = null
    this.isEditMode = false
  }

  deletePage (row: Page) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.pageService.deletePage(row.id).subscribe({
          next: () => {
            this.rowData = this.rowData.filter(p => p.id !== row.id)
            Swal.fire('Supprimé !', 'La page a été supprimée.', 'success')
          },
          error: error => {
            Swal.fire(
              'Erreur !',
              `Une erreur s'est produite : ${error}`,
              'error'
            )
          }
        })
      }
    })
  }

  saveProgressToLocalStorage (pageId: number, progress: number) {
    const storedProgress = JSON.parse(
      localStorage.getItem('scrapingProgress') || '{}'
    )
    storedProgress[pageId] = progress
    localStorage.setItem('scrapingProgress', JSON.stringify(storedProgress))
  }

  clearProgressFromLocalStorage (pageId: number) {
    // Charger les progrès stockés
    const storedProgress = JSON.parse(
      localStorage.getItem('scrapingProgress') || '{}'
    )

    // Supprimer l'entrée pour la page spécifique
    delete storedProgress[pageId]

    // Sauvegarder les progrès mis à jour dans le localStorage
    localStorage.setItem('scrapingProgress', JSON.stringify(storedProgress))
  }

  loadProgressFromLocalStorage () {
    const storedProgress = JSON.parse(
      localStorage.getItem('scrapingProgress') || '{}'
    )
    this.scrapingProgress = storedProgress
  }

  startScraping (page: Page) {
    // Désabonnez-vous de l'ancienne progression pour cette page
    if (this.progressSubscriptions[page.id]) {
      this.progressSubscriptions[page.id].unsubscribe()
      delete this.progressSubscriptions[page.id]
    }

    this.currentPageId = page.id
    console.log('Début du scraping pour la page:', page.base_url)

    // Lance le scraping
    this.scrapingService.startScraping(page.id).subscribe({
      next: response => {
        console.log('aaaaaaaaaaaaaa', response)
        // Calculer le nombre de nouveaux produits et de produits en double
        const newProductsCount = response.new_products.length
        const duplicateProductsCount = response.duplicate_product_details.length

        // Afficher un Swal de succès avec le lien de la page
        Swal.fire({
          icon: 'success',
          title: 'Scraping Terminé',
          html: `<p>Scraping terminé avec succès pour la page : <a href="${page.base_url}" target="_blank">${page.base_url}</a>.</p>
                 <p>New Products: ${newProductsCount}</p>
                 <p>Duplicate Products: ${duplicateProductsCount}</p>`,
          confirmButtonText: 'OK'
        })
        this.clearProgressFromLocalStorage(page.id)
        console.log(
          `Scraping terminé avec succès pour la page : ${page.base_url}. Nouveaux produits: ${newProductsCount}, Produits en double: ${duplicateProductsCount}`
        )
      },
      error: error => {
        // Afficher un Swal d'erreur en cas d'échec du démarrage du scraping
        Swal.fire({
          icon: 'error',
          title: 'Erreur de Scraping',
          text: `Erreur lors du démarrage du scraping pour la page : ${page.base_url}. Détails: ${error}`,
          confirmButtonText: 'OK'
        })

        console.error(
          'Erreur lors du démarrage du scraping pour la page : ${page.base_url}, Erreur:',
          error
        )
      }
    })

    // Abonnez-vous à la mise à jour de la progression pour cette page
    this.progressSubscriptions[page.id] = this.scrapingService
      .onProgressUpdate(page.id)
      .subscribe({
        next: progress => {
          console.log(
            `Progression mise à jour pour la page ${page.base_url}: ${progress}%`
          )
          this.scrapingProgress[page.id] = progress
          this.progressVisible = true

          // Afficher un Swal une seule fois lorsque la progression commence
          if (progress > 0 && !this.alertDisplayed[page.id]) {
            Swal.fire({
              icon: 'info',
              title: 'Scraping en cours',
              text: `Le scraping a commencé pour la page : ${page.base_url}.`,
              confirmButtonText: 'OK'
            })

            // Marquer l'alerte comme affichée
            this.alertDisplayed[page.id] = true
          }
        },
        error: error => {
          // Afficher un Swal d'erreur en cas d'échec de la mise à jour de la progression
          Swal.fire({
            icon: 'error',
            title: 'Erreur de Progression',
            text: `Erreur lors de la mise à jour de la progression pour la page : ${page.base_url}. Détails: ${error}`,
            confirmButtonText: 'OK'
          })

          console.error(
            `Erreur lors de la mise à jour de la progression pour la page : ${page.base_url}, Erreur:`,
            error
          )
        }
      })
  }

  viewDetails(page: Page) {
    this.selectedPage = page;
  }

  // Fermer les détails
  closeDetails() {
    this.selectedPage = null;
  }

  resetForm () {
    this.page = {
      id: 0,
      id_fournisseur: 0,
      username: '',
      base_url: '',
      page_suffix: '',
      nombre_page_max: 1,
      Type: 'Avec_pagination',
      etat_service: 'EN_ATTENTE',
      date_creation: new Date(),
      date_dernier_scraping: null,
      category: null
    }
    this.selectedCategoryId = null
    this.selectedSubCategoryId = null
  }

  getEtatServiceClass (etat: string): string {
    switch (etat) {
      case 'EN_ATTENTE':
        return 'bg-yellow-400'
      case 'EN_COURS':
        return 'bg-blue-400'
      case 'TERMINER':
        return 'bg-green-400'
      default:
        return 'bg-gray-400'
    }
  }

  getSubCategories (parentId: number | null) {
    if (parentId === null) {
      this.subCategories = []
      return
    }

    this.categorieService.getCategories().subscribe(data => {
      this.categories = data
      this.subCategories = this.categories.filter(
        cat => cat.parent_category === parentId
      )
      console.log('SubCategories:', this.subCategories)
    })
    return this.subCategories
  }

  getParentCategories () {
    return this.categories.filter(cat => cat.parent_category === null)
  }

  togglePageStatus (page: Page): void {
    if (page.etat_service === 'EN_ATTENTE') {
      this.pageService.updateServiceStateToCompleted(page.id).subscribe(
        response => {
          console.log(response)

          let message =
            response.message || "L'état du service a été mis à jour."
          let htmlContent = `<p>${message}</p>`

          // Ajouter des détails supplémentaires seulement s'ils existent
          if (response.price_drops_count !== undefined) {
            htmlContent += `<p>Réductions de prix : ${response.price_drops_count}</p>`
          }
          if (
            response.products_with_price_drops &&
            response.products_with_price_drops.length > 0
          ) {
            htmlContent += `<p>Produits avec réductions : ${response.products_with_price_drops.length}</p>`
          } else if (response.price_drops_count === 0) {
            htmlContent += `<p>Aucun produit avec réduction de prix.</p>`
          }

          Swal.fire({
            icon: 'success',
            title: 'Statut Terminée',
            html: htmlContent,
            confirmButtonText: 'OK'
          })

          page.etat_service = 'TERMINER' // Mettez à jour l'état localement
          this.loadPages()
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: error,
            confirmButtonText: 'OK'
          })
        }
      )
    } else if (page.etat_service === 'TERMINER') {
      this.pageService.updateServiceStateToEnAttente(page.id).subscribe(
        response => {
          if (response.message) {
            Swal.fire({
              icon: 'success',
              title: 'Statut En Attente',
              text: response.message,
              confirmButtonText: 'OK'
            })
            page.etat_service = 'EN_ATTENTE' // Mettez à jour l'état localement
            this.loadPages()
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: response.error || 'Une erreur est survenue.',
              confirmButtonText: 'OK'
            })
          }
        },
        error => {
          console.log(error)
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: error,
            confirmButtonText: 'OK'
          })
        }
      )
    }
  }

  isCalendarVisible: boolean = false

  loadRunningJobs (): void {
    this.scrapingService.getRunningJobs().subscribe({
      next: response => {
        this.jobs = response.running_jobs
        console.log('Jobs en cours récupérés:', this.jobs)
      },
      error: error => {
        console.error('Erreur lors de la récupération des jobs:', error)
      }
    })
  }

  // Méthode appelée lors du clic sur "Add Configuration"
  addConfiguration (page: any): void {
    this.pageId = page.id
    this.isCalendarVisible = true
    this.loadRunningJobs() // Charger les jobs lorsque la configuration est ajoutée
  }

  closeCalendar (): void {
    this.isCalendarVisible = false
  }

}
