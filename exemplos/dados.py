"""Dados de EXEMPLO para a galeria.

Preços de BTC/ETH: trajetória aproximada a partir de fechamentos mensais
arredondados, interpolada em base semanal com ruído. Servem para mostrar o
design. Não use em análise: troque pela sua fonte (Glassnode, CoinMetrics,
Bloomberg etc.).
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(11)

_BTC = {
    "2016-01": 370, "2016-06": 670, "2016-12": 960, "2017-03": 1070, "2017-06": 2480,
    "2017-09": 4340, "2017-11": 10200, "2017-12": 14000, "2018-02": 10300, "2018-04": 9200,
    "2018-06": 6400, "2018-09": 6600, "2018-11": 4000, "2018-12": 3700, "2019-03": 4100,
    "2019-06": 10800, "2019-09": 8300, "2019-12": 7200, "2020-02": 8600, "2020-03": 6400,
    "2020-06": 9100, "2020-09": 10800, "2020-11": 19700, "2020-12": 29000, "2021-02": 45200,
    "2021-04": 57700, "2021-06": 35000, "2021-07": 41500, "2021-10": 61300, "2021-11": 57000,
    "2021-12": 46300, "2022-03": 45500, "2022-05": 31800, "2022-06": 19800, "2022-10": 20500,
    "2022-11": 17200, "2022-12": 16500, "2023-03": 28500, "2023-06": 30500, "2023-09": 27000,
    "2023-12": 42300, "2024-02": 61200, "2024-03": 71300, "2024-06": 62700, "2024-08": 59000,
    "2024-10": 70200, "2024-11": 96400, "2024-12": 93400, "2025-01": 102400, "2025-03": 82500,
    "2025-04": 94200, "2025-06": 107100, "2025-07": 115800, "2025-08": 108200,
    "2025-09": 114000, "2025-10": 109500, "2025-11": 90400, "2025-12": 88000,
}
_ETH = {
    "2016-01": 1, "2016-06": 12, "2016-12": 8, "2017-03": 50, "2017-06": 300, "2017-09": 300,
    "2017-12": 750, "2018-01": 1100, "2018-04": 670, "2018-06": 450, "2018-09": 230,
    "2018-12": 135, "2019-03": 140, "2019-06": 290, "2019-09": 180, "2019-12": 130,
    "2020-03": 133, "2020-06": 225, "2020-09": 360, "2020-12": 737, "2021-02": 1420,
    "2021-05": 2700, "2021-06": 2270, "2021-08": 3430, "2021-11": 4630, "2021-12": 3680,
    "2022-03": 3280, "2022-06": 1070, "2022-09": 1330, "2022-12": 1200, "2023-03": 1820,
    "2023-06": 1930, "2023-09": 1670, "2023-12": 2280, "2024-03": 3600, "2024-05": 3760,
    "2024-08": 2500, "2024-10": 2510, "2024-12": 3330, "2025-02": 2240, "2025-04": 1800,
    "2025-06": 2490, "2025-08": 4400, "2025-09": 4140, "2025-10": 3850, "2025-11": 3000,
    "2025-12": 2970,
}


def _semanal(ancoras, vol=0.035, inicio=None):
    s = pd.Series(ancoras, dtype=float)
    s.index = pd.to_datetime(s.index) + pd.offsets.MonthEnd(0)
    idx = pd.date_range(s.index[0], s.index[-1], freq="W-FRI")
    base = np.exp(np.interp(idx.astype("int64"), s.index.astype("int64"), np.log(s.values)))
    # ponte browniana entre âncoras: ruído que volta a zero em cada fechamento mensal
    ruido = np.zeros(len(idx))
    pos = np.searchsorted(idx, s.index)
    for a, b in zip(pos[:-1], pos[1:]):
        n = b - a
        if n > 1:
            w = np.cumsum(RNG.normal(0, vol, n))
            ruido[a:b] = w - np.linspace(0, w[-1], n)
    serie = pd.Series(base * np.exp(ruido), index=idx)
    return serie[inicio:] if inicio else serie


def precos(inicio="2017-01"):
    return pd.DataFrame({"BTC": _semanal(_BTC, 0.045), "ETH": _semanal(_ETH, 0.06)})[inicio:]


def fluxos_etf():
    """Fluxo semanal líquido para ETFs spot de BTC (US$ bi) e acumulado por emissor."""
    idx = pd.date_range("2024-01-12", "2025-12-26", freq="W-FRI")
    n = len(idx)
    tend = 0.9 + 0.6 * np.sin(np.linspace(0, 5.5, n)) + np.linspace(0, 0.3, n)
    semanal = pd.Series(tend + RNG.normal(0, 1.3, n), index=idx).round(2)
    semanal.iloc[2:6] -= 1.4  # saídas da Grayscale no lançamento
    pesos = {"IBIT": 0.62, "FBTC": 0.22, "Outros": 0.30, "GBTC": -0.14}
    acum = pd.DataFrame({k: (semanal.clip(lower=-0.5) * w + RNG.normal(0, 0.08, n)).cumsum()
                         for k, w in pesos.items()}, index=idx)
    acum["GBTC"] = (-np.linspace(0, 1, n) ** 0.35 * 22 + RNG.normal(0, 0.15, n))
    return semanal, acum


def stablecoins():
    """Oferta por emissor (US$ bi), trajetória aproximada com ruído."""
    anc = {
        "USDT": {"2020-01": 4.6, "2021-01": 25, "2021-06": 62, "2021-12": 78, "2022-04": 83,
                 "2022-06": 66, "2022-12": 66, "2023-06": 83, "2023-12": 91, "2024-06": 113,
                 "2024-12": 137, "2025-06": 158, "2025-12": 186},
        "USDC": {"2020-01": 0.5, "2021-01": 4.5, "2021-06": 25, "2021-12": 42, "2022-06": 55,
                 "2022-12": 44, "2023-03": 33, "2023-12": 24, "2024-06": 32, "2024-12": 42,
                 "2025-06": 61, "2025-12": 75},
        "USDS/DAI": {"2020-01": 0.2, "2021-01": 1.5, "2021-12": 9.5, "2022-06": 6.5,
                     "2022-12": 5.5, "2023-12": 5.3, "2024-12": 8.5, "2025-06": 10,
                     "2025-12": 10},
        "Outras": {"2020-01": 1, "2021-01": 2.5, "2021-12": 22, "2022-06": 23, "2022-12": 20,
                   "2023-12": 10, "2024-12": 18, "2025-06": 22, "2025-12": 28},
    }
    idx = pd.date_range("2020-01-31", "2025-12-31", freq="ME")
    out = {}
    for k, a in anc.items():
        s_ = pd.Series(a, dtype=float)
        s_.index = pd.to_datetime(s_.index) + pd.offsets.MonthEnd(0)
        v = np.interp(idx.astype("int64"), s_.index.astype("int64"), s_.values)
        out[k] = v * np.exp(RNG.normal(0, 0.015, len(idx)))
    return pd.DataFrame(out, index=idx).round(1)


def risco_retorno():
    linhas = [
        # ativo, vol anual, retorno anual, mcap (US$ bi), grupo
        ("BTC", 0.52, 0.48, 1750, "Cripto"), ("ETH", 0.68, 0.31, 360, "Cripto"),
        ("SOL", 0.92, 0.58, 85, "Cripto"), ("BNB", 0.58, 0.29, 120, "Cripto"),
        ("XRP", 0.85, 0.40, 130, "Cripto"), ("ADA", 0.88, 0.05, 25, "Cripto"),
        ("DOGE", 0.98, 0.22, 30, "Cripto"), ("AVAX", 0.95, -0.06, 12, "Cripto"),
        ("LINK", 0.86, 0.17, 12, "Cripto"),
        ("Nasdaq", 0.21, 0.17, 60, "Tradicional"), ("S&P 500", 0.17, 0.13, 60, "Tradicional"),
        ("Ouro", 0.15, 0.14, 60, "Tradicional"), ("Ibovespa", 0.23, 0.07, 60, "Tradicional"),
    ]
    return pd.DataFrame(linhas, columns=["ativo", "vol", "ret", "mcap", "grupo"])


def retornos_mensais():
    p = precos("2018-01")["BTC"].resample("ME").last()
    r = p.pct_change().dropna()
    tab = pd.DataFrame({"ano": r.index.year, "mes": r.index.month, "r": r.values})
    piv = tab.pivot(index="ano", columns="mes", values="r")
    piv.columns = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out",
                   "Nov", "Dez"]
    anual = p.resample("YE").last().pct_change()
    piv["Ano"] = anual.values[1:] if len(anual) - 1 == len(piv) else anual.reindex(
        pd.to_datetime([f"{a}-12-31" for a in piv.index])).values
    return piv
