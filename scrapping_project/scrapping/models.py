from django.utils import timezone
from django.db import models
from categories.models import Category, Page

class Product(models.Model):
    id = models.BigAutoField(primary_key=True)  # ID auto-incrémenté
    site = models.CharField(max_length=100)
    nom = models.CharField(max_length=200)
    description = models.TextField()
    prix = models.FloatField(null=True, blank=True)
    prix_regulier = models.FloatField(null=True, blank=True, default=None)  # Nouveau champ pour le prix régulier
    image = models.URLField(null=True, blank=True)
    details = models.JSONField(null=True, blank=True)
    link = models.URLField()
    subcategory = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True, related_name='sub_products')
    page_id = models.IntegerField(null=True, blank=True)  # ID de la page à partir de laquelle le produit a été scrapé
    nombre_visiteur = models.IntegerField(default=0)
    nombre_ajout_favoris = models.IntegerField(default=0)
    nombre_baise_prix = models.IntegerField(default=0)
    def update_price(self, new_prix):
        # Add new entry to PriceHistory
        PriceHistory.objects.create(
            product=self,
            new_prix=new_prix,
        )
        # Update the product's price
        self.prix = new_prix
        self.save()



    def notify_clients_of_price_drop(self, price_drop_percentage):
        favorites = self.favorited_by.all()
        for favorite in favorites:
            user_id = favorite.user_id
            message = f"Vous avez le produit '{self.nom}' qui a eu une baisse de {price_drop_percentage:.2f}%. Veuillez consulter vos favoris."
            Notification.objects.create(
                direction_id=user_id,
                message=message,
                date=timezone.now()
            )

    def __str__(self):
        return self.nom


class PriceHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_history')
    old_prix = models.FloatField(null=True, blank=True, default=None)
    new_prix = models.FloatField(null=True, blank=True, default=None)
    timestamp = models.DateTimeField(auto_now_add=True)

        

class Favorite(models.Model):
    user_id = models.IntegerField()
    product = models.ForeignKey('scrapping.Product', on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user_id', 'product')

    def __str__(self):
        return f"User {self.user_id} - {self.product.nom}"
    

class Notification(models.Model):
    direction_id = models.IntegerField()  # ID de l'utilisateur qui reçoit la notification
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Notification from to {self.direction_id} on {self.date}'


