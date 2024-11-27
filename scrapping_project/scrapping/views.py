from collections import defaultdict
from datetime import datetime, timedelta
from itertools import count
import logging
import threading
from urllib.parse import unquote
from django.utils import timezone
import json
import re
import pytz
from requests.exceptions import RequestException
from django.http import JsonResponse
import requests
from User_access.views import authenticate_with_keycloak
from categories.models import Category, ConfigurationSchedule, Page
from categories.serializers import CategorySerializer, ConfigurationScheduleSerializer, PageSerializer
from scrapping.serializers import PriceHistorySerializer, ProductSerializer
from scrapping.services.extraction_data import scrape_mytek_links, scrape_mytek_product_details, scrape_technopro_links, scrape_technopro_product_details, scrape_tunisianet_links, scrape_tunisianet_product_details
from scrapping.services.organizers import details_pcs  # Assurez-vous d'importer vos modèles Product et Page
from .models import Favorite, Notification, PriceHistory, Product  # Assurez-vous d'importer vos modèles Product et Page
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from .models import Product  # Assurez-vous d'importer votre modèle Product
from sklearn.feature_extraction.text import TfidfVectorizer # type: ignore
from sklearn.metrics.pairwise import cosine_similarity # type: ignore
import numpy as np # type: ignore
from django.db.models import Q
import unidecode
from django.db import transaction
import time  # Importez le module time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from pymongo import MongoClient
from apscheduler.triggers.cron import CronTrigger
from django.db.models import Q, F, Value, IntegerField, Case, When
from django.core.serializers import serialize

# Configuration de MongoDB
mongo_client = MongoClient('mongodb://localhost:27017/')
jobstore = MongoDBJobStore(database='scrapping', collection='apscheduler_jobs', client=mongo_client)

# Configuration du scheduler APScheduler
scheduler = BackgroundScheduler(jobstores={'default': jobstore})



SCRAPING_CANCELLED = {}




def scrape_progress_view(request):
    return render(request, 'scrapping/test.html')


def send_progress(page_id, progress):
    print(f"Progress for page {page_id} === >  {progress}")
    requests.post('http://localhost:5000/progress/', json={'page_id': page_id, 'progress': progress})

        
@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER','ADMIN'])
def scrape_links_and_details_for_page(request, page_id):
    page = Page.objects.get(id=page_id)
    if request and page.etat_service == Page.EtatService.TERMINER:
        return JsonResponse({'error': 'Ce site est deja terminer.'}, status=400)
    
    job_id = f'scrape-{page_id}'
    existing_job = scheduler.get_job(job_id)

    if existing_job:
        print(f"Job avec id {job_id} existe déjà. Suppression...")
        scheduler.remove_job(job_id)
        print(f"Job avec id {job_id} supprimé.")



    if page.category.name.lower() == "pc portable" or page.category.name.lower() == "ordinateur bureau":
        page.date_dernier_scraping = timezone.now()
        page.username_scraper = request.username
        page.save()
    else:
        return JsonResponse({'error': 'la categorie ' +page.category.name+' n est pas disponible maintenant' }, status=400)
    return scrape_links_and_details_for_page2(page_id, request=request)


@csrf_exempt
def scrape_links_and_details_for_page2(page_id, request=None):
    try:
        page = Page.objects.get(id=page_id)
        username = page.username.lower()
        base_url = page.base_url
        page_suffix = page.page_suffix
        num_pages = page.nombre_page_max

        if page.TypePage.Avec_pagination == "Avec_pagination":
            if username == 'tunisianet':
                if base_url.endswith("?page=") and page_suffix:
                    links = scrape_tunisianet_links(base_url, page_suffix, num_pages)
                    scrape_product_details_method = scrape_tunisianet_product_details
                else:
                    return JsonResponse({'error': 'La base_url doit se terminer par "?page=" et le suffixe de page est obligatoire pour Tunisianet'}, status=400)
            elif username == 'mytek':
                if base_url.endswith("?p="):
                    links = scrape_mytek_links(base_url, num_pages)
                    scrape_product_details_method = scrape_mytek_product_details
                else:
                    return JsonResponse({'error': 'La base_url doit se terminer par "?p=" pour Mytek'}, status=400)
            elif username == 'technopro':
                if base_url.endswith("?page="):
                    links = scrape_technopro_links(base_url, num_pages)
                    scrape_product_details_method = scrape_technopro_product_details
                else:
                    return JsonResponse({'error': 'La base_url doit se terminer par "?page=" pour Technopro'}, status=400)
            else:
                return JsonResponse({'error': 'Username not supported'}, status=400)

            new_products = []
            new_product_details = []
            duplicate_product_details = []
            total_links = len(links)
            batch_size = max(total_links // 10, 1)
            last_scrape_time = time.time()

            print(f"Total links to scrape: {total_links}")

            for i, link in enumerate(links):
                if SCRAPING_CANCELLED.get(page_id):
                    SCRAPING_CANCELLED.pop(page_id, None)
                    return JsonResponse({'message': f'Scraping for page {page_id} has been cancelled.'}, status=200)

                try:
                    product_details = scrape_product_details_method(link)
                except RequestException:
                    return JsonResponse({'error': 'Connexion interrompue, veuillez réessayer'}, status=500)

                if product_details:
                    print(f"Scraped details for link {link}: {product_details}")

                    existing_product = Product.objects.filter(
                        nom=product_details['nom'],
                        site=product_details['site'],
                        link=product_details['link']
                    ).first()

                    if existing_product:
                        last_price_history = existing_product.price_history.order_by('-timestamp').first()

                        if last_price_history and last_price_history.new_prix != product_details['prix']:
                            existing_product.update_price(product_details['prix'])
                        else:
                            duplicate_product_details.append(product_details)
                    else:
                        if page.category.name.lower() in ["pc portable", "ordinateur bureau"]:
                            product_details['details'] = details_pcs(product_details['details'])
                        product_details['subcategory'] = page.category
                        product_details['page_id'] = page.id

                        new_products.append(Product(**product_details))
                        new_product_details.append(product_details)
                        print(f"New product details: {product_details}")

                progress = (i + 1) / total_links * 100
                if request:
                    send_progress(page_id, progress)
                print(f"Progress: {progress:.2f}%")

                if (i + 1) % batch_size == 0 or (i + 1) == total_links:
                    with transaction.atomic():
                        Product.objects.bulk_create(new_products)
                        print(f"New products created: {[product.nom for product in new_products]}")

                        product_dict = {f"{product.nom}_{product.description}_{product.link}_{product.site}": product for product in Product.objects.filter(
                            nom__in=[pd['nom'] for pd in new_product_details],
                            description__in=[pd['description'] for pd in new_product_details],
                            link__in=[pd['link'] for pd in new_product_details],
                            site__in=[pd['site'] for pd in new_product_details]
                        )}
                        print(f"Reloaded products: {[product.nom for product in product_dict.values()]}")

                        price_histories = []
                        for pd in new_product_details:
                            product_key = f"{pd['nom']}_{pd['description']}_{pd['link']}_{pd['site']}"
                            product_instance = product_dict.get(product_key)
                            if product_instance:
                                price_histories.append(
                                    PriceHistory(
                                        product=product_instance,
                                        new_prix=pd['prix'],
                                    )
                                )
                        PriceHistory.objects.bulk_create(price_histories)

                    # Ne pas effacer les listes globales ici
                    new_products.clear()

            response_data = {
                'new_products': [pd['nom'] for pd in new_product_details],
                'duplicate_product_details': duplicate_product_details
            }

            return JsonResponse(response_data) if request else response_data

        else:
            return JsonResponse({'error': 'Les pages sans pagination ne sont pas disponibles pour cette page'}, status=400)

    except Page.DoesNotExist:
        return JsonResponse({'error': 'Page not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)




@csrf_exempt
def cancel_scraping(request, page_id):
    if request.method == 'POST':
        try:
            SCRAPING_CANCELLED[page_id] = True
            print(SCRAPING_CANCELLED.get(page_id))
            return JsonResponse({'message': f'Scraping for page {page_id} has been cancelled.'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)








def check_price_drops_and_notify(page_id):
    try:
        page = get_object_or_404(Page, id=page_id)
        print(f"Page ID: {page_id}, Date Dernier Scraping: {page.date_dernier_scraping}")
        price_drops_count = 0
        products_with_price_drops = []

        products = Product.objects.filter(page_id=page_id)
        last_scraping_datetime = page.date_dernier_scraping

        # Convert last_scraping_datetime to an aware datetime
        if timezone.is_naive(last_scraping_datetime):
            last_scraping_datetime = timezone.make_aware(last_scraping_datetime, timezone.get_current_timezone())

        for product in products:
            print(f"Processing product: {product.nom}")
            # Récupérer les historiques de prix pour le produit
            price_histories = product.price_history.order_by('-timestamp')
            serializer = PriceHistorySerializer(price_histories, many=True)
            serialized_data = serializer.data

            # Filtrer les historiques récents ajoutés après la dernière date de scraping
            recent_histories = [
                ph for ph in serialized_data
                if timezone.make_aware(datetime.strptime(ph['timestamp'], '%Y-%m-%dT%H:%M:%S.%fZ'), pytz.UTC) > last_scraping_datetime
            ]
            print(f"Recent Histories for {product.nom}: {recent_histories}")

            if recent_histories:
                last_price = recent_histories[0]['new_prix']
                print(f"Last Price for {product.nom}: {last_price}")

                # Chercher le dernier historique avant la dernière date de scraping
                previous_histories = [
                    ph for ph in serialized_data
                    if timezone.make_aware(datetime.strptime(ph['timestamp'], '%Y-%m-%dT%H:%M:%S.%fZ'), pytz.UTC) <= last_scraping_datetime
                ]
                print(f"Previous Histories for {product.nom}: {previous_histories}")

                if previous_histories:
                    previous_price = previous_histories[0]['new_prix']
                    print(f"Previous Price for {product.nom}: {previous_price}")
                    if last_price < previous_price:
                        price_drop_percentage = ((previous_price - last_price) / previous_price) * 100
                        print(f"Price drop detected for {product.nom}: {price_drop_percentage}%")
                        product.notify_clients_of_price_drop(price_drop_percentage)
                        price_drops_count += 1
                        products_with_price_drops.append(product.nom)
                        # Incrémenter le nombre de baisses de prix
                        product.nombre_baise_prix += 1
                        product.save()
        print(f"Total price drops detected: {price_drops_count}")
        print(f"Products with price drops: {products_with_price_drops}")

        return {
            'price_drops_count': price_drops_count,
            'products_with_price_drops': products_with_price_drops
        }

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return JsonResponse({
            'error': f"Une erreur s'est produite lors de la vérification des baisses de prix pour la page avec l'ID {page_id}. Détails : {str(e)}"
        })


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def update_service_state_to_completed_by_page_id(request, page_id):
    try:
        # Recherche de la page par son ID
        page = get_object_or_404(Page, id=page_id)
        if page.etat_service == Page.EtatService.TERMINER:
            return JsonResponse({'message': 'Ce site est deja terminer.'}, status=400)
    
        # Vérification des autorisations
        if request.role == 'SCRAPPER' and page.username_scraper != request.username:
            return JsonResponse({'error': "Vous n'êtes pas autorisé à effectuer cette opération. Vous n'êtes pas le dernier scraper à avoir effectué le scraping sur cette page."}, status=403)

        # Vérification si la page est liée à des produits
        product_count = Product.objects.filter(page_id=page_id).count()
        if product_count == 0:
            return JsonResponse({'error': f"La page avec l'ID {page_id} n'est liée à aucun produit. Vous devez scraper la page avant de mettre à jour l'état du service."}, status=400)

        bearer_token = request.headers.get('Authorization')
        if not bearer_token:
            return JsonResponse({'error': 'No access token provided'}, status=401)

        # Faire une requête à l'API d'authentification pour récupérer la liste des administrateurs
        response_admins = requests.get('http://localhost:8070/auth-s/api/auth/Admins/')
        if response_admins.status_code != 200:
            return JsonResponse({'error': 'Impossible de vérifier le statut des administrateurs'}, status=500)

        admins_data = response_admins.json()

        # Mettre à jour l'état du service à "TERMINER" pour la page trouvée
        page.etat_service = Page.EtatService.TERMINER
        page.save()

        # Vérifier les baisses de prix et envoyer des notifications
        price_drop_response = check_price_drops_and_notify(page_id)
        price_drops_count = price_drop_response.get('price_drops_count', 0)
        products_with_price_drops = price_drop_response.get('products_with_price_drops', [])

        # Envoyer des notifications aux administrateurs
        notification_message = f"La page {page_id} avec le lien {page.base_url}{page.nombre_page_max} a été mise à jour. {price_drops_count} produits ont eu une baisse de prix."
        for admin in admins_data:
            Notification.objects.create(
                direction_id=admin.get('id'),
                message=notification_message,
                date=timezone.now()
            )

        return JsonResponse({
            'message': f"L'état du service a été mis à jour à 'TERMINER' pour la page avec l'ID {page_id}.",
            'price_drops_count': price_drops_count,
            'products_with_price_drops': products_with_price_drops
        })

    except Page.DoesNotExist:
        return JsonResponse({'error': f"La page avec l'ID {page_id} n'existe pas."}, status=404)

    except Exception as e:
        return JsonResponse({'error': f"Une erreur s'est produite : {e}"}, status=500)



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER','ADMIN'])
def update_service_state_to_encours_by_page_id(request, page_id):
    try:
        # Recherche de la page par son ID
        page = Page.objects.get(id=page_id)
        if request.role == 'SCRAPPER' and page.username_scraper != request.username:
            return JsonResponse({'error': "Vous n'êtes pas autorisé à effectuer cette opération. Vous n'êtes pas le dernier scraper à avoir effectué le scraping sur cette page."}, status=403)

        print(ConfigurationSchedule.objects.filter(page=page))
        # Vérification de l'existence d'une configuration pour la page
        config_exists = ConfigurationSchedule.objects.filter(page=page)
        if config_exists:
            # Vérification si un job de scraping est en cours pour cette page
            job_id = f'scrape-{page_id}'
            job = scheduler.get_job(job_id)
            print(job)
            if job:
                return JsonResponse({'error': "Cette page est actuellement dans un processus planifié de scraping. Veuillez annuler ce processus pour pouvoir supprimer la configuration relier."}, status=400)



        # Mise à jour de l'état du service à "EN_ATTENTE" pour la page trouvée
        page.etat_service = Page.EtatService.EN_ATTENTE
        page.save()

        return JsonResponse({'message': f"L'état du service a été mis à jour à 'EN_ATTENTE' pour la page avec l'ID {page_id}."})

    except Page.DoesNotExist:
        return JsonResponse({'error': f"La page avec l'ID {page_id} n'existe pas."}, status=404)

    except Exception as e:
        return JsonResponse({'error': f"Une erreur s'est produite : {e}"}, status=500)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN','CLIENT','FOURNISSEUR'])
def get_similar_products(request, product_id):
    # Convertir l'ID du produit en entier
    product_id = int(product_id)

    try:
        # Récupérer le produit cible depuis la base de données
        target_product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

    # Obtenez la catégorie du produit cible
    category_id = target_product.subcategory_id

    # Récupérer tous les produits de la base de données, à l'exception du produit cible
    all_products = get_products_of_terminated_pages_by_category(category_id).exclude(id=product_id)

    # Vérifier si des produits ont été récupérés
    if not all_products:
        return JsonResponse({'error': 'No products found'}, status=404)

    # Sérialiser les produits
    target_product_data = ProductSerializer(target_product).data
    all_products_data = [ProductSerializer(product).data for product in all_products]

    # Vérifier si des détails sont disponibles pour les produits
    if not all_products_data:
        return JsonResponse({'error': 'No details available for products'}, status=404)

    # Ajouter les données du produit cible à la liste des produits
    all_products_data.append(target_product_data)

    details_texts = [
        ' '.join([product['nom'],product['description']] + list(product['details'].values())) 
        for product in all_products_data
    ]
    # Utiliser TF-IDF pour représenter les détails sous forme de vecteurs
    vectorizer = TfidfVectorizer()
    details_vectors = vectorizer.fit_transform(details_texts)

    # Calculer les similarités cosinus entre les détails du produit cible et les autres produits
    similarity_scores = cosine_similarity(details_vectors[-1], details_vectors[:-1])

    # Créer un dictionnaire pour regrouper les produits par site
    products_by_site = {}

    # Regrouper les produits par site et filtrer ceux dont le prix est supérieur à 400 par rapport au produit cible
    for idx, score in enumerate(similarity_scores[0]):
        product_data = all_products_data[idx]
        site = product_data['site']
        price_difference = abs(target_product_data['prix'] - product_data['prix'])
        if site not in products_by_site:
            products_by_site[site] = []
        if price_difference <= 250:
            products_by_site[site].append({'product': product_data, 'similarity_score': score})

    # Trier les produits similaires par ordre décroissant de similarité pour chaque site
    for site in products_by_site:
        products_by_site[site].sort(key=lambda x: x['similarity_score'], reverse=True)

    # Récupérer les 4 meilleurs produits similaires pour chaque site
    similar_products = {site: products[:4] for site, products in products_by_site.items()}

    # Renvoyer les produits similaires par site sous forme de réponse JSON
    return JsonResponse({'product_id': product_id, 'similar_products': similar_products})




@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def regrouper_attribut_filter_pc(request, id_categorie):
    if request.method == 'GET':
        try:
            attributs = {
                'processeurs': set(),
                'memoires': set(),
                'disques': set(),
                'cartes_graphiques': set(),
                'refs_cartes_graphiques': set()
            }

            product_list = get_products_of_terminated_pages_by_category(id_categorie)
            all_products = list(product_list.values())  # Convertir les objets de produit en une liste de dictionnaires

            if not all_products:
                return JsonResponse({'error': 'No products found'}, status=404)
            
            try:
                category_name = Category.objects.get(id=id_categorie).name.lower()
            except Category.DoesNotExist:
                return JsonResponse({'error': 'Category not found'}, status=404)

            for product in all_products:
                details = product.get('details', {})
                for key, value in details.items():
                    key_lower = key.lower().strip()
                    value = value.strip()
                    
                    if not value:
                        continue  # Ignorer les chaînes vides
                    
                    if key_lower == "processeur":
                        attributs['processeurs'].add(value)
                    elif key_lower == "memoire":
                        attributs['memoires'].add(value)
                    elif key_lower == "disque dur":
                        splitted_values = value.split("+")
                        for splitted_value in splitted_values:
                            formatted_value = re.sub(r'(\d+)(?<!\s)(\s*(?:Go|To|To\s*SSD|To\s*HDD|eMMC|SSD|HDD))', r'\1 \2', splitted_value)
                            formatted_value = " ".join(formatted_value.split())
                            if formatted_value:
                                attributs['disques'].add(formatted_value.strip())
                    elif key_lower == "carte graphique":
                        attributs['cartes_graphiques'].add(value)
                    elif key_lower == "ref carte graphique":
                        if category_name == "pc portable":
                            # Supprimer 'intel hd' et les espaces superflus
                            value = re.sub(r'intel hd\s+', '', value, flags=re.IGNORECASE).strip()
                            if value:
                                attributs['refs_cartes_graphiques'].add(value.lower())
                        elif category_name == "ordinateur bureau":
                            match = re.search(r'(rtx|gtx)\s*(\d+)', value.lower(), re.IGNORECASE)
                            if match:
                                prefix = match.group(1).lower()
                                number = match.group(2)
                                formatted_value = f"{prefix} {number}"
                                if formatted_value:
                                    attributs['refs_cartes_graphiques'].add(formatted_value)

            # Convertir les sets en listes pour la réponse JSON
            for key, value in attributs.items():
                attributs[key] = sorted(list(value))  # Tri pour une meilleure présentation

            return JsonResponse(attributs)

        except Exception as e:
            return JsonResponse({'error': f"Une erreur s'est produite : {str(e)}"}, status=500)
    else:
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_price_range_by_category(request, id_categorie):
    if request.method == 'GET':
        try:
            product_list = get_products_of_terminated_pages_by_category(id_categorie)
            all_products = list(product_list.values())  # Convertir les objets de produit en une liste de dictionnaires

            if not all_products:
                return JsonResponse({'error': 'No products found'}, status=404)

            prices = []
            
            for product in all_products:
                price = product.get('prix')
                if price is not None:
                    try:
                        # Convertir le prix en float pour le traitement
                        price = float(price)
                        prices.append(price)
                    except ValueError:
                        continue  # Ignorer les prix invalides

            if not prices:
                return JsonResponse({'error': 'No valid prices found'}, status=404)
            
            min_price = min(prices)
            max_price = max(prices)

            return JsonResponse({'min_price': min_price, 'max_price': max_price})

        except Exception as e:
            return JsonResponse({'error': f"Une erreur s'est produite : {str(e)}"}, status=500)
    else:
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)






#filtrer les produits par caracteristique (dans le menu et au debut avec la bar des categories)
@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def search_products(request, id_categorie):
    if request.method == 'GET':
        try:
            print(request.GET)
            # Récupérer les valeurs des paramètres de recherche de l'URL
            processeurs = parse_and_clean_values(request.GET.getlist('processeur'))
            memoires = parse_and_clean_values(request.GET.getlist('memoire'))
            disques_durs = parse_and_clean_values(request.GET.getlist('disque-dur'))
            cartes_graphiques = parse_and_clean_values(request.GET.getlist('carte-graphique'))
            refs_cartes_graphiques = parse_and_clean_values(request.GET.getlist('ref-carte-graphique'))
            gamer = parse_and_clean_values(request.GET.getlist('gamer'))
            prix_min = request.GET.get('prix-min')
            prix_max = request.GET.get('prix-max')

            # Debug: afficher les valeurs récupérées
            print("Processeurs:", processeurs)
            print("Mémoires:", memoires)
            print("Disques durs:", disques_durs)
            print("Cartes graphiques:", cartes_graphiques)
            print("Références cartes graphiques:", refs_cartes_graphiques)
            print("Gamer:", gamer)
            print("Prix min:", prix_min)
            print("Prix max:", prix_max)

            # Récupérer tous les produits pour la catégorie donnée
            products = get_products_of_terminated_pages_by_category(id_categorie)

            # Sérialiser les produits
            serialized_products = ProductSerializer(products, many=True).data

            # Fonction pour filtrer les produits sérialisés
            def filter_serialized_products(products):
                filtered = []
                for product in products:
                    site = product.get('site', '')
                    details = product.get('details', {})
                    prix = product.get('prix', 0)

                    # Vérifier les filtres individuellement dans chaque attribut pertinent
                    matches_filter = (
                        (not processeurs or any(value.lower() in details.get('processeur', '').lower() for value in processeurs)) and
                        (not memoires or any(value.lower() in details.get('memoire', '').lower() for value in memoires)) and
                        (not disques_durs or any(value.lower() in details.get('disque dur', '').lower() for value in disques_durs)) and
                        (not cartes_graphiques or any(value.lower() in details.get('carte graphique', '').lower() for value in cartes_graphiques)) and
                        (not refs_cartes_graphiques or any(value.lower() in details.get('ref carte graphique', '').lower() for value in refs_cartes_graphiques)) and
                        (not gamer or any(value.lower() in details.get('gamer', '').lower() for value in gamer))
                    )

                    if not matches_filter:
                        continue

                    # Appliquer les filtres de prix
                    if prix_min is not None:
                        try:
                            prix_min_val = float(prix_min)
                            if prix < prix_min_val:
                                continue
                        except (ValueError, TypeError):
                            return JsonResponse({'error': 'Valeur de prix min invalide'}, status=400)

                    if prix_max is not None:
                        try:
                            prix_max_val = float(prix_max)
                            if prix > prix_max_val:
                                continue
                        except (ValueError, TypeError):
                            return JsonResponse({'error': 'Valeur de prix max invalide'}, status=400)

                    # Ajouter le produit filtré
                    filtered.append(product)

                return filtered

            # Filtrer les produits sérialisés
            filtered_products = filter_serialized_products(serialized_products)

            # Trier les produits par prix croissant
            sorted_products = sorted(filtered_products, key=lambda x: x.get('prix', 0))

            # Vérifier si des produits ont été trouvés
            if not sorted_products:
                return JsonResponse({'message': 'Aucun produit trouvé'}, status=200)

            # Retourner les produits triés sous forme de réponse JSON
            return JsonResponse({'products': sorted_products})

        except Exception as e:
            print(f"Une erreur s'est produite : {str(e)}")
            return JsonResponse({'error': f"Une erreur s'est produite : {str(e)}"}, status=500)
    else:
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)





def parse_and_clean_values(values):
    """
    Fonction utilitaire pour analyser et nettoyer les valeurs des paramètres de recherche.
    Remplace les tirets par des espaces et stocke les valeurs dans une liste.
    """
    cleaned_values = []
    for value in values:
        for sub_value in value.split(','):
            cleaned_value = sub_value.strip().replace('-', ' ')
            cleaned_values.append(cleaned_value)
    return cleaned_values






#appeler dans categories dans categorie view pour afficher les produits du founisseur tout les produits

def get_produc_of_terminate_pagebyusername(username):
    try:
        # Récupérer les pages du fournisseur avec l'état de service TERMINER
        terminated_pages = Page.objects.filter(etat_service=Page.EtatService.TERMINER, username=username)
        
        # Récupérer les produits liés à ces pages
        products = Product.objects.filter(page_id__in=terminated_pages.values('id'))
        
        return products
    except Exception as e:
        # Gérer les erreurs
        return None


#utiliser par 1
def get_products_of_terminated_pages_by_category(category_id):
    try:
        # Filtrer les pages dont l'état de service est TERMINER et qui appartiennent à la catégorie donnée
        pages = Page.objects.filter(etat_service=Page.EtatService.TERMINER, category_id=category_id)
        
        # Récupérer les produits liés à ces pages
        products = Product.objects.filter(page_id__in=pages.values('id'))
        
        return products
    except Exception as e:
        raise Exception(f"Une erreur s'est produite : {e}")





#1
#menu 
@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN','CLIENT','FOURNISSEUR'])
def get_products_of_terminated_pages_by_category_view(request, id_categorie):
    try:
        products = get_products_of_terminated_pages_by_category(id_categorie)
        product_list = list(products.values())  # Convertir les objets de produit en une liste de dictionnaires
        return JsonResponse({'products': product_list}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


#utiliser pour afficher  au client/fournisseur les categories (dans le menu) les categories qui ont des produit  et pour les categorie final pour que dans le front ils ne peuvent pas consulter que ses categories
@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT','ADMIN','FOURNISSEUR','SCRAPPERE'])
def categories_with_completed_service(request):
    try:
        # Récupérer toutes les catégories qui ont des pages avec l'état de service TERMINER
        all_categories_with_completed_pages = Category.objects.filter(page__etat_service='TERMINER').distinct()
        serialized_categories = CategorySerializer(all_categories_with_completed_pages, many=True).data
        print(serialized_categories)

        # Collecter les IDs des catégories à afficher, y compris les parents
        category_ids_to_include = set()
        for category in all_categories_with_completed_pages:
            current_category = category
            while current_category:
                category_ids_to_include.add(current_category.id)
                current_category = current_category.parent_category

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
                        'categorie': category['name'],
                        '_id': str(category['id']),
                        'parent_category_id': category['parent_category'],
                        'subcategories': children,
                        'is_final_child': is_final_child(category['id'], categories)
                    }
                    if category_data['is_final_child']:
                        category_data['fils_final'] = children
                    tree.append(category_data)
            return tree

        categories_json = build_category_tree(serialized_categories)

        return JsonResponse(categories_json, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def products_count_by_category(request):
    try:
        # Récupérer toutes les catégories qui ont des pages avec l'état de service TERMINER
        all_categories_with_completed_pages = Category.objects.filter(page__etat_service='TERMINER').distinct()
        category_ids_to_include = set()
        
        for category in all_categories_with_completed_pages:
            current_category = category
            while current_category:
                category_ids_to_include.add(current_category.id)
                current_category = current_category.parent_category

        # Récupérer toutes les catégories à inclure
        categories_to_include = Category.objects.filter(id__in=category_ids_to_include).distinct()
        
        # Préparer un dictionnaire pour stocker les produits par catégorie
        products_count_by_category = {}
        
        for category in categories_to_include:
            # Filtrer les pages dont l'état de service est TERMINER pour la catégorie donnée
            pages = Page.objects.filter(etat_service=Page.EtatService.TERMINER, category_id=category.id)
            
            # Récupérer les produits liés à ces pages
            products = Product.objects.filter(page_id__in=pages.values('id'))
            
            # Compter le nombre de produits pour chaque sous-catégorie
            products_count_by_category[category.id] = products.count()

        # Construire un dictionnaire pour les produits totaux par catégorie parent
        parent_products_count = {}
        
        for category in categories_to_include:
            parent_id = category.parent_category.id if category.parent_category else None
            if parent_id:
                if parent_id not in parent_products_count:
                    parent_products_count[parent_id] = 0
                parent_products_count[parent_id] += products_count_by_category.get(category.id, 0)

        # Construire la réponse JSON structurée pour les catégories parents
        result = [
            {
                'categorie': parent_category.name,
                'id': str(parent_category.id),
                'products_count': parent_products_count.get(parent_category.id, 0)
            }
            for parent_category in categories_to_include if parent_category.parent_category is None
        ]

        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



#utiliser pour verifier le nbr de prduits pour chaque pagepour afficher le le boutton consulter(products) de gestion-pages
@csrf_exempt
def get_page_with_product_count(request, page_id):
    try:
        # Récupérer la page associée à l'ID fourni
        page = Page.objects.get(id=page_id)
        
        # Compter les produits associés à cette page
        product_count = Product.objects.filter(page_id=page_id).count()
        
        # Sérialiser la page
        page_serializer = PageSerializer(page)
        
        # Retourner la sérialisation de la page avec le décompte des produits
        return JsonResponse({
            'page': page_serializer.data,
            'product_count': product_count
        })
        
    except Page.DoesNotExist:
        return JsonResponse({'error': 'Page non trouvée'}, status=404)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)





@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN','CLIENT','FOURNISSEUR'])

def product_detail_by_id_and_similar(request, product_id):
    try:
        # Récupérer le produit cible depuis la base de données
        target_product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

    # Sérialiser le produit cible
    target_product_data = ProductSerializer(target_product).data

    # Appeler la fonction get_similar_products pour obtenir les produits similaires
    similar_products_response = get_similar_products(request, product_id)

    if similar_products_response.status_code != 200:
        return similar_products_response

    # Décoder le contenu JSON du JsonResponse
    similar_products_data = json.loads(similar_products_response.content)

    response_data = {
        'product': target_product_data,
        'similar_products': similar_products_data.get('similar_products', {})
    }

    return JsonResponse(response_data, status=200, safe=False)






@csrf_exempt
def product_detail_by_link_and_similar(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        # Récupérer le lien du produit depuis le corps de la requête
        body = json.loads(request.body)
        product_link = body.get('product_link', '')
        if not product_link:
            return JsonResponse({'error': 'Product link is required'}, status=400)

        # Décoder l'URL encodée si nécessaire
        product_link = unquote(product_link)
        print(product_link)
        
        # Récupérer le produit cible depuis la base de données
        target_product = Product.objects.get(link=product_link)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)

    # Sérialiser le produit cible
    target_product_data = ProductSerializer(target_product).data
    print(target_product_data)
    response_data = {
        'product': target_product_data,
    }

    return JsonResponse(response_data, status=200, safe=False)










# Start the scheduler
scheduler.start()

# Your local timezone
local_timezone = pytz.timezone('Europe/Paris')  # Adjust to your local timezone
# Variable globale pour suivre l'état du scraping
scraping_in_progress = {}
# Schedule
def scheduled_task(page_id):
    # Marquer la tâche comme en cours
    scraping_in_progress[page_id] = True
    print(f"Scraping started for page_id: {page_id}")

    try:
        # Appeler la fonction de scraping
        scrape_links_and_details_for_page2(page_id)
        price_drop_results = check_price_drops_and_notify(page_id)
        print(price_drop_results)  # Vous pouvez également enregistrer ces résultats dans un fichier ou les stocker ailleurs
    finally:
        # Marquer la tâche comme terminée
        scraping_in_progress[page_id] = False
        print(f"Scraping finished for page_id: {page_id}")



def start_scraping_schedule(config_id):
    try:
        config = ConfigurationSchedule.objects.get(id=config_id)
        page_id = config.page.id

        # Mettez à jour la date de dernier scraping de la page
        page = get_object_or_404(Page, id=page_id)
        page.date_dernier_scraping = timezone.now()
        page.save()

        # Vérifiez l'état du service de la page
        if page.etat_service == Page.EtatService.EN_ATTENTE:
            return JsonResponse({'error': 'La page doit être terminée pour que vous puissiez la configurer.'}, status=400)
            # Check if a job is currently running

        job_id = f'scrape-{page_id}'

        # Vérifiez si la tâche est déjà planifiée
        existing_job = scheduler.get_job(job_id)
        if existing_job:
            # Remove the existing job if it's already running
            scheduler.remove_job(job_id)

        # Définition du trigger en fonction de la fréquence de la configuration
        start_date = timezone.localtime(timezone.now()).replace(second=0, microsecond=0)
        local_start_date = start_date.astimezone(local_timezone)

        if config.frequency == ConfigurationSchedule.Frequency.DAILY:
            trigger = CronTrigger(hour=config.hour, minute=config.minute, start_date=local_start_date, timezone=local_timezone)
        elif config.frequency == ConfigurationSchedule.Frequency.WEEKLY:
            trigger = CronTrigger(day_of_week=config.day_of_week, hour=config.hour, minute=config.minute, start_date=local_start_date, timezone=local_timezone)
        elif config.frequency == ConfigurationSchedule.Frequency.MONTHLY:
            trigger = CronTrigger(day=config.day, hour=config.hour, minute=config.minute, start_date=local_start_date, timezone=local_timezone)
        else:
            trigger = CronTrigger(hours=config.hours, minutes=config.minutes, start_date=local_start_date, timezone=local_timezone)

        # Ajout de la tâche avec l'identifiant unique
        scheduler.add_job(scheduled_task, trigger, args=[page_id], id=job_id)

        return JsonResponse({'message': f'Scraping schedule updated for page {page_id} with job ID {job_id}'}, status=200)

    except ConfigurationSchedule.DoesNotExist:
        return JsonResponse({'error': f'Configuration schedule with ID {config_id} does not exist.'}, status=404)
    except Page.DoesNotExist:
        return JsonResponse({'error': f'Page with ID {page_id} does not exist.'}, status=404)
    except ValueError as ve:
        return JsonResponse({'error': str(ve)}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



def check_if_scraping_in_progress(page_id):
    return scraping_in_progress.get(page_id, False)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def add_configuration_schedule(request):
    if request.method == 'POST':
        try:
            # Retrieve data
            data = json.loads(request.body.decode('utf-8'))
            page_id = data.get('page_id')
            frequency = data.get('frequency')
            hour = int(data.get('hour', 0))
            minute = int(data.get('minute', 0))
            day_of_week = data.get('day_of_week', None)
            day = int(data.get('day', 0))

            # Validate data
            if not page_id or not frequency:
                return JsonResponse({'error': 'Page ID and frequency are required.'}, status=400)

            page = get_object_or_404(Page, id=page_id)

            if page.etat_service == Page.EtatService.EN_ATTENTE:
                return JsonResponse({'error': 'La page doit être terminée pour que vous puissiez la configurer.'}, status=400)

            # Check if a scraping task is already in progress
            if check_if_scraping_in_progress(page_id):
                return JsonResponse({'error': 'A scraping task is already in progress for this page.'}, status=400)

            job_id = f'scrape-{page_id}'

            now = timezone.localtime()
            config_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

            if frequency == ConfigurationSchedule.Frequency.DAILY:
                config_time = config_time.replace(hour=hour, minute=minute)
            elif frequency == ConfigurationSchedule.Frequency.WEEKLY:
                days = {
                    'mon': 0,
                    'tue': 1,
                    'wed': 2,
                    'thu': 3,
                    'fri': 4,
                    'sat': 5,
                    'sun': 6
                }
                day_number = days.get(day_of_week, 0)
                config_time += timedelta(days=(day_number - now.weekday()) % 7)
                config_time = config_time.replace(hour=hour, minute=minute)
            elif frequency == ConfigurationSchedule.Frequency.MONTHLY:
                config_time = config_time.replace(day=day, hour=hour, minute=minute)

            # Update or create the configuration
            config_schedule, created = ConfigurationSchedule.objects.get_or_create(
                page=page,
                defaults={
                    'frequency': frequency,
                    'hour': hour,
                    'minute': minute,
                    'day_of_week': day_of_week,
                    'day': day
                }
            )

            if not created:
                config_schedule.frequency = frequency
                config_schedule.hour = hour
                config_schedule.minute = minute
                config_schedule.day_of_week = day_of_week
                config_schedule.day = day
                config_schedule.save()

            # Schedule or update the task
            start_scraping_schedule(config_schedule.id)

            return JsonResponse({
                'message': 'Configuration schedule created successfully.',
                'config_schedule_id': config_schedule.id
            }, status=201)

        except Page.DoesNotExist:
            return JsonResponse({'error': 'Page not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)




@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT','FOURNISSEUR'])
def increment_visitors(request, product_id):
    try:
        product = get_object_or_404(Product, id=product_id)
        product.nombre_visiteur += 1
        product.save()        
        return JsonResponse({'message': 'Nombre de visiteurs incrémenté avec succès.'}, status=200)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Produit non trouvé.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def delete_configuration(request, config_id):
    try:
        # Recherche de la configuration par son ID
        config = ConfigurationSchedule.objects.get(id=config_id)
        page_id = config.page.id

        # Annulation du job de scraping s'il est en cours
        job_id = f'scrape-{page_id}'
        job = scheduler.get_job(job_id)
        if job:
            job.remove()
        
        # Suppression de la configuration
        config.delete()


        return JsonResponse({'message': 'La configuration a été supprimée et le processus de scraping en cours a été annulé s\'il existait.'})

    except ConfigurationSchedule.DoesNotExist:
        return JsonResponse({'error': f"La configuration avec l'ID {config_id} n'existe pas."}, status=404)

    except Exception as e:
        return JsonResponse({'error': f"Une erreur s'est produite : {e}"}, status=500)    


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def get_running_jobs(request):
    jobs = scheduler.get_jobs()
    running_jobs = []

    for job in jobs:
        # Essayer de récupérer la configuration associée en utilisant le job ID
        try:
            page_id = job.args[0]  # Assumant que l'ID de la page est passé comme premier argument
            config = ConfigurationSchedule.objects.get(page_id=page_id)
            running_jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                'args': job.args,
                'kwargs': job.kwargs,
                'configuration': {
                    'id': config.id,
                    'page_id': config.page.id,
                    'frequency': config.frequency,
                    'hour': config.hour,
                    'minute': config.minute,


                }
            })
        except ConfigurationSchedule.DoesNotExist:
            # Si aucune configuration n'est trouvée pour ce job, on ajoute quand même le job sans la configuration
            running_jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                'args': job.args,
                'kwargs': job.kwargs,
                'configuration': None
            })

    return JsonResponse({'running_jobs': running_jobs})


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN','CLIENT','FOURNISSEUR'])
def get_price_history(request, product_id):
    # Récupérer le produit par son ID
    product = get_object_or_404(Product, id=product_id)
    
    # Obtenir l'historique des prix, uniquement les nouveaux prix
    history = product.price_history.order_by('timestamp').values('timestamp', 'new_prix')
    
    # Préparer les données pour Chart.js
    data = {
        'dates': [entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S') for entry in history],
        'new_prices': [entry['new_prix'] for entry in history],
    }
    
    return JsonResponse(data)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN', 'CLIENT', 'FOURNISSEUR'])
def get_user_notifications(request, user_id):
    """Retourne les notifications pour un utilisateur donné, triées par date décroissante et le nombre total de notifications non lues."""
    notifications = Notification.objects.filter(direction_id=user_id).order_by('-date')
    notifications_count = notifications.count()
    data = {
        'notifications': list(notifications.values('id', 'message', 'date')),
        'count': notifications_count
    }
    return JsonResponse(data, safe=False)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT','FOURNISSEUR'])
def get_favorites_count(request):
    try:
        user_id = request.user_id  # Récupère l'ID de l'utilisateur
        favorites_count = Favorite.objects.filter(user_id=user_id).count()
        return JsonResponse({'favorites_count': favorites_count}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)




@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT','ADMIN'])
def get_user_favorites(request, user_id):
    # Obtenez tous les produits favoris pour l'utilisateur spécifié
    favorites = Favorite.objects.filter(user_id=user_id).select_related('product')
    
    # Créez une liste de produits avec les détails nécessaires
    product_list = []
    for favorite in favorites:
        product = favorite.product
        product_list.append({
            'id': product.id,
            'nom': product.nom,
            'prix': product.prix,
            'image': product.image,
            'details': product.details,
            'link': product.link
        })
    
    return JsonResponse({'favorites': product_list})


#utiliser pour la fonction de recherche (navbar)

@csrf_exempt
def get_products_of_terminated_pages():
    try:
        # Filtrer les pages dont l'état de service est TERMINER
        pages = Page.objects.filter(etat_service=Page.EtatService.TERMINER)
        
        # Récupérer les produits liés à ces pages
        products = Product.objects.filter(page_id__in=pages.values('id'))
        
        return products
    except Exception as e:
        raise Exception(f"Une erreur s'est produite : {e}")




@csrf_exempt
def get_terminated_products_view(request):
    try:
        # Récupérer les produits associés à ces pages
        products =get_products_of_terminated_pages()

        # Sérialiser les produits avec le serializer existant
        serializer = ProductSerializer(products, many=True)

        # Retourner les produits sérialisés dans une réponse JSON
        return JsonResponse({'products': serializer.data}, status=200)

    except Exception as e:
        # Gérer les erreurs et retourner une réponse JSON d'erreur
        return JsonResponse({'error': f"Une erreur s'est produite : {e}"}, status=500)




@csrf_exempt
def get_products_page(request, page_id):
    try:
        # Récupérer la page associée à l'ID fourni
        page = Page.objects.get(id=page_id)
        products_queryset=Product.objects.filter(page_id=page_id)
        # Compter les produits associés à cette page
        serializer = ProductSerializer(products_queryset, many=True)
        products = serializer.data
        # Sérialiser la page
        page_serializer = PageSerializer(page)
        
        # Retourner la sérialisation de la page avec le décompte des produits
        return JsonResponse({
            'page': page_serializer.data,
            'products': products
        })
        
    except Page.DoesNotExist:
        return JsonResponse({'error': 'Page non trouvée'}, status=404)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)




#recuperer les produits avec les caracteristique ( dans la bar de recherche )
@csrf_exempt
def search_and_group_details_by_key(request):
    try:
        # Récupérer la chaîne de recherche depuis les paramètres GET (si fournie)
        search_string = request.GET.get('search_string', '').strip()
        search_words = set(search_string.lower().split())  # Utiliser un set pour une recherche plus rapide
        print(f"Search string: {search_string}")

        # Récupérer tous les produits des pages TERMINER
        products_queryset = get_products_of_terminated_pages()
        print(f"Total products: {products_queryset.count()}")

        # Sérialiser les produits en JSON
        serializer = ProductSerializer(products_queryset, many=True)
        products_data = serializer.data
        print(f"Serialized products count: {len(products_data)}")

        # Initialiser les variables pour le regroupement des produits
        matched_products = []
        min_price = float('inf')  # Initialiser avec une valeur très élevée
        max_price = float('-inf') # Initialiser avec une valeur très basse
        site_set = set()  # Pour regrouper les sites

        # Initialiser un dictionnaire pour regrouper les détails par clé
        detail_groups = defaultdict(set)

        def contains_all_search_words(text):
            """Vérifie si tous les mots de recherche sont présents dans le texte."""
            text_words = set(text.lower().split())
            return search_words.issubset(text_words)

        # Parcourir tous les produits pour les filtrer (si une chaîne de recherche est fournie)
        for product in products_data:
            nom = product.get('nom', '').lower()
            description = product.get('description', '').lower()

            # Vérifier si le produit contient tous les mots de recherche
            if contains_all_search_words(nom) or contains_all_search_words(description):
                matched_products.append(product)

                # Mettre à jour les prix min et max
                price = product.get('prix')
                if price is not None:
                    try:
                        price = float(price)  # Convertir le prix en float
                        min_price = min(min_price, price)
                        max_price = max(max_price, price)
                    except ValueError:
                        pass  # Ignorer les erreurs de conversion

                # Ajouter le site à l'ensemble des sites
                site = product.get('site', '').strip()
                if site:
                    site_set.add(site)

                # Regrouper les valeurs pour chaque clé dans 'details'
                details = product.get('details', {})
                if isinstance(details, dict):
                    for key, value in details.items():
                        key_lower = key.lower().strip()
                        if value:  # Ignorer les valeurs vides
                            value_stripped = value.strip().replace(' ', '')  # Supprimer les espaces
                            if len(value_stripped) <= 42:
                                detail_groups[key_lower].add(value.strip())

        # Préparer les résultats avec les valeurs les plus fréquentes pour chaque clé
        grouped_details = {key: list(values) for key, values in detail_groups.items() if len(values) >= 3}

        # Structurer la réponse avec les produits, les détails regroupés, les prix min/max et les sites
        response = {
            'products': matched_products,
            'grouped_details': grouped_details if grouped_details else None,
            'min_price': min_price if min_price != float('inf') else None,
            'max_price': max_price if max_price != float('-inf') else None,
            'sites': list(site_set)  # Convertir l'ensemble des sites en liste
        }

        return JsonResponse(response, safe=False)

    except Exception as e:
        print(f"Exception occurred: {str(e)}")  # Afficher l'exception pour le débogage
        return JsonResponse({'error': 'An error occurred'}, status=500)



def clean_string(s):
    """ Nettoyer une chaîne en supprimant les caractères non-alphanumériques et en mettant en minuscules """
    if isinstance(s, str):
        return re.sub(r'[^a-zA-Z0-9]', '', s.lower().strip())
    return s



@csrf_exempt
def update_product_view(request, product_id):
    # Récupérer le produit par ID
    product = get_object_or_404(Product, id=product_id)

    if request.method == 'POST':
        try:
            # Récupérer les données JSON envoyées
            data = json.loads(request.body)

            # Récupérer et valider les champs
            nom = data.get('nom', product.nom)
            description = data.get('description', product.description)
            prix = data.get('prix', product.prix)
            prix_regulier = data.get('prix_regulier', product.prix_regulier)
            image = data.get('image', product.image)

            # Convertir les prix en float si présents
            if prix is not None:
                try:
                    prix = float(prix)
                except ValueError:
                    return JsonResponse({'error': 'Prix non valide'}, status=400)

            if prix_regulier is not None:
                try:
                    prix_regulier = float(prix_regulier)
                except ValueError:
                    return JsonResponse({'error': 'Prix régulier non valide'}, status=400)

            # Mettre à jour les attributs du produit
            product.nom = nom
            product.description = description
            product.prix_regulier = prix_regulier
            product.image = image

            # Mettre à jour le prix si nécessaire
            if prix is not None and prix != product.prix:
                product.update_price(prix)

            product.save()

            # Retourner une réponse JSON avec les nouvelles données
            updated_product_data = ProductSerializer(product).data
            return JsonResponse(updated_product_data, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON invalide'}, status=400)

    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)



@csrf_exempt
def delete_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product.delete()
    return JsonResponse({'message': 'Produit supprimé avec succès'})




@csrf_exempt
def delete_products_by_page(request, page_id):
    try:
        product = Product.objects.filter(page_id=page_id).first()
        if product is None:
            return JsonResponse({'message': 'Aucun produit trouvé pour cette page'}, status=404)
        
        Product.objects.filter(page_id=page_id).delete()
        return JsonResponse({'message': 'Tous les produits de la page ont été supprimés avec succès'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['SCRAPPER', 'ADMIN'])
def delete_page_and_products(request, page_id):
    try:
        # Trouver la page
        page = Page.objects.get(id=page_id)
        
        # Supprimer tous les produits associés à cette page
        products_deleted, _ = Product.objects.filter(page_id=page_id).delete()
        
        # Supprimer la page elle-même
        page.delete()
        
        return JsonResponse({
            'message': 'Page et tous les produits associés ont été supprimés avec succès',
            'products_deleted': products_deleted  # Nombre de produits supprimés
        })
    except Page.DoesNotExist:
        return JsonResponse({'message': 'Page non trouvée'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)