from django.db import models


class Category(models.Model):
    id = models.BigAutoField(primary_key=True)  # ID auto-incrémenté
    name = models.CharField(max_length=100)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='subcategories')

    def __str__(self):
        return self.name

    
class Page(models.Model):
    class EtatService(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En Attente'
        TERMINER = 'TERMINER', 'Terminé'

    class TypePage(models.TextChoices):
        Avec_pagination = 'Avec_pagination', 'Avec_pagination'
        Autre = 'Autre', 'Autre'

    id_fournisseur = models.IntegerField()  # L'identifiant de l'utilisateur associé
    username = models.CharField(max_length=100)  # Le nom d'utilisateur de l'utilisateur associé
    username_scraper = models.CharField(max_length=100, blank=True, null=True)  # Le nom d'utilisateur du scraper
    nombre_page_max = models.IntegerField(null=True, blank=True)  # Le nombre de pages maximum
    base_url = models.URLField()  # Le lien de la page
    page_suffix = models.CharField(max_length=100, null=True, blank=True)  # Le suffixe de la page
    description = models.TextField(null=True, blank=True)  # La description de la page
    Type = models.CharField(max_length=20, choices=TypePage.choices, default=TypePage.Avec_pagination)  # L'état du service
    etat_service = models.CharField(max_length=20, choices=EtatService.choices, default=EtatService.EN_ATTENTE)  # L'état du service
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True)  # Relation avec la catégorie
    date_creation = models.DateTimeField(auto_now_add=True, null=True)
    date_dernier_scraping = models.DateTimeField(null=True, blank=True)  # Date du dernier scraping

    def __str__(self):
        return self.base_url
    



class ConfigurationSchedule(models.Model):

    class Frequency(models.TextChoices):
        DAILY = 'DAILY', 'Chaque jour'
        WEEKLY = 'WEEKLY', 'Chaque semaine'
        MONTHLY = 'MONTHLY', 'Chaque mois'
    
    class DayOfWeek(models.TextChoices):
        MONDAY = 'mon', 'Lundi'
        TUESDAY = 'tue', 'Mardi'
        WEDNESDAY = 'wed', 'Mercredi'
        THURSDAY = 'thu', 'Jeudi'
        FRIDAY = 'fri', 'Vendredi'
        SATURDAY = 'sat', 'Samedi'
        SUNDAY = 'sun', 'Dimanche'

    page = models.OneToOneField(Page, on_delete=models.CASCADE)
    frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.MONTHLY)
    
    hour = models.PositiveIntegerField(null=True, blank=True)
    minute = models.PositiveIntegerField(null=True, blank=True)
    hours = models.PositiveIntegerField(null=True, blank=True)
    minutes = models.PositiveIntegerField(null=True, blank=True)
    day_of_week = models.CharField(max_length=10, choices=DayOfWeek.choices, null=True, blank=True)  # Enum pour les jours de la semaine
    day = models.PositiveIntegerField(null=True, blank=True)  # Pour le jour du mois

    def __str__(self):
        return f"Schedule for {self.page.base_url}: {self.get_frequency_display()}"
    


