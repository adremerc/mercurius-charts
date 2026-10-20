"""Exporta os dados ILUSTRATIVOS de exemplos/dados.py para web/dados.js.

    python web/gerar_dados.py
"""

import json
import sys
from pathlib import Path
from statistics import NormalDist

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "exemplos"))
import dados  # noqa: E402


def serie(s, casas=2):
    s = s.dropna()
    return [[d.strftime("%Y-%m-%d"), round(float(v), casas)] for d, v in s.items()]


p = dados.precos("2017-01")
semanal, acum = dados.fluxos_etf()
st = dados.stablecoins()
rr = dados.risco_retorno()
cal = dados.retornos_mensais()

h = dados.precos("2019-01")["BTC"].resample("ME").last()
idx = pd.date_range("2026-01-31", "2027-12-31", freq="ME")
tt = np.arange(1, len(idx) + 1) / 12
med = h.iloc[-1] * np.exp(0.22 * tt)
quantis = {}
for q in (0.05, 0.25, 0.5, 0.75, 0.95):
    v = med * np.exp(NormalDist().inv_cdf(q) * 0.55 * np.sqrt(tt))
    quantis[str(q)] = [[h.index[-1].strftime("%Y-%m-%d"), round(float(h.iloc[-1]))]] + \
        [[d.strftime("%Y-%m-%d"), round(float(x))] for d, x in zip(idx, v)]

D = {
    "precos": {"BTC": serie(p["BTC"], 0), "ETH": serie(p["ETH"], 1)},
    "etf_semanal": serie(semanal, 2),
    "etf_acumulado": {c: serie(acum[c], 1) for c in acum.columns},
    "stablecoins": {"datas": [d.strftime("%Y-%m-%d") for d in st.index],
                    "series": {c: [round(float(v), 1) for v in st[c]] for c in st.columns}},
    "risco_retorno": rr.to_dict(orient="records"),
    "leque": {"historico": serie(h, 0), "quantis": quantis},
    "calendario": {"anos": [int(a) for a in cal.index], "meses": list(cal.columns),
                   "valores": [[None if pd.isna(v) else round(float(v), 4) for v in linha]
                               for linha in cal.to_numpy()]},
}

saida = Path(__file__).with_name("dados.js")
saida.write_text("// Gerado por web/gerar_dados.py. Dados ILUSTRATIVOS.\nwindow.MC_DADOS = "
                 + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + ";\n",
                 encoding="utf-8")
print("ok", saida, round(saida.stat().st_size / 1024), "KB")
