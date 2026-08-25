import sys
import base64
import requests
import json
import os

def main():
    if len(sys.argv) < 2:
        print("Kullanım: python test_google_vision.py <resim_yolu>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    api_key = os.environ.get("GOOGLE_VISION_API_KEY")
    
    if not api_key:
        print("HATA: GOOGLE_VISION_API_KEY ortam değişkeni bulunamadı.")
        print("Windows'ta şu komutla ayarlayabilirsiniz (tırnaksız):")
        print("set GOOGLE_VISION_API_KEY=AIzaSyB-xxxxxxxxxxxxxxxxx")
        sys.exit(1)
        
    print(f"Fotoğraf okunuyor: {image_path}")
    try:
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        print(f"Fotoğraf okunamadı: {e}")
        sys.exit(1)
        
    payload = {
        "requests": [
            {
                "image": {"content": image_data},
                "features": [{"type": "WEB_DETECTION", "maxResults": 30}]
            }
        ]
    }
    
    url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    print("Google Cloud Vision API'ye istek atılıyor (WEB_DETECTION)...")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("\n" + "="*50)
            print("=== GOOGLE VISION HAM YANITI (RAW JSON) ===")
            print("="*50)
            print(json.dumps(data, indent=2, ensure_ascii=False))
            print("="*50)
            
            # Analiz Özeti
            responses = data.get("responses", [])
            if responses:
                web = responses[0].get("webDetection", {})
                
                print("\n🔍 ANALİZ ÖZETİ:")
                
                entities = web.get("webEntities", [])
                print(f"- Bulunan Varlıklar (Kişi/Obje): {len(entities)} adet")
                for e in entities[:3]:
                    print(f"   * {e.get('description', 'Bilinmiyor')} (Skor: {e.get('score', 0):.2f})")
                    
                pages = web.get("pagesWithMatchingImages", [])
                print(f"- Bu Fotoğrafı İçeren Web Sayfaları: {len(pages)} adet")
                for p in pages[:5]:
                    print(f"   * {p.get('url')}")
                    
                similar = web.get("visuallySimilarImages", [])
                print(f"- Görsel Olarak Benzer Fotoğraflar: {len(similar)} adet")
                
        else:
            print(f"\nHATA: Google API {response.status_code} kodu döndürdü.")
            print(response.text)
            
    except Exception as e:
        print(f"\nİstek sırasında hata oluştu: {e}")

if __name__ == "__main__":
    main()
