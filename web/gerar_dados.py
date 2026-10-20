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

# ---- OHLC diário (ilustrativo): 220 pregões terminando no último preço semanal
rng = np.random.default_rng(21)
n = 220
dias = pd.bdate_range(end="2025-12-31", periods=n, freq="D")
ret = rng.standard_t(4, n) * 0.022 + np.sin(np.linspace(0, 7, n)) * 0.006
fech = p["BTC"].iloc[-1] * np.exp(np.cumsum(ret) - np.cumsum(ret)[-1])
abre = np.r_[fech[0] / np.exp(ret[0]), fech[:-1]] * np.exp(rng.normal(0, 0.003, n))
amp = np.abs(rng.normal(0, 0.015, n)) + np.abs(ret) * 0.5
maxi = np.maximum(abre, fech) * (1 + amp * rng.uniform(0.2, 1, n))
mini = np.minimum(abre, fech) * (1 - amp * rng.uniform(0.2, 1, n))
vol = np.exp(rng.normal(3.2, 0.35, n) + np.abs(ret) * 12)
ohlc = [[d.strftime("%Y-%m-%d"), round(a), round(h_), round(l_), round(c), round(v, 1)]
        for d, a, h_, l_, c, v in zip(dias, abre, maxi, mini, fech, vol)]

# ---- retornos diários de 3 anos (caudas gordas) para histograma e boxplot
r_btc = rng.standard_t(3.2, 1095) * 0.021 + 0.0012
caixas = {nome: list(np.round(rng.standard_t(4, 36) * s + m, 4))
          for nome, (m, s) in {"BTC": (0.035, 0.14), "ETH": (0.025, 0.19), "SOL": (0.04, 0.27),
                               "Nasdaq": (0.012, 0.045), "S&P 500": (0.009, 0.035),
                               "Ouro": (0.008, 0.032)}.items()}

# ---- retornos diários pareados BTC × Nasdaq (beta ~1,6)
nq = rng.normal(0.0006, 0.012, 500)
bt = 1.6 * nq + rng.normal(0.0005, 0.024, 500)

# ---- RRG: rastro de 10 semanas por ativo, girando em torno de (100, 100)
rrg = {}
for k, nome in enumerate(["ETH", "SOL", "XRP", "BNB", "DOGE", "LINK", "AVAX", "TON"]):
    fase = k * 0.8 + rng.uniform(0, 0.4)
    raio = rng.uniform(1.5, 4.5)
    ts = np.linspace(fase, fase + 1.4, 10)
    rrg[nome] = [[round(100 + raio * np.cos(t) + rng.normal(0, .15), 2),
                  round(100 + raio * 0.8 * np.sin(t) + rng.normal(0, .15), 2)] for t in ts]

D = {
    "ohlc": ohlc,
    "retornos_btc": [round(float(x), 4) for x in r_btc],
    "caixas": caixas,
    "btc_nasdaq": [[round(float(a), 4), round(float(b), 4)] for a, b in zip(nq, bt)],
    "rrg": rrg,
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
