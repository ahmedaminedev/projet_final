import atexit
import re
from django.shortcuts import get_object_or_404
from django.views import View
from rest_framework.decorators import api_view
from rest_framework import viewsets
from rest_framework.response import Response
from django.views.decorators.http import require_POST
from User_access.views import authenticate_with_keycloak
from scrapping.models import Favorite, Notification, PriceHistory, Product
from scrapping.serializers import ProductSerializer
from scrapping.views import get_produc_of_terminate_pagebyusername, scrape_links_and_details_for_page2
from .models import Category, ConfigurationSchedule
from .serializers import CategorySerializer, ConfigurationScheduleSerializer, PageSerializer
from django.http import Http404, JsonResponse, HttpRequest  # Ajouter HttpRequest
import requests
from .models import Page
from django.views.decorators.csrf import csrf_exempt
import json
from django.db import IntegrityError, transaction
from django.utils import timezone
from apscheduler.triggers.cron import CronTrigger
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from pymongo import MongoClient



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER','ADMIN'])
def create_category(request):
    try:
        # Décoder les données JSON de la requête
        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)
        
        serializer = CategorySerializer(data=body_data)
        
        if serializer.is_valid():
            parent_category_id = serializer.validated_data.get('parent_category')
            
            # Vérifier si le parent_category_id a des pages liées
            if parent_category_id:
                pages = Page.objects.filter(category_id=parent_category_id)
                if pages:
                    return JsonResponse({'error': 'Le parent de cette catégorie est lié à des pages. Vous ne pouvez pas créer cette catégorie.'}, status=400)
            
            # Enregistrer la catégorie si la vérification est réussie
            serializer.save()
            
            response_scrapers = requests.get('http://localhost:8070/auth-s/api/auth/Scrapers/')
            if response_scrapers.status_code != 200:
                return JsonResponse({'error': 'Impossible de vérifier le statut des administrateurs'}, status=500)
            
            scrapers_data = response_scrapers.json()
            print(scrapers_data)
            
            # Créer une notification pour chaque scraper
            for scraper in scrapers_data:
                notification_message = f"L'administrateur a ajouté une nouvelle catégorie."
                print("aaaa")
                print(scraper)
                Notification.objects.create(
                    direction_id=scraper.get('id'),
                    message=notification_message,
                    date=timezone.now()
                )
            
            return JsonResponse(serializer.data, status=201)
        
        return JsonResponse(serializer.errors, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return JsonResponse({'error': 'Internal Server Error'}, status=500)





@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def delete_category(request, pk=None):
    try:
        # Récupérer la catégorie spécifiée
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category).data
        print(Category.objects.filter(parent_category=serializer.get('id')))
        # Vérifier s'il y a des sous-catégories
        if Category.objects.filter(parent_category=serializer.get('id')):
            return JsonResponse({'error': 'Cette catégorie a des sous-catégories, vous ne pouvez pas la supprimer.'}, status=400)
        print(Page.objects.filter(category=serializer.get('id')))
        # Vérifier si la catégorie est liée à des pages
        if Page.objects.filter(category=serializer.get('id')):
            return JsonResponse({'error': 'Cette catégorie est liée à des pages, vous ne pouvez pas la supprimer.'}, status=400)
        
        # Supprimer la catégorie
        category.delete()
        return JsonResponse({'message': 'La catégorie a été supprimée avec succès.'}, status=200)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)





@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def list_categories(request):
    queryset = Category.objects.all()
    serializer = CategorySerializer(queryset, many=True)
    return JsonResponse(serializer.data, safe=False)



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def list_pages(request):
    try:
        # Récupérer toutes les pages
        pages = Page.objects.all()

        # Sérialiser les pages
        serializer = PageSerializer(pages, many=True)

        # Retourner les données sérialisées sous forme de JSON
        return JsonResponse(serializer.data, safe=False, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def get_category_by_id(request, category_id):
    try:
        # Récupérer toutes les catégories avec des sous-catégories
        all_categories = Category.objects.all()
        all_categories_dict = {cat.id: cat for cat in all_categories}

        # Collecter les IDs des catégories à inclure, y compris les parents
        category_ids_to_include = set()
        current_category_id = category_id

        while current_category_id:
            category_ids_to_include.add(current_category_id)
            current_category = all_categories_dict.get(current_category_id)
            current_category_id = current_category.parent_category_id if current_category else None

        # Récupérer toutes les catégories à inclure
        categories_to_include = Category.objects.filter(id__in=category_ids_to_include).distinct()
        serialized_categories = CategorySerializer(categories_to_include, many=True).data

        # Déterminer si une catégorie est un "fils final"
        def is_final_child(category_id, categories):
            for category in categories:
                if category['parent_category'] == category_id:
                    return False
            return True

        # Construire la réponse JSON structurée
        def build_category_tree(categories, parent_id=None):
            tree = []
            for category in categories:
                if category['parent_category'] == parent_id:
                    children = build_category_tree(categories, category['id'])
                    category_data = {
                        'category': category['name'],
                        'id': str(category['id']),
                        'parent_category_id': category['parent_category'],
                        'subcategories': children,
                        'is_final_child': is_final_child(category['id'], categories)
                    }
                    if category_data['is_final_child']:
                        category_data['final_children'] = children
                    tree.append(category_data)
            return tree

        categories_json = build_category_tree(serialized_categories)

        return JsonResponse(categories_json, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Configuration de la connexion MongoDB
# Configuration de MongoDB
mongo_client = MongoClient('mongodb://localhost:27017/')
jobstore = MongoDBJobStore(database='scrapping', collection='apscheduler_jobs', client=mongo_client)

# Configuration du scheduler APScheduler
scheduler = BackgroundScheduler(jobstores={'default': jobstore})

def close_mongo_connection():
    mongo_client.close()

atexit.register(close_mongo_connection)
scheduler.start()









@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER','ADMIN'])
def assigner_page(request, user_id, category_id):
    if request.method == 'POST':
        try:
            bearer_token = request.headers.get('Authorization')
            # Vérifier si le jeton d'accès est présent
            if not bearer_token:
                return JsonResponse({'error': 'No access token provided'}, status=401)

            headers = {'Authorization': bearer_token}
            response = requests.get(f'http://localhost:8070/auth-s/api/auth/Fournisseur/find/{user_id}/', headers=headers)
            print("code  ", response.status_code)
            # Vérifier si la demande a réussi
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to fetch user data from Spring Boot'}, status=response.status_code)
            print(response.json())
            user_data = response.json()
            if not user_data:
                return JsonResponse({'error': 'User data not found or malformed'}, status=404)

            etat_confirmation = user_data.get('etatConfirmation')
            if not etat_confirmation:
                return JsonResponse({'error': 'etat_confirmation not found in user data'}, status=404)
            elif etat_confirmation != 'CONFIRMEE':
                return JsonResponse({'error': 'admin n a pas encore confirmer ce site'}, status=404)

            username = user_data.get('username')
            if not username:
                return JsonResponse({'error': 'Username not found in user data'}, status=404)


            print(Category.objects.filter(parent_category=category_id))
            if Category.objects.filter(parent_category=category_id):
                return JsonResponse({'error': 'cette categorie a des fils vous ne pouvez pas assigner une page acette categorie'}, status=404)

            # Récupérer l'ID et le nom d'utilisateur du scraper connecté
            scraper_username = request.username

            # Analyser le corps de la requête JSON
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)

            # Extraire les données de la requête JSON
            nombre_page_max = body_data.get('nombre_page_max')
            base_url = body_data.get('base_url')
            description = body_data.get('description')
            page_suffix = body_data.get('page_suffix')
            print(Page.objects.filter(id_fournisseur=user_id, base_url=base_url))

            # Validation des données
            if not isinstance(nombre_page_max, int) or nombre_page_max < 0:
                return JsonResponse({'error': 'Le nombre de pages maximum doit être un entier non négatif.'}, status=400)
            if not base_url or not re.match(r'^https?:\/\/', base_url):
                return JsonResponse({'error': 'L\'URL de base est obligatoire et doit être valide.'}, status=400)


            # Vérifier si la base_url est unique pour le fournisseur
            if Page.objects.filter(id_fournisseur=user_id, base_url=base_url):
                return JsonResponse({'error': 'Base URL existe dans les pages confirmee ou en attente vous ne pouvez pas ajouter deux pages avec la meme base'}, status=400)

            # Créer la page avec la catégorie associée et les détails du scraper connecté
            new_page = Page.objects.create(
                id_fournisseur=user_id,
                username=username,
                username_scraper=scraper_username,
                nombre_page_max=nombre_page_max,
                base_url=base_url,
                description=description,
                page_suffix=page_suffix,
                category_id=category_id,
            )

            return JsonResponse({'message': 'Page créée et assignée avec succès'}, status=201)
        except Exception as e:
            import traceback
            print(f"Une erreur s'est produite lors de l'assignation de la page : {str(e)}")
            print(traceback.format_exc())  # Affiche la trace de la pile pour plus de détails
            return JsonResponse({'error': 'Internal Server Error'}, status=500)

    else:
        return JsonResponse({'message': 'Méthode non autorisée'}, status=405)



#verifcation pour la suppression ou update fournisseur dans micro service auth
#affichage pour le fournisseur ses
@csrf_exempt
def produits_fournisseur_list(request, id_fournisseur):
    if request.method == 'GET':
        try:
            # Récupérer les produits du fournisseur depuis Spring Boot
            response = requests.get(f'http://localhost:8070/auth-s/api/auth/Fournisseur/find/{id_fournisseur}/')
            
            # Vérifier si la demande a réussi
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to fetch product data from Spring Boot'}, status=response.status_code)

            fournisseur = response.json()
            
            if not fournisseur:
                return JsonResponse({'error': 'Fournisseur not found or malformed'}, status=404)

            # Récupérer les détails des produits du fournisseur
            username = fournisseur.get('username')
            if not username:
                return JsonResponse({'message': 'Ce fournisseur n\'a aucun produit'}, status=200)
            else:
                
                products = get_produc_of_terminate_pagebyusername(username)
                serializer = ProductSerializer(products, many=True)
        
                # Retourner les produits sous forme de JSON
                return JsonResponse({'products': serializer.data}, status=200)


        except Exception as e:
            print(f"Une erreur s'est produite lors de la récupération des produits : {str(e)}")
            return JsonResponse({'error': 'Internal Server Error'}, status=500)
    else:
        return JsonResponse({'message': 'Méthode non autorisée'}, status=405)



#supprime la page et ses produits utiliser par spring boot dans la suppression fournisseur 
@csrf_exempt
def delete_page_products_username_by_admin(request, username):
    if request.method == 'DELETE':
        try:
            with transaction.atomic():
                # Récupérer toutes les pages associées à l'utilisateur
                pages = Page.objects.filter(username=username)
                if not pages:
                    return JsonResponse({'error': 'Aucune pageeee trouvée pour la page'}, status=404)

                # Supprimer toutes les pages, leurs produits associés et leurs schedules
                for page in pages:
                    # Stopper et supprimer les schedules associés
                    stop_and_delete_schedules_for_page(page.id)

                    # Supprimer les produits associés à la page
                    products = Product.objects.filter(page_id=page.id)
                    for product in products:
                        # Supprimer les historiques de prix associés au produit
                        PriceHistory.objects.filter(product=product).delete()

                        # Supprimer les favoris associés au produit
                        Favorite.objects.filter(product=product).delete()

                        # Supprimer le produit lui-même
                        product.delete()

                    # Supprimer la page elle-même
                    page.delete()

                return JsonResponse({'message': f'Toutes les pages, configurations et produits associés pour {username} ont été supprimés avec succès'}, status=200)

        except Page.DoesNotExist:
            return JsonResponse({'error': f'Aucune page trouvée pour {username}'}, status=404)

        except Exception as e:
            print(f"Une erreur s'est produite lors de la suppression des pages et produits : {str(e)}")
            return JsonResponse({'error': f"Internal Server Error: {str(e)}"}, status=500)

    else:
        return JsonResponse({'message': 'Méthode non autorisée'}, status=405)


#supprime la page et ses produits utiliser la suppression de page et ses produits
@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER','ADMIN'])
def delete_page_products_username_by_admin2(request, username):
    if request.method == 'DELETE':
        try:
            with transaction.atomic():
                # Récupérer toutes les pages associées à l'utilisateur
                pages = Page.objects.filter(username=username)
                if not pages:
                    return JsonResponse({'error': 'Aucune pageeee trouvée pour la page'}, status=404)

                # Supprimer toutes les pages, leurs produits associés et leurs schedules
                for page in pages:
                    # Stopper et supprimer les schedules associés
                    stop_and_delete_schedules_for_page(page.id)

                    # Supprimer les produits associés à la page
                    products = Product.objects.filter(page_id=page.id)
                    for product in products:
                        # Supprimer les historiques de prix associés au produit
                        PriceHistory.objects.filter(product=product).delete()

                        # Supprimer les favoris associés au produit
                        Favorite.objects.filter(product=product).delete()

                        # Supprimer le produit lui-même
                        product.delete()

                    # Supprimer la page elle-même
                    page.delete()

                return JsonResponse({'message': f'Toutes les pages, configurations et produits associés pour {username} ont été supprimés avec succès'}, status=200)

        except Page.DoesNotExist:
            return JsonResponse({'error': f'Aucune page trouvée pour {username}'}, status=404)

        except Exception as e:
            print(f"Une erreur s'est produite lors de la suppression des pages et produits : {str(e)}")
            return JsonResponse({'error': f"Internal Server Error: {str(e)}"}, status=500)

    else:
        return JsonResponse({'message': 'Méthode non autorisée'}, status=405)



#  methode utiliser par le scraper pour supprimer les produits de la page 
@csrf_exempt
def delete_page_products_username_by_scraper(request, page_id):
    if request.method == 'DELETE':
        try:
            # Récupérer la page associée à l'utilisateur
            page = Page.objects.get(id=page_id)
            if not page:
                return JsonResponse({'error': 'Aucune page trouvée pour la page'}, status=404)

            # Vérifier si la page est en état terminé
            if page.etat_service == 'EN_ATTENTE':
                with transaction.atomic():
                    # Stopper et supprimer les schedules associés
                    stop_and_delete_schedules_for_page(page.id)

                    # Supprimer les produits associés à la page
                    products = Product.objects.filter(page_id=page_id)
                    for product in products:
                        PriceHistory.objects.filter(product=product).delete()
                        product.delete()
                    
                    # Supprimer la page elle-même
                    page.delete()
                
                return JsonResponse({'message': 'Page, configurations et produits associés supprimés avec succès'}, status=200)
            else:
                return JsonResponse({'error': 'La page n\'est pas dans un état en attente, suppression annulée'}, status=400)

        except Page.DoesNotExist:
            return JsonResponse({'error': 'Page non trouvée'}, status=404)

        except Exception as e:
            print(f"Une erreur s'est produite lors de la suppression de la page : {str(e)}")
            return JsonResponse({'error': f"Internal Server Error: {str(e)}"}, status=500)
    else:
        return JsonResponse({'message': 'Méthode non autorisée'}, status=405)
    

def stop_and_delete_schedules_for_page(page_id):
    job_id = f'scrape-{page_id}'
    job = scheduler.get_job(job_id)
    if job:
        job.remove()
    ConfigurationSchedule.objects.filter(page_id=page_id).delete()





@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER','ADMIN'])
def getcount_produit_of_page(request, page_id):
    try:
        # Récupérer la page par son id
        page = Page.objects.get(id=page_id)

        # Récupérer tous les produits associés à la page
        products = Product.objects.filter(page_id=page_id)

        # Retourner le nombre de produits trouvés
        return JsonResponse({'count': products.count()}, status=200)

    except Page.DoesNotExist:
        return JsonResponse({'error': 'Page non trouvée'}, status=404)

    except Exception as e:
        # Gérer toute autre exception
        print(f"Une erreur s'est produite : {str(e)}")
        return JsonResponse({'error': f"Internal Server Error: {str(e)}"}, status=500)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def edit_page(request, page_id):
        try:
            # Récupérer les données de la requête JSON
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)

            # Vérifier que la page existe
            try:
                page = Page.objects.get(id=page_id)
            except Page.DoesNotExist:
                return JsonResponse({'error': 'Page not found'}, status=404)

            # Vérifier l'état de la page
            if page.etat_service != Page.EtatService.EN_ATTENTE:
                return JsonResponse({'error': 'Vous devez changer l etat de la page.'}, status=400)

            # Extraire les données de la requête JSON
            nombre_page_max = body_data.get('nombre_page_max')
            base_url = body_data.get('base_url')
            page_suffix = body_data.get('page_suffix')
            description = body_data.get('description')
            Type = body_data.get('Type')

            # Validation des données
            if nombre_page_max is not None:
                if not isinstance(nombre_page_max, int) or nombre_page_max < 0:
                    return JsonResponse({'error': 'Le nombre de pages maximum doit être un entier non négatif.'}, status=400)
                page.nombre_page_max = nombre_page_max

            if base_url is not None:
                if not re.match(r'^https?:\/\/', base_url):
                    return JsonResponse({'error': 'L\'URL de base doit être valide.'}, status=400)
                # Vérifier si la base_url est unique pour le fournisseur
                if Page.objects.exclude(id=page_id).filter(base_url=base_url, id_fournisseur=page.id_fournisseur):
                    return JsonResponse({'error': 'Base URL existe déjà pour ce fournisseur.'}, status=400)
                page.base_url = base_url

            if page_suffix is not None:
                page.page_suffix = page_suffix

            if description is not None:
                page.description = description

            if Type is not None:
                if Type not in dict(Page.TypePage.choices):
                    return JsonResponse({'error': 'Type invalide.'}, status=400)
                page.Type = Type

            # Sauvegarder les modifications
            page.save()

            return JsonResponse({'message': 'Page modifiée avec succès'}, status=200)
        except Exception as e:
            import traceback
            print(f"Une erreur s'est produite lors de la modification de la page : {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({'error': 'Internal Server Error'}, status=500)





@csrf_exempt
def get_pages_by_scraper(request, username_scraper):
    """
    Récupère toutes les pages associées à un username_scraper et les retourne en JSON.
    """
    try:
        # Vérifie si la méthode de la requête est GET
        if request.method == 'GET':
            # Récupère toutes les pages filtrées par username_scraper
            pages = Page.objects.filter(username_scraper=username_scraper).order_by('-date_dernier_scraping')
            serializer = PageSerializer(pages, many=True)
            return JsonResponse(serializer.data, safe=False, status=200)
        else:
            return JsonResponse({"error": "Méthode non autorisée"}, status=405)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)