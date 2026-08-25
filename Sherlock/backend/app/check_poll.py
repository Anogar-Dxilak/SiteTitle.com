import requests
import json
import time

for i in range(10):
    try:
        r = requests.get('https://sherlock-api-0mu3.onrender.com/api/health', timeout=10)
        print(f"[{i}] Health:", r.json())
    except Exception as e:
        print(f"[{i}] Err:", e)
    time.sleep(5)
