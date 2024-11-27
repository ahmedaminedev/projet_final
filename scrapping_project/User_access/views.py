# decorators.py
from django.http import JsonResponse
import requests
from functools import wraps

def authenticate_with_keycloak(allowed_roles=[]):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            try:
                print("aaa")
                bearer_token = request.headers.get('Authorization')
                if not bearer_token:
                    return JsonResponse({'error': 'No access token provided'}, status=401)

                headers = {'Authorization': bearer_token}
                response = requests.get(f'http://localhost:8070/auth-s/api/auth/check-login', headers=headers)
                print(response)
                if response.status_code != 200:
                    return JsonResponse({'error': 'Failed to fetch user data from Spring Boot'}, status=response.status_code)

                user_data = response.json()
                if not user_data:
                    return JsonResponse({'error': 'User data not found or malformed'}, status=404)

                role = user_data.get('role')
                if not role:
                    return JsonResponse({'error': 'Role not found in user data'}, status=404)

                if role not in allowed_roles:
                    return JsonResponse({'error': 'You are not authorized to access this resource'}, status=403)
                
                
                request.role=user_data.get('role')
                request.user_id = user_data.get('id')  # Assuming user ID is present in the user_data
                request.username=user_data.get('username')
                print(user_data)

                return view_func(request, *args, **kwargs)
            except Exception as e:
                print(f"An error occurred while checking user authentication: {str(e)}")
                return JsonResponse({'error': 'Internal Server Error'}, status=500)

        return wrapper
    return decorator
