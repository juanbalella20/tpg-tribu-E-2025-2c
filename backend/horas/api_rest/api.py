import json
import requests
import random

RESOURCES_URL = "https://anypoint.mulesoft.com/mocking/api/v1/sources/exchange/assets/32c8fe38-22a6-4fbb-b461-170dfac937e4/recursos-api/1.0.1/m/recursos"

def simulate_login_id():
    data = requests.get(RESOURCES_URL).json()
    return data[random.randint(0, len(data)-1)]["id"]

if __name__ == "__main__":
    print(simulate_login_id())
    pass
