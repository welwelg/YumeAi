import urllib.request
import json
import ssl

# --- CONFIGURATION ---
# PASTE YOUR RAW API KEY HERE (from https://aistudio.google.com/app/apikey)
API_KEY = "AIzaSyAKwQPJEiAspVM-oZZE5ky46fxASvy1YW4"
# ---------------------

def check_google_api():
    print(f"🔍 Testing API Key: {API_KEY[:5]}...{API_KEY[-5:]}")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    
    try:
        # Create an unverified context to avoid SSL certificate errors on some Macs
        context = ssl._create_unverified_context()
        
        with urllib.request.urlopen(url, context=context) as response:
            if response.status != 200:
                print(f"❌ API Error: Status {response.status}")
                return

            data = json.load(response)
            
            print("\n✅ SUCCESS! Google accepted your key.")
            print("👇 AVAILABLE MODELS (Copy one of these exact strings):")
            print("-" * 40)
            
            found_flash = False
            for model in data.get('models', []):
                name = model['name']
                # Clean up the name (remove 'models/' prefix if helpful, but usually we keep it)
                print(f"  {name}")
                if "flash" in name:
                    found_flash = True
            
            print("-" * 40)
            if not found_flash:
                print("⚠️ WARNING: No 'flash' models found. You might need to enable them in Google Cloud Console.")

    except urllib.error.HTTPError as e:
        print(f"\n❌ HTTP ERROR: {e.code} - {e.reason}")
        print("This usually means the API Key is invalid or has no quota.")
    except Exception as e:
        print(f"\n❌ CONNECTION ERROR: {e}")

if __name__ == "__main__":
    check_google_api()