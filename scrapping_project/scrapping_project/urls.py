"""
URL configuration for scrapping_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from urllib.parse import quote_plus
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from Client.views import add_to_favorites, delete_all_favorites, delete_from_favorites
from Statistique.views import get_top_15_baise_by_category, get_top_15_baise_by_site, get_top_15_favorites_by_category, get_top_15_favorites_by_site, get_top_15_visiteur_by_category, get_top_15_visiteur_by_site, get_top_8_favorites, get_top_8_visited, get_top_visited_categories
from categories.views import assigner_page, create_category, delete_category, delete_page_products_username_by_admin, delete_page_products_username_by_admin2, delete_page_products_username_by_scraper, edit_page, get_category_by_id, get_pages_by_scraper, list_categories, list_pages, produits_fournisseur_list
from scrapping.views import  add_configuration_schedule, cancel_scraping, categories_with_completed_service, delete_configuration, delete_page_and_products, delete_product, delete_products_by_page, get_favorites_count, get_page_with_product_count, get_price_history, get_price_range_by_category, get_products_of_terminated_pages, get_products_of_terminated_pages_by_category_view, get_products_page, get_running_jobs, get_terminated_products_view, get_user_favorites, get_user_notifications, increment_visitors, product_detail_by_id_and_similar, product_detail_by_link_and_similar, products_count_by_category, regrouper_attribut_filter_pc,  scrape_links_and_details_for_page, scrape_progress_view, search_and_group_details_by_key, search_products, update_product_view,update_service_state_to_completed_by_page_id,update_service_state_to_encours_by_page_id,get_similar_products

# settings.py




router = DefaultRouter()
urlpatterns = [
        path('scraping/delete-page/<int:page_id>/', delete_page_and_products, name='delete_page_and_products'),

    path('scraping/pages/scraper/<str:username_scraper>/', get_pages_by_scraper, name='get_pages_by_scraper'),

    path('scraping/product/update/<int:product_id>/', update_product_view, name='update_product'),
  path('scraping/product/delete_product_by_Id/<int:product_id>/', delete_product, name='delete_product'),
    path('scraping/product/delete_all_products_by_page/<int:page_id>/', delete_products_by_page, name='delete_products_by_page'),

  path('scraping/api/categories/create/', create_category, name='create_category'),
    path('scraping/api/categories/delete/<int:pk>/', delete_category, name='delete_category'),
    path('scraping/api/categories/', list_categories, name='list_categories'),
    path('scraping/api/pages/', list_pages, name='list_pages'),

 path('scraping/api/pages/edit/<int:page_id>/', edit_page, name='edit_page'),

    path('scraping/api/getcategorie_byid/<int:category_id>/', get_category_by_id, name='get_category_by_id'),

  path('scraping/add-configuration/', add_configuration_schedule, name='add_configuration'),
    path('scraping/delete-configuration/<int:config_id>/',delete_configuration , name='cancel_scraping_schedule'),

    path('scraping/cancel-scraping/<int:page_id>/', cancel_scraping, name='cancel_scraping'),


    path('scraping/product/<int:product_id>/details_and_similar/', product_detail_by_id_and_similar, name='product_detail_by_id_and_similar'),

    path('scraping/product/link/details_and_similar_by_link/', product_detail_by_link_and_similar, name='product_detail_by_link_and_similar'),

    path('scraping/product/<int:product_id>/price-history/', get_price_history, name='get_price_history'),
    path('scraping/notifications/<int:user_id>/', get_user_notifications, name='get_user_notifications'),

    path('scraping/filter/categorie/<int:id_categorie>/', regrouper_attribut_filter_pc, name='regrouper_attribut_filter_pc'),

    path('scraping/range/min/max/categorie/<int:id_categorie>/', get_price_range_by_category, name='get_price_range_by_category'),

#methode affiche les produits du menu
    path('scraping/getprod/categorie/<int:id_categorie>/', get_products_of_terminated_pages_by_category_view, name='get_products_of_terminated_pages'),


#methode de recherche(bar de rech)
    path('scraping/getproduct/', get_terminated_products_view, name='getp'),

#methode affiche les produit au admins
    path('scraping/getproduct/Admins/<int:page_id>/', get_products_page, name='getp'),



    path('scraping/getproduct/search/', search_and_group_details_by_key, name='search_and_group_details_by_key'),

    path('scraping/progress_view/', scrape_progress_view, name='scrape_progress_view'),

    path('scraping/listes/categorie/<int:id_categorie>/test/',search_products, name='tests'),

    path('scraping/similar/<int:product_id>/', get_similar_products, name='get_similar_products'),

    #permet le scraper de modifier l'etat de la page cible (id) dans le cas ou son code different 
    path('scraping/update/terminer/service/page/<int:page_id>/', update_service_state_to_completed_by_page_id, name='update_service_state_page_id'),


    path('scraping/get_running_jobs/service/page/', get_running_jobs, name='get_running_jobs'),

    #permet le scraper de modifier "les" etats des page avec le meme methode de scrapingt 
    path('scraping/update/attente/service/page/<int:page_id>/', update_service_state_to_encours_by_page_id, name='update_service_state_page_id'),

    #id_fournisseur
    # Ajouter l'URL de l'API de catégories en incluant les URL du routeur

    path('scraping/update_page_products_username/<str:username>/',delete_page_products_username_by_admin , name='delete_page_products_username_by_admin'),
   
     path('scraping/delete/page/<str:username>/',delete_page_products_username_by_admin2 , name='delete_page_products_username_by_admin'),
  
   
    path('scraping/delete_page_products_username_by_scraper/scraper/<int:page_id>/',delete_page_products_username_by_scraper, name='delete_page_products_username_by_scraper'),

    #methode pour verifier l'existance des produits dans fournisseurs pour tester avant supprimer dans spring boot
    path('scraping/fournisseurs_produits_list/<int:id_fournisseur>/', produits_fournisseur_list, name='produits_fournisseur_list'),
    path('scraping/categories/completed/', categories_with_completed_service, name='categories_completed'),

    path('scraping/product/categories/completed/count/', products_count_by_category, name='products_count_by_category'),

    path('scraping/count/product/page/<int:page_id>/', get_page_with_product_count, name='getcount_produit_of_page'),


    #creer  page une page et inserer au fournisseur et a categorie
    path('scraping/creer_page/fournisseur/<int:user_id>/category/<int:category_id>/', assigner_page, name='creer_page'),


    # Vos autres URL existantes 
    path('scraping/scrape_page/<int:page_id>/', scrape_links_and_details_for_page, name='scraping'),

    path('scraping/add_to_favorites/', add_to_favorites, name='add_to_favorites'),

path('scraping/favorites_count/', get_favorites_count, name='get_favorites_count'),
    path('scraping/user/<int:user_id>/favorites/', get_user_favorites, name='user_favorites'),

    path('scraping/delete_from_favorites/', delete_from_favorites, name='delete_from_favorites'),
    path('scraping/favorites/delete_all/', delete_all_favorites, name='delete_all_favorites'),

    path('scraping/increment_visitors/<int:product_id>/', increment_visitors, name='increment_visitors'),

    path('scraping/api/top-15-favorites-by-category/', get_top_15_favorites_by_category, name='top-15-favorites-by-category'),

        path('scraping/api/get_top_8_favorites/', get_top_8_favorites, name='get_top_8_favorites'),
    path('scraping/api/get_top_8_visited/', get_top_8_visited, name='get_top_8_visited'),

    path('scraping/api/top_15_baise_by_category/', get_top_15_baise_by_category, name='top_15_baise_by_category'),
    path('scraping/api/top_15_visiteur_by_category/', get_top_15_visiteur_by_category, name='top_15_visiteur_by_category'),

    path('scraping/api/top_visited_categories/', get_top_visited_categories, name='get_top_visited_categories'),


     # Route pour les produits favoris par site
    path('scraping/top-favorites/<str:site_name>/', get_top_15_favorites_by_site, name='top_favorites_by_site'),
    
    # Route pour les baisses de prix par site
    path('scraping/top-price-drops/<str:site_name>/', get_top_15_baise_by_site, name='top_baise_by_site'),
    
    # Route pour les visiteurs par site
    path('scraping/top-visits/<str:site_name>/',get_top_15_visiteur_by_site, name='top_visits_by_site'),

]
