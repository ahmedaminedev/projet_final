from bs4 import BeautifulSoup
import requests
from concurrent.futures import ThreadPoolExecutor
import urllib.parse



def fetch_html(url):
    response = requests.get(url)
    return response.content





def scrape_technopro_product_details(link):
    details = {"site": "TechnoPro"}

    try:
        html_content = fetch_html(link)
        soup = BeautifulSoup(html_content, 'html.parser')

        # Vérifier si le lien du produit est présent
        if soup.find('link', {'rel': 'canonical'}):
            details['link'] = soup.find('link', {'rel': 'canonical'}).get('href')
        else:
            print("Aucun lien de produit trouvé.")
            return None

        product_name = soup.find('h1', {'class': 'page-title'}).text.strip()
        details['nom'] = product_name

        description_div = soup.find('div', {'class': 'product-information'})
        if description_div:
            # Récupération du texte à l'intérieur de la balise div de la description
            description_text = description_div.find('div', {'class': 'product-description'}).text.strip()
            details['description'] = description_text

        # Recherche des balises div contenant les prix actuel et régulier
        price_container = soup.find('div', {'class': 'product-prices'})
        if price_container:
            # Recherche du prix actuel
            current_price_tag = price_container.find('span', {'class': 'current-price'})
            if current_price_tag:
                print(current_price_tag.find('span', {'class': 'product-price'}))
                details['prix'] =details['prix'] = float(current_price_tag.find('span', {'class': 'product-price'}).get('content'))

            # Recherche du prix régulier
            regular_price_tag = price_container.find('span', {'class': 'regular-price'})
            if regular_price_tag:
                details['prix_regulier'] = clean_price_mytek(regular_price_tag.text.strip())/1000
            else:
                details['prix_regulier'] = None

        


        # Recherche de l'image principale du produit
        image_element = soup.find('div', {'class': 'product-cover'})
        if image_element:
            image_tag = image_element.find('img', {'class': 'img-fluid'})
            if image_tag:
                image_link = image_tag.get('data-image-large-src')
                if image_link:
                    details['image'] = image_link


        # Recherche des détails du produit
        details['details'] = {}
        details_section = soup.find('section', {'id': 'product-details-wrapper'})
        if details_section:
            data_sheet = details_section.find('dl', {'class': 'data-sheet'})
            if data_sheet:
                for dt, dd in zip(data_sheet.find_all('dt', {'class': 'name'}), data_sheet.find_all('dd', {'class': 'value'})):
                    cleaned_label = dt.text.strip()
                    cleaned_value = dd.text.strip()
                    details['details'][cleaned_label] = cleaned_value

        return details

    except Exception as e:
        print(f"Une erreur s'est produite lors du scraping des détails du produit {link} : {e}")
        return None



def fetch_technopro_links(url):
    html_content = fetch_html(url)
    soup = BeautifulSoup(html_content, 'html.parser')


    # Récupération des sélecteurs du schéma ou utilisation des valeurs par défaut
    product_container = {'name': 'div', 'class': 'row medium-gutters product-miniature-list-row'}
    product_title = {'name': 'h2', 'class': 'h3 product-title'}

    # Recherche des éléments correspondant aux conteneurs de produits
    product_divs = soup.find_all(**product_container)
    links = []

    # Parcourir chaque conteneur de produit et extraire les liens des titres des produits
    for container in product_divs:
        product_sections = container.find_all(**product_title)
        for tag in product_sections:
            product_links = [link['href'] for link in tag.find_all('a', href=True)]
            # Ajouter les liens uniques à la liste
            links.extend(link for link in product_links if link not in links)

    return links



def scrape_technopro_links(base_url, num_pages):
    links = []

    try:
        with ThreadPoolExecutor() as executor:
            urls = [base_url + str(i) for i in range(2, num_pages + 1)]
            urls.append(base_url.split('?')[0])
            links = list(executor.map(lambda url: fetch_technopro_links(url), urls))
            print(links)
    except Exception as e:
        print(f"An error occurred while scraping technopro links: {e}")

    return [link for sublist in links for link in sublist]






def scrape_tunisianet_links(base_url, page_suffix, num_pages):
    links = []

    try:
        with ThreadPoolExecutor(max_workers=10) as executor:
            urls = [base_url + str(i) + page_suffix for i in range(1, num_pages + 1)]
            links = list(executor.map(fetch_tunisianet_links, urls))

    except Exception as e:
        print(f"An error occurred while scraping tunisianet links: {e}")

    return [link for sublist in links for link in sublist]


def fetch_tunisianet_links(url):
    html_content = fetch_html(url)
    soup = BeautifulSoup(html_content, 'html.parser')

    product_links = []
    product_container = soup.find_all('div', class_='item-product col-xs-12')
    for container in product_container:
        product_link = container.find('a', href=True)
        if product_link:
            product_links.append(product_link['href'])

    return product_links


def scrape_tunisianet_product_details(link):
    try:
        html_content = fetch_html(link)
        soup = BeautifulSoup(html_content, 'html.parser')

        product_details = {
            "site": "tunisianet",
            "nom": soup.select_one("h1[itemprop='name']").text.strip(),
            "description": soup.select_one("div[itemprop='description']").text.strip(),
            "prix": clean_price_tunisanet(soup.select_one("span[itemprop='price']").text) / 1000,
            "image": soup.select_one("img[itemprop='image']").get('src'),
            "details": {},
            "prix_regulier": None  # Initialiser à None par défaut
        }

        # Recherche de l'élément du prix régulier
        regular_price_element = soup.find(class_='regular-price')
        if regular_price_element:
            regular_price = regular_price_element.text.strip()
            print("Prix régulier:", regular_price)
            # Si un prix régulier est trouvé, mettez à jour prix_regulier
            product_details["prix_regulier"] = clean_price_tunisanet(regular_price) / 1000
        else:
            print("Aucun élément de prix régulier trouvé dans le code HTML.")

        features_section = soup.find("section", class_="product-features")
        if features_section:
            features = features_section.find_all("dl", class_="data-sheet")
            for feature in features:
                for dt, dd in zip(feature.find_all("dt", class_="name"), feature.find_all("dd", class_="value")):
                    product_details['details'][dt.text.strip()] = dd.text.strip()

        product_details['link'] = link

        print(f"Product extracted successfully: {product_details}")
        return product_details

    except Exception as e:
        print(f"An error occurred while scraping tunisianet product details: {e}")
        return None





def scrape_mytek_links(base_url, num_pages):
    links = []

    try:
        with ThreadPoolExecutor(max_workers=10) as executor:
            urls = [base_url + str(i) for i in range(2, num_pages + 1)]
            print(base_url.split('?')[0])
            urls.append(base_url.split('?')[0])
            links = list(executor.map(fetch_mytek_links, urls))

    except Exception as e:
        print(f"An error occurred while scraping mytek links: {e}")

    return [link for sublist in links for link in sublist]

def fetch_mytek_links(url):
    html_content = fetch_html(url)
    soup = BeautifulSoup(html_content, 'html.parser')

    product_links = []
    product_container = soup.find_all('li', class_='item product product-item')
    for container in product_container:
        product_link = container.find('a', href=True)
        if product_link:
            product_links.append(product_link['href'])

    return product_links

def scrape_mytek_product_details(link):
    details = {"site": "Mytek"}

    try:
        html_content = fetch_html(link)
        soup = BeautifulSoup(html_content, 'html.parser')

        # Vérifier si le lien du produit est présent
        canonical_link = soup.find('link', {'rel': 'canonical'})
        if canonical_link:
            details['link'] = canonical_link.get('href')
        else:
            print("Aucun lien de produit trouvé.")
            return None

        product_name = soup.find('h1', {'class': 'page-title'})
        if product_name:
            details['nom'] = product_name.text.strip()
        else:
            print("Nom du produit non trouvé.")
            return None

        description = soup.find('meta', {'name': 'description'})
        if description:
            details['description'] = description.get('content').strip()
        
        sidebar_element = soup.find(class_='sidebar sidebar-additional')
        if sidebar_element:
            price_element = sidebar_element.select_one('.price-container .price-wrapper .price')
            if price_element:
                price = price_element.text.strip()
                details['prix'] = clean_price_mytek(price) / 1000
                print("Prix du produit:", details['prix'])
            else:
                details['prix'] = 0
                print("Prix non trouvé, prix par défaut 0.")
            
            old_price1 = sidebar_element.find(class_='old-price')
            if old_price1:
                old_price_text = old_price1.find(class_='price')
                if old_price_text:
                    old_price = old_price_text.text.strip()
                    details['prix_regulier'] = clean_price_mytek(old_price) / 1000
                else:
                    details['prix_regulier'] = None
                    print("Ancien prix non trouvé.")
            else:
                details['prix_regulier'] = None
                print("Ancien prix non trouvé.")
        else:
            details['prix'] = 0
            details['prix_regulier'] = None
            print("Section des prix non trouvée.")
        
        # Extraction de l'image active du produit
        carousel_item_active = soup.find('div', {'class': 'carousel-item active'})
        if carousel_item_active:
            image_element = carousel_item_active.find('img')
            if image_element:
                image_src = image_element.get('src')
                if image_src:
                    if not image_src.startswith('http'):
                        image_src = urllib.parse.urljoin(link, image_src)
                    details['image'] = image_src
                else:
                    details['image'] = None
                    print("L'attribut 'src' de l'image est manquant.")
            else:
                details['image'] = None
                print("Aucun élément d'image trouvé dans l'élément actif du carrousel.")
        else:
            details['image'] = None
            print("Aucun élément actif du carrousel trouvé.")

        # Extraction des détails supplémentaires
        details['details'] = {}
        specs_table = soup.find('table', {'id': 'product-attribute-specs-table'})
        if specs_table:
            rows = specs_table.find_all('tr')
            for row in rows:
                label = row.find('th', {'class': 'col label'})
                value = row.find('td', {'class': 'col data'})
                if label and value:
                    cleaned_label = label.text.strip().lower()
                    cleaned_value = value.text.strip()
                    details['details'][cleaned_label] = cleaned_value

        return details

    except Exception as e:
        print(f"Une erreur s'est produite lors du scraping des détails du produit {link} : {e}")
        return None


def clean_price_technopro(price):
    cleaned_price = price.replace('\xa0', '').replace(",", "").replace(" TND", "")
    return float(cleaned_price) if cleaned_price.isdigit() else None
def clean_price_tunisanet(price):
    cleaned_price = price.replace('\xa0', '').replace(",", "").replace(" DT", "")
    return float(cleaned_price) if cleaned_price.isdigit() else None
def clean_price_mytek(price):
    cleaned_price = ''.join(char for char in price if char.isdigit() or char == ',' or char == '.')
    cleaned_price = cleaned_price.replace(',', '').replace('.', '')  # Supprime les virgules et les points
    return float(cleaned_price) if cleaned_price.isdigit() else None

def clean_value(value):
    cleaned_value = ''.join(char for char in value if char.isdigit() or char == ',')
    return float(cleaned_value.replace(',', '')) if cleaned_value.isdigit() else None

