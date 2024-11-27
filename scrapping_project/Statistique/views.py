from collections import defaultdict
from django.http import JsonResponse
from django.db.models import Sum
from User_access.views import authenticate_with_keycloak
from scrapping.models import Product
from django.views.decorators.csrf import csrf_exempt



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_top_15_favorites_by_category(request):
    # Obtenir les catégories avec les top 15 produits favoris
    top_categories = Product.objects.filter(nombre_ajout_favoris__gt=0, subcategory__isnull=False) \
        .values('subcategory__name') \
        .annotate(total_favorites=Sum('nombre_ajout_favoris')) \
        .order_by('-total_favorites')[:15]
    
    result = {}
    
    for category in top_categories:
        category_name = category['subcategory__name']
        category_total_favorites = category['total_favorites']
        
        # Obtenir les produits favoris pour chaque catégorie
        products = Product.objects.filter(subcategory__name=category_name, nombre_ajout_favoris__gt=0) \
            .values('nom') \
            .annotate(total_favorites=Sum('nombre_ajout_favoris'))
        
        # Calculer les pourcentages
        products_result = {
            product['nom']: {
                'total_favorites': product['total_favorites'],
                'percentage': (product['total_favorites'] / category_total_favorites) * 100 if category_total_favorites > 0 else 0
            }
            for product in products
        }
        
        result[category_name] = {
            'total_favorites': category_total_favorites,
            'products': products_result
        }
    
    return JsonResponse(result, safe=False)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_top_15_baise_by_category(request):
    # Obtenir les catégories avec les top 15 baisses de prix
    top_categories = Product.objects.filter(nombre_baise_prix__gt=0, subcategory__isnull=False) \
        .values('subcategory__name') \
        .annotate(total_baises=Sum('nombre_baise_prix')) \
        .order_by('-total_baises')[:15]
    
    result = {}
    
    for category in top_categories:
        category_name = category['subcategory__name']
        category_total_baises = category['total_baises']
        
        # Obtenir les produits avec les baisses de prix pour chaque catégorie
        products = Product.objects.filter(subcategory__name=category_name, nombre_baise_prix__gt=0) \
            .values('nom') \
            .annotate(total_baises=Sum('nombre_baise_prix'))
        
        # Calculer les pourcentages
        products_result = {
            product['nom']: {
                'total_baises': product['total_baises'],
                'percentage': (product['total_baises'] / category_total_baises) * 100 if category_total_baises > 0 else 0
            }
            for product in products
        }
        
        result[category_name] = {
            'total_baises': category_total_baises,
            'products': products_result
        }
    
    return JsonResponse(result, safe=False)




@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_top_15_visiteur_by_category(request):
    # Obtenir les catégories avec les top 15 produits visiteurs
    top_categories = Product.objects.filter(nombre_visiteur__gt=0, subcategory__isnull=False) \
        .values('subcategory__name') \
        .annotate(total_visits=Sum('nombre_visiteur')) \
        .order_by('-total_visits')[:15]
    
    result = {}
    
    for category in top_categories:
        category_name = category['subcategory__name']
        category_total_visits = category['total_visits']
        
        # Obtenir les produits visiteurs pour chaque catégorie
        products = Product.objects.filter(subcategory__name=category_name, nombre_visiteur__gt=0) \
            .values('nom') \
            .annotate(total_visits=Sum('nombre_visiteur'))
        
        # Calculer les pourcentages
        products_result = {
            product['nom']: {
                'total_visits': product['total_visits'],
                'percentage': (product['total_visits'] / category_total_visits) * 100 if category_total_visits > 0 else 0
            }
            for product in products
        }
        
        result[category_name] = {
            'total_visits': category_total_visits,
            'products': products_result
        }
    
    return JsonResponse(result, safe=False)





@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN','CLIENT','FOURNISSEUR'])
def get_top_visited_categories(request):
    # Obtenir le nombre total de visites par catégorie
    categories_visits = Product.objects.filter(subcategory__isnull=False) \
        .values('subcategory__name') \
        .annotate(total_visits=Sum('nombre_visiteur')) \
        .order_by('-total_visits')

    # Calculer le total global des visites
    total_visits = sum(item['total_visits'] for item in categories_visits)

    # Préparer les données avec pourcentages
    result = {
        item['subcategory__name']: {
            'total_visits': item['total_visits'],
            'percentage': (item['total_visits'] / total_visits) * 100 if total_visits > 0 else 0
        }
        for item in categories_visits
    }

    return JsonResponse(result, safe=False)










#pour afficher les stats du fournisseur 


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_top_15_favorites_by_site(request, site_name):
    # Obtenir les catégories avec les top 15 produits favoris pour un site spécifique
    top_categories = Product.objects.filter(
        nombre_ajout_favoris__gt=0,
        subcategory__isnull=False,
        site__iexact=site_name  # Comparaison insensible à la casse
    ).values('subcategory__name') \
     .annotate(total_favorites=Sum('nombre_ajout_favoris')) \
     .order_by('-total_favorites')[:15]
    
    result = {}
    
    for category in top_categories:
        category_name = category['subcategory__name']
        category_total_favorites = category['total_favorites']
        
        # Obtenir les produits favoris pour chaque catégorie et site (insensible à la casse)
        products = Product.objects.filter(
            subcategory__name=category_name,
            nombre_ajout_favoris__gt=0,
            site__iexact=site_name  # Comparaison insensible à la casse
        ).values('nom') \
         .annotate(total_favorites=Sum('nombre_ajout_favoris'))
        
        # Calculer les pourcentages
        products_result = {
            product['nom']: {
                'total_favorites': product['total_favorites'],
                'percentage': (product['total_favorites'] / category_total_favorites) * 100 if category_total_favorites > 0 else 0
            }
            for product in products
        }
        
        result[category_name] = {
            'total_favorites': category_total_favorites,
            'products': products_result
        }
    
    return JsonResponse(result, safe=False)





@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_top_15_baise_by_site(request, site_name):
    # Obtenir les catégories avec les top 15 baisses de prix pour un site spécifique
    top_categories = Product.objects.filter(nombre_baise_prix__gt=0, subcategory__isnull=False, site=site_name) \
        .values('subcategory__name') \
        .annotate(total_baises=Sum('nombre_baise_prix')) \
        .order_by('-total_baises')[:15]
    
    result = {}
    
    for category in top_categories:
        category_name = category['subcategory__name']
        category_total_baises = category['total_baises']
        
        # Obtenir les produits avec les baisses de prix pour chaque catégorie et site
        products = Product.objects.filter(subcategory__name=category_name, nombre_baise_prix__gt=0, site=site_name) \
            .values('nom') \
            .annotate(total_baises=Sum('nombre_baise_prix'))
        
        # Calculer les pourcentages
        products_result = {
            product['nom']: {
                'total_baises': product['total_baises'],
                'percentage': (product['total_baises'] / category_total_baises) * 100 if category_total_baises > 0 else 0
            }
            for product in products
        }
        
        result[category_name] = {
            'total_baises': category_total_baises,
            'products': products_result
        }
    
    return JsonResponse(result, safe=False)



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_top_15_visiteur_by_site(request, site_name):
    # Obtenir les catégories avec les top 15 produits visiteurs pour un site spécifique
    top_categories = Product.objects.filter(
        nombre_visiteur__gt=0,
        subcategory__isnull=False,
        site__iexact=site_name  # Comparaison insensible à la casse
    ).values('subcategory__name') \
     .annotate(total_visits=Sum('nombre_visiteur')) \
     .order_by('-total_visits')[:15]
    
    result = {}
    
    for category in top_categories:
        category_name = category['subcategory__name']
        category_total_visits = category['total_visits']
        
        # Obtenir les produits visiteurs pour chaque catégorie et site
        products = Product.objects.filter(
            subcategory__name=category_name,
            nombre_visiteur__gt=0,
            site__iexact=site_name  # Comparaison insensible à la casse
        ).values('nom') \
         .annotate(total_visits=Sum('nombre_visiteur'))
        
        # Calculer les pourcentages
        products_result = {
            product['nom']: {
                'total_visits': product['total_visits'],
                'percentage': (product['total_visits'] / category_total_visits) * 100 if category_total_visits > 0 else 0
            }
            for product in products
        }
        
        result[category_name] = {
            'total_visits': category_total_visits,
            'products': products_result
        }
    
    return JsonResponse(result, safe=False)








@csrf_exempt
def get_top_8_favorites(request):
    # Filtrer et trier les produits par nombre d'ajouts aux favoris, limiter à 8
    products = Product.objects.filter(nombre_ajout_favoris__gt=0).order_by('-nombre_ajout_favoris')[:8]
    
    # Préparer la réponse JSON avec les données des produits
    result = [
        {
            'id': product.id,
            'nom': product.nom,
            'image':product.image,
            'prix': product.prix,
            'site':product.site,
            'prix_regulier':product.prix_regulier,
            'nombre_ajout_favoris': product.nombre_ajout_favoris
        }
        for product in products
    ]
    
    return JsonResponse(result, safe=False)






@csrf_exempt
def get_top_8_visited(request):
    # Filtrer et trier les produits par nombre de visites, limiter à 8
    products = Product.objects.filter(nombre_visiteur__gt=0).order_by('-nombre_visiteur')[:8]
    
    # Préparer la réponse JSON avec les données des produits
    result = [
        {
            'id': product.id,
            'nom': product.nom,
            'image':product.image,
            'prix': product.prix,
            'site':product.site,
            'prix_regulier':product.prix_regulier,
            'nombre_visiteur': product.nombre_visiteur
        }
        for product in products
    ]
    
    return JsonResponse(result, safe=False)

