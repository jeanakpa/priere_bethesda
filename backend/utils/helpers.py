import random
import string
from datetime import datetime, date

def generate_tracking_code():
    year = datetime.now().year
    random_num = random.randint(1000, 9999)
    return f"BET-{year}-{random_num}"

def parse_date(date_str):
    if not date_str:
        return None
    if isinstance(date_str, (date, datetime)):
        return date_str
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            return None
