from User_access.views import authenticate_with_keycloak
from scrapping.models import Favorite, Product
from django.http import JsonResponse  # Ajouter HttpRequest
from django.views.decorators.csrf import csrf_exempt
import json
from django.db import transaction



@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT'])
def add_to_favorites(request):
    try:
        user_id = request.user_id  # Récupère l'ID de l'utilisateur à partir de la requête
        print(f'User ID: {user_id}')
        
        # Imprimer le contenu de la requête pour débogage
        print(f'Request POST data: {request.POST}')
        print(f'Request body: {request.body}')

        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        if not product_id:
            return JsonResponse({'error': 'Product ID is required'}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return JsonResponse({'error': 'Product not found'}, status=404)

        # Vérifiez si le client a déjà un favori
        favorite = Favorite.objects.filter(user_id=user_id, product=product).first()

        if favorite:
            return JsonResponse({'message': 'Product already in favorites'}, status=200)
        else:
            Favorite.objects.create(user_id=user_id, product=product)
            # Incrémenter le nombre de fois que le produit a été ajouté aux favoris
            product.nombre_ajout_favoris += 1
            product.save()
            return JsonResponse({'message': 'Product added to favorites'}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)







@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT'])
def delete_from_favorites(request):
    try:
        user_id = request.user_id  # Récupère l'ID de l'utilisateur à partir de la requête
        print(f'User ID: {user_id}')
        
        # Imprimer le contenu de la requête pour débogage
        print(f'Request method: {request.method}')
        print(f'Request body: {request.body}')

        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        if not product_id:
            return JsonResponse({'error': 'Product ID is required'}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return JsonResponse({'error': 'Product not found'}, status=404)

        try:
            favorite = Favorite.objects.get(user_id=user_id, product=product)
            favorite.delete()
            return JsonResponse({'message': 'Product removed from favorites'}, status=200)
        except Favorite.DoesNotExist:
            return JsonResponse({'error': 'Product not in favorites'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)




@csrf_exempt
@authenticate_with_keycloak(allowed_roles=['CLIENT'])
def delete_all_favorites(request):
    try:
        user_id = request.user_id  # Get the user ID from the request
        
        # Use a transaction to ensure atomicity of the deletion
        with transaction.atomic():
            # Delete all favorite products for this user
            deleted_count, _ = Favorite.objects.filter(user_id=user_id).delete()
        
        return JsonResponse({'message': f'{deleted_count} favorite(s) removed for user {user_id}.'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)