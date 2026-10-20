"""Baixa as fontes da marca (Inter, Outfit, JetBrains Mono — licença SIL OFL)
do repositório oficial google/fonts para mercurius_charts/fonts/.

    python scripts/baixar_fontes.py
"""

import urllib.request
from pathlib import Path

DESTINO = Path(__file__).resolve().parents[1] / "mercurius_charts" / "fonts"
BASE = "https://github.com/google/fonts/raw/main/ofl"
ARQUIVOS = {
    "Inter.ttf": f"{BASE}/inter/Inter%5Bopsz,wght%5D.ttf",
    "Outfit.ttf": f"{BASE}/outfit/Outfit%5Bwght%5D.ttf",
    "JetBrainsMono.ttf": f"{BASE}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
}

if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    for nome, url in ARQUIVOS.items():
        alvo = DESTINO / nome
        if alvo.exists():
            print("já existe", nome)
            continue
        print("baixando", nome)
        urllib.request.urlretrieve(url, alvo)
    print("ok — apague o cache do matplotlib se as fontes não aparecerem:")
    print("    python -c \"import matplotlib; print(matplotlib.get_cachedir())\"")
