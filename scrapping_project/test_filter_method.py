import json


from scrapping.models import Product


def display_product_details(product):
    details = product.details
    if details:
        print("Product Details:")
        for key, value in details.items():
            print(f"{key}: {value}")
    else:
        print("No details available for this product.")
product = Product.objects.get(id=1)  # Remplacez 1 par l'ID du produit que vous souhaitez afficher
display_product_details(product)
