import requests

# URL du service de scrapping via la gateway
url = 'http://localhost:8070/scraping'

# Envoyez une requête GET à l'URL spécifiée
response = requests.get(url)

# Vérifiez le statut de la réponse
if response.status_code == 200:
    # Affichez le contenu de la réponse
    print(response.json())  # Si votre microservice renvoie du JSON
else:
    print("La requête a échoué avec le code :", response.status_code)
