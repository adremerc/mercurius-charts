"""Galeria de referência do padrão Mercurius.

    python exemplos/galeria.py          # todas
    python exemplos/galeria.py 1 4 7    # só algumas

Números ILUSTRATIVOS (veja exemplos/dados.py).
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import dados  # noqa: E402

import mercurius_charts as mc  # noqa: E402
from mercurius_charts import formato as F  # noqa: E402

SAIDA = RAIZ / "galeria"
FONTE = "Mercurius Research. Dados ilustrativos, aproximados."
GALERIA = {}


def item(n):
    def reg(f):
        GALERIA[n] = f
        return f
    return reg


@item(1)
def ciclos_btc():
    p = dados.precos("2017-01")
    fig, ax = mc.figura("Cada halving antecedeu uma nova máxima do bitcoin",
                        "Preço em US$, escala logarítmica, semanal", numero=1, fonte=FONTE,
                        altura=3.5, margem_dir=0.78, margem_esq=0.48)
    t = mc.tema_atual()
    mc.periodo(ax, "2017-12-15", "2018-12-15", "Bear market")
    mc.periodo(ax, "2021-11-10", "2022-11-21", "Bear market")
    cores = mc.linhas(ax, p, log=True, fmt=lambda v: F.num(v), passo="ano",
                      fmt_tag=lambda v: F.num(round(v, -2) if v > 1000 else round(v, -1)),
                      cores={"BTC": t.principal, "ETH": t.destaque})
    for d in ["2020-05-11", "2024-04-20"]:
        mc.evento(ax, d, "Halving")
    pico = p["BTC"].idxmax()
    mc.destacar(ax, pico, p["BTC"].max(), f"Máxima: US$ {F.num(p['BTC'].max() / 1000, 0)} mil",
                dx=-14, dy=10)
    mc.salvar(fig, SAIDA / "01_linhas_log_eventos")


@item(2)
def fluxos_etf():
    semanal, acum = dados.fluxos_etf()
    fig, (a1, a2) = mc.figura(
        "ETFs de bitcoin: entradas persistentes, apesar das saídas do GBTC",
        "Desde o lançamento dos ETFs spot nos EUA, jan/24–dez/25", numero=2, fonte=FONTE,
        nota="Fluxo líquido = criações menos resgates.", paineis=(1, 2),
        titulos_paineis=[("Fluxo líquido semanal", "US$ bilhões"),
                         ("Fluxo acumulado por emissor", "US$ bilhões")],
        altura=3.4, margem_dir=0.70, espaco_col=0.05)
    mc.barras_tempo(a1, semanal, fmt=lambda v: F.num(v, 0), passo="semestre")
    t = mc.tema_atual()
    mc.linhas(a2, acum, passo="semestre",
              cores={"IBIT": t.principal, "FBTC": t.destaque, "Outros": t.categorica[3],
                     "GBTC": t.negativo}, fmt=lambda v: F.num(v, 0))
    mc.salvar(fig, SAIDA / "02_paineis_fmi")


@item(3)
def stablecoins():
    df = dados.stablecoins()
    t = mc.tema_atual()
    fig, ax = mc.figura("Oferta de stablecoins atingiu recorde, liderada pelo USDT",
                        "Capitalização por emissor, US$ bilhões, fim do mês", numero=3,
                        fonte=FONTE, altura=3.3, margem_dir=0.62)
    mc.area_empilhada(ax, df, cores=[t.principal, t.destaque, t.categorica[3], t.outros],
                      pos_rotulo=0.86)
    total = df.sum(1)
    mc.caixa(ax, [(F.num(total.iloc[-1], 0), "US$ bi em circulação"),
                  (F.pct(total.iloc[-1] / total.iloc[-13] - 1, 0, sinal=True), "em 12 meses"),
                  (F.pct(df["USDT"].iloc[-1] / total.iloc[-1]), "participação do USDT")],
             x=0.025, y=0.95, largura=128)
    mc.salvar(fig, SAIDA / "03_area_empilhada")


@item(4)
def risco_retorno():
    d = dados.risco_retorno()
    t = mc.tema_atual()
    fig, ax = mc.figura("Retorno por unidade de risco: BTC se aproxima dos ativos tradicionais",
                        "Retorno anualizado × volatilidade anualizada, 3 anos; área = valor de mercado",
                        numero=4, fonte=FONTE, altura=3.6, margem_esq=0.45, margem_dir=0.35,
                        legenda=True)
    mc.dispersao(ax, d, "vol", "ret", rotulo="ativo", tamanho="mcap", grupo="grupo",
                 cores={"Cripto": t.destaque, "Tradicional": t.principal},
                 fmt_x=lambda v: F.pct(v), fmt_y=lambda v: F.pct(v), escala_tamanho=380)
    ax.set_xlim(0, 1.08)
    ax.set_ylim(-0.15, 0.68)
    ax.set_xlabel("Volatilidade anualizada →", fontsize=7, color=t.texto_2, loc="right")
    mc.legenda(ax, [("Cripto", t.destaque, "ponto"), ("Tradicional", t.principal, "ponto")])
    mc.salvar(fig, SAIDA / "04_dispersao_bolhas")


@item(5)
def leque_btc():
    from statistics import NormalDist
    h = dados.precos("2019-01")["BTC"].resample("ME").last()
    idx = pd.date_range("2026-01-31", "2027-12-31", freq="ME")
    tt = np.arange(1, len(idx) + 1) / 12
    med = h.iloc[-1] * np.exp(0.22 * tt)
    qs = [0.05, 0.25, 0.5, 0.75, 0.95]
    proj = pd.DataFrame({q: med * np.exp(NormalDist().inv_cdf(q) * 0.55 * np.sqrt(tt))
                         for q in qs}, index=idx)
    proj = pd.concat([pd.DataFrame({q: [h.iloc[-1]] for q in qs}, index=[h.index[-1]]), proj])
    fig, ax = mc.figura("Cenário-base aponta BTC perto de US$ 140 mil no fim de 2027",
                        "Preço em US$ (escala log); bandas = intervalos de probabilidade",
                        numero=5, fonte=FONTE,
                        nota="Distribuição lognormal com volatilidade de 55% a.a.; ilustrativo.",
                        altura=3.4, margem_dir=1.15, margem_esq=0.5)
    mc.leque(ax, h, proj, fmt=lambda v: F.num(round(v, -3) if v > 1e4 else v),
             nome="Mediana", log=True)
    from matplotlib.ticker import FixedLocator
    ax.yaxis.set_major_locator(FixedLocator([5000, 10000, 20000, 50000, 100000, 200000, 500000]))
    mc.salvar(fig, SAIDA / "05_leque_projecao")


@item(6)
def calendario():
    df = dados.retornos_mensais()
    fig, ax = mc.figura("Retornos mensais do bitcoin: outubro e novembro concentram os ganhos",
                        "Variação % no mês, preço em US$", numero=6, fonte=FONTE, altura=3.3,
                        margem_esq=0.42, margem_dir=0.05, eixo_x=False)
    mc.calendario(ax, df, limite=0.35)
    mc.salvar(fig, SAIDA / "06_calendario_retornos")


@item(7)
def halteres():
    df = pd.DataFrame({"2024": [3.4, 7.0, 3.1, 12.0, 8.2, 17.0, 9.0, 4.5, 5.6],
                       "2025": [2.9, 6.8, 2.6, 11.1, 7.1, 15.2, 8.6, 4.1, 6.2]},
                      index=["ETH", "SOL", "ADA", "DOT", "AVAX", "ATOM", "NEAR", "TRX", "SUI"])
    fig, ax = mc.figura("Rendimentos de staking caíram em quase todas as grandes redes",
                        "Rendimento nominal anual, %", numero=7, fonte=FONTE, largura="meia",
                        altura=3.6, legenda=True, margem_esq=0.38, margem_dir=0.15)
    mc.halteres(ax, df / 100, "2024", "2025", fmt=lambda v: F.pct(v, 1),
                fmt_eixo=lambda v: F.pct(v, 0))
    mc.salvar(fig, SAIDA / "07_halteres")


@item(8)
def faixas():
    df = pd.DataFrame({"min": [-4, -6, -9, -3, -12, -8, -10],
                       "max": [28, 34, 52, 22, 61, 40, 45],
                       "mediana": [9, 10, 14, 8, 16, 12, 11],
                       "atual": [6.5, 4.0, 19.5, 7.8, -2.1, 11.0, 24.0]},
                      index=["BTC", "ETH", "SOL", "BNB", "DOGE", "XRP", "SUI"]) / 100
    fig, ax = mc.figura("Funding de perpétuos: só SUI e SOL operam acima da mediana",
                        "Taxa anualizada, %; faixa e mediana dos últimos 12 meses", numero=8,
                        fonte=FONTE, largura="meia", altura=3.6, legenda=True,
                        margem_esq=0.38, margem_dir=0.38)
    mc.intervalos(ax, df, referencia="mediana", fmt=lambda v: F.pct(v, 0))
    mc.salvar(fig, SAIDA / "08_faixas")


@item(9)
def correlacao():
    nomes = ["BTC", "ETH", "SOL", "Nasdaq", "S&P 500", "Ouro", "DXY", "Ibovespa"]
    rng = np.random.default_rng(3)
    f_cripto, f_risco, f_dolar = rng.normal(size=(3, 500))
    carga = {"BTC": (1, .45, -.2), "ETH": (1.1, .5, -.2), "SOL": (1.15, .5, -.15),
             "Nasdaq": (.15, 1, -.25), "S&P 500": (.1, .9, -.2), "Ouro": (.1, .05, -.6),
             "DXY": (0, -.25, 1), "Ibovespa": (.05, .55, -.5)}
    ret = pd.DataFrame({n: c[0] * f_cripto + c[1] * f_risco + c[2] * f_dolar
                        + rng.normal(0, .55, 500) for n, c in carga.items()})[nomes]
    fig, ax = mc.figura("Cripto se move em bloco; correlação com ações é moderada",
                        "Correlação de retornos diários, 90 dias", numero=9, fonte=FONTE,
                        largura="meia", altura=3.9, margem_esq=0.55, margem_dir=0.05)
    mc.correlacao(ax, ret.corr())
    mc.salvar(fig, SAIDA / "09_correlacao")


@item(10)
def detentores():
    df = pd.DataFrame({
        "ETFs": [0.0, 0.0, 4.4, 6.5], "Empresas": [1.2, 1.3, 2.4, 4.8],
        "Governos": [1.4, 1.5, 2.6, 2.6], "Exchanges": [12.0, 11.0, 10.2, 9.0],
        "Mineradores": [9.4, 9.2, 9.0, 8.8], "Demais": [76.0, 77.0, 71.4, 68.3],
    }, index=["2022", "2023", "2024", "2025"])
    t = mc.tema_atual()
    fig, ax = mc.figura("ETFs e empresas já detêm mais de 11% da oferta de bitcoin",
                        "Participação na oferta em circulação, fim de ano", numero=10,
                        fonte=FONTE, altura=2.7, legenda=True, margem_esq=0.42)
    mc.barras_100(ax, df, cores=[t.destaque, t.principal, t.categorica[2], t.categorica[3],
                                 t.categorica[5], t.outros],
                  fmt=lambda v: F.pct(v, 0 if v >= 0.1 else 1), minimo_rotulo=0.035)
    mc.salvar(fig, SAIDA / "10_composicao_100")


@item(11)
def atribuicao():
    fig, ax = mc.figura("Carteira-modelo superou o benchmark em 2025, puxada por BTC",
                        "Contribuição para o retorno, pontos percentuais", numero=11,
                        fonte=FONTE, altura=3.0)
    mc.cascata(ax, ("Benchmark", 12.0),
               [("Alocação em BTC", 6.2), ("Alocação em ETH", 2.1), ("Seleção de altcoins", -2.4),
                ("Hedge cambial", -0.9), ("Staking", 1.3), ("Custos", -0.6)],
               "Carteira-modelo", fmt=lambda v, sinal=False: F.num(v, 1, sinal))
    mc.salvar(fig, SAIDA / "11_cascata")


@item(12)
def receita_redes():
    anos = ["2020", "2021", "2022", "2023", "2024", "2025", "2026e", "2027e"]
    df = pd.DataFrame({"Ethereum": [0.9, 9.9, 4.2, 2.4, 2.5, 1.2, 1.4, 1.6],
                       "Tron": [0.0, 0.1, 0.4, 0.9, 2.1, 2.6, 2.9, 3.1],
                       "Solana": [0.0, 0.0, 0.0, 0.0, 1.3, 1.6, 1.9, 2.2],
                       "Bitcoin": [0.4, 1.2, 0.3, 0.9, 0.9, 0.3, 0.4, 0.4],
                       "Outras": [0.1, 1.2, 0.6, 0.5, 0.8, 0.9, 1.1, 1.3]}, index=anos)
    t = mc.tema_atual()
    fig, ax = mc.figura("Receita de taxas migrou do Ethereum para Tron e Solana",
                        "Taxas pagas pelos usuários, US$ bilhões por ano", numero=12,
                        fonte=FONTE, altura=3.2, legenda=True)
    mc.barras(ax, df, empilhar=True, projecao_desde="2026e",
              cores=[t.principal, t.categorica[5], t.destaque, t.categorica[2], t.outros],
              fmt=lambda v: F.num(v, 1))
    mc.salvar(fig, SAIDA / "12_barras_empilhadas")


@item(13)
def ranking():
    s = pd.Series({"BTC": 0.42, "ETH": 0.18, "SOL": -0.12, "BNB": 0.09, "XRP": 0.31,
                   "AVAX": -0.27, "LINK": 0.05, "DOGE": -0.35, "ADA": -0.08, "TON": 0.14,
                   "SUI": 0.22, "TRX": 0.11})
    fig, ax = mc.figura("Só metade das 12 maiores bateu o Nasdaq no ano",
                        "Retorno no ano em US$, %", numero=13, fonte=FONTE, largura="meia",
                        altura=3.7, margem_esq=0.42, margem_dir=0.1)
    mc.barras_horizontais(ax, s, fmt=lambda v, sinal=False: F.pct(v, 0, sinal), polaridade=True,
                          referencia=(0.17, "Nasdaq +17%"))
    mc.salvar(fig, SAIDA / "13_ranking")


@item(14)
def escuro():
    p = dados.precos("2023-01")
    fig, ax = mc.figura("BTC descolou do ETH desde a aprovação dos ETFs",
                        "Preço indexado, base 100 = jan/23", numero=1, fonte=FONTE,
                        tema="escuro", largura="social", altura=3.4, margem_dir=0.72)
    idx = p / p.iloc[0] * 100
    t = mc.tema_atual()
    mc.linhas(ax, idx, cores={"BTC": t.destaque, "ETH": t.categorica[3]},
              fmt=lambda v: F.num(v, 0), passo="semestre")
    mc.evento(ax, "2024-01-11", "ETFs spot")
    mc.salvar(fig, SAIDA / "14_tema_escuro")
    mc.usar_tema("claro")


if __name__ == "__main__":
    escolha = [int(a) for a in sys.argv[1:]] or sorted(GALERIA)
    for n in escolha:
        GALERIA[n]()
        print("ok", n, GALERIA[n].__name__)
