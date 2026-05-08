import requests
from django.conf import settings

def get_weather_data():
    api_key = settings.WEATHER_API_KEY
    city = settings.WEATHER_CITY
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    
    try:
        response = requests.get(url)
        data = response.json()
        return {
            'temp': data['main']['temp'],
            'description': data['weather'][0]['description'],
            'icon': data['weather'][0]['icon']
        }
    except:
        return None