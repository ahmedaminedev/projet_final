from datetime import datetime, timedelta
import re
from requests.exceptions import RequestException
from django.http import JsonResponse

import unidecode



def details_pcs(details):
    updated_details = {}
    for key, value in details.items():
        if key.lower() in ["processeur", "cpu"]:
            updated_details['processeur'] = value.lower()
        elif key.lower() in ["memoire", "mémoire", "mémoire:"]:
            updated_details['memoire'] = value.lower()
        elif key.lower() in ["disque_dur", "disque dur", "stockage"]:
            disques = set()
            value = value.lower()
            splitted_values = value.split("+")
            for splitted_value in splitted_values:
                formatted_value = re.sub(r'(\d+)\s*(go|to|mo|mx)?', r'\1 \2', splitted_value.strip())
                disques.add(formatted_value.strip())
            updated_details['disque dur'] = " + ".join(disques)
        elif key.lower() in ["carte graphique", "carte graphique:"]:
            value = unidecode.unidecode(value)
            if "nvidia gtx" in value.lower() or "nvidia rtx" in value.lower():
                updated_details['carte graphique'] = "nvidia geforce"
            else:
                updated_details['carte graphique'] = value.lower()
        elif key.lower() in ["réf carte graphique", "chipset graphique"]:
            if "nvidia" in value.lower() or "nvidea" in value.lower() or "geforce" in value.lower():
                value = value.lower().replace("nvidia", "").replace("nvidea", "").replace("geforce", "").strip()
                splitted_value2 = value.split(",")[0].strip()
                value = splitted_value2
                formatted_value_mx = re.sub(r'(mx)(\d+)', r'\1 \2', value)
                formatted_value_ti = re.sub(r'(\d+)\s*(ti)', r'\1', formatted_value_mx, flags=re.IGNORECASE)
                updated_details['ref carte graphique'] = formatted_value_ti
        elif key.lower() in ["gamer", "type de pc"]:
            if value.lower() in ["oui", "pc portable gamer"]:
                updated_details['gamer'] = "oui"
            else:
                updated_details['gamer'] = "non"
        else:
            updated_details[key] = value
    return updated_details
