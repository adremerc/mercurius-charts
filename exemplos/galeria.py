"""Gera a galeria com todos os tipos de gráfico.

    python exemplos/galeria.py         -> galeria/*.png e *.svg

ATENÇÃO: todos os números aqui são ILUSTRATIVOS, só para mostrar o design.
Troque pelos seus dados reais e ajuste a linha "Fonte".
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import mercurius_charts as mc  # noqa: E402
from mercurius_charts import formato as F  # noqa: E402

SAIDA = Path(__file__).resolve().parents[1] / "galeria"
FONTE = "Mercurius Research. Dados ilustrativos."
rng = np.random.default_rng(7)


def fig01_empilhadas():
    anos = [str(a) for a in range(2019, 2031)]
    anos = anos[:7] + [a + "e" for a in anos[7:]]
    usdt = [4, 21, 78, 66, 91, 137, 180, 215, 250, 285, 315, 345]
    usdc = [0.5, 4, 42, 44, 24, 41, 70, 88, 110, 132, 150, 168]
    usds = [0.1, 1, 9, 5, 5, 6, 9, 12, 15, 18, 21, 24]
    outras = [0.4, 1, 6, 9, 10, 14, 22, 32, 44, 58, 72, 88]
    df = pd.DataFrame({"USDT": usdt, "USDC": usdc, "USDS/DAI": usds, "Outras": outras}, index=anos)
    fig, ax = mc.figura("Oferta de stablecoins por emissor", unidade="US$ bilhões", numero=1,
                        fonte=FONTE, altura=3.1)
    t = mc.tema_atual()
    mc.barras_empilhadas(ax, df, cores=[t.principal, t.destaque, t.categorica[2], t.outros],
                         projecao_desde="2026e", total_minimo=50)
    mc.salvar(fig, SAIDA / "01_barras_empilhadas")


def fig02_cascata():
    fig, ax = mc.figura("Da carteira de 2025 à de 2026", unidade="US$ milhões", numero=2,
                        fonte=FONTE, nota="Valores de fim de ano; aportes líquidos de resgates.",
                        legenda=False, altura=3.0)
    mc.cascata(ax, ("Carteira 2025", 942),
               [("Valorização BTC", 481), ("Valorização ETH", 160), ("Aportes líquidos", 249),
                ("Altcoins", 90), ("Resgates", -204), ("Taxas e custos", -38)],
               "Carteira 2026")
    mc.salvar(fig, SAIDA / "02_cascata")


def fig03_linhas():
    datas = pd.date_range("2025-01-01", "2026-10-01", freq="W")
    def passeio(mu, sig):
        return 100 * np.exp(np.cumsum(rng.normal(mu, sig, len(datas))))
    df = pd.DataFrame({"BTC": passeio(0.006, 0.035), "ETH": passeio(0.004, 0.05),
                       "SOL": passeio(0.003, 0.065), "Nasdaq": passeio(0.0035, 0.018)}, index=datas)
    fig, ax = mc.figura("Desempenho acumulado", unidade="índice, base 100 = jan/25", numero=3,
                        fonte=FONTE, altura=3.0, margem_dir=0.95)
    mc.linhas(ax, df, destaque=["BTC", "ETH"], base=100)
    ax.xaxis.set_major_formatter(F.eixo_data())
    mc.salvar(fig, SAIDA / "03_linhas_destaque")


def fig04_multiplos():
    anos = ["25", "26", "27", "28", "29", "30"]
    nomes = ["iShares", "Fidelity", "Grayscale", "ARK", "Bitwise", "Invesco", "VanEck", "Franklin"]
    finais = [95, 42, 18, 9, 7, 3, 4, 2]
    dados, valores = {}, {}
    for n, f in zip(nomes, finais):
        curva = f * (np.linspace(0.25, 1, 6) ** 1.6)
        dados[n] = pd.DataFrame({"Potencial": curva, "Base": curva * rng.uniform(0.7, 0.85)}, index=anos)
        valores[n] = f"{f} bi"
    fig, axes = mc.figura("ETFs de bitcoin: fluxo acumulado potencial vs. cenário-base",
                          unidade="US$ bi", numero=4, fonte=FONTE,
                          nota="Escalas diferentes por painel; número = potencial em 2030.",
                          grade=(2, 4), altura=3.8, margem_esq=0.12, espaco_h=0.35, espaco_v=0.75)
    mc.multiplos_area(axes, dados, valor_painel=valores,
                      nomes_series=["Potencial", "Cenário-base"])
    mc.salvar(fig, SAIDA / "04_small_multiples")


def fig05_mapa_calor():
    precos = [60, 80, 100, 120, 140, 160]           # BTC (US$ mil)
    alocs = ["10%", "20%", "30%", "40%", "50%", "60%", "70%"]
    base_p, base_a = 100, 0.40
    m = [[(0.07 + a * (p / base_p - 1) * 1.0) - (0.07 + base_a * 0) for a in
          [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]] for p in precos]
    df = pd.DataFrame(m, index=[f"US$ {p} mil" for p in precos], columns=alocs)
    fig, ax = mc.figura("Sensibilidade do retorno da carteira em 2027", unidade="preço do BTC × alocação",
                        numero=5, fonte=FONTE, nota="Contorno = cenário-base.", legenda=False,
                        altura=3.3, margem_esq=1.15, topo_extra=0.2)
    mc.mapa_calor(ax, df, fmt=lambda v: F.pct(v, sinal=True), celula_ref=("US$ 100 mil", "40%"),
                  titulo_colunas="Alocação em BTC →", titulo_linhas="Preço do BTC ↓")
    mc.salvar(fig, SAIDA / "05_mapa_calor")


def fig06_tabela():
    linhas = [
        ["Rede", None, None, None, None],
        ["Taxas da rede (US$ bi)", 2.4, 3.1, 3.8, 4.4],
        ["Receita de staking (US$ bi)", 6.2, 7.0, 7.9, 8.6],
        ["Valor e retorno", None, None, None, None],
        ["Market cap (US$ bi)", 420, 510, 590, 655],
        ["Retorno real de staking", 0.031, 0.034, 0.036, 0.037],
        ["Múltiplo P/Taxas", 175, 165, 155, 149],
        ["Folga vs. custo de capital", 0.12, 0.09, 0.07, 0.05],
    ]
    df = pd.DataFrame(linhas, columns=["Ethereum — cenário-base", "2026e", "2027e", "2028e", "2029e"])
    pct_rows = {"Retorno real de staking", "Folga vs. custo de capital"}

    # formatação por LINHA (comum em tabelas de modelo):
    df_fmt = df.astype(object)
    for i, r in df.iterrows():
        for c in df.columns[1:]:
            v = r[c]
            if v is None or pd.isna(v):
                df_fmt.at[i, c] = ""
            elif r.iloc[0] in pct_rows:
                df_fmt.at[i, c] = F.pct(v, 1, sinal=r.iloc[0].startswith("Folga"))
            else:
                df_fmt.at[i, c] = F.num(v, 1 if v < 50 else 0)
    fig, ax = mc.figura("Economia da rede Ethereum", unidade="cenário-base Mercurius", numero=6,
                        fonte=FONTE, legenda=False, altura=2.9, margem_esq=0.06, margem_dir=0.06)
    mc.tabela(ax, df_fmt, secoes=["Rede", "Valor e retorno"], negrito=["Market cap (US$ bi)"],
              destaque_linhas=["Retorno real de staking"], destaque_coluna="2026e",
              larguras=[3.2, 1, 1, 1, 1])
    mc.salvar(fig, SAIDA / "06_tabela")


def fig07_ranking():
    s = pd.Series({"BTC": 0.42, "ETH": 0.18, "SOL": -0.12, "BNB": 0.09, "XRP": 0.31,
                   "AVAX": -0.27, "LINK": 0.05, "DOGE": -0.35, "ADA": -0.08, "TON": 0.14})
    fig, ax = mc.figura("Retorno no ano", unidade="% em US$, até 30/set", numero=7, fonte=FONTE,
                        legenda=False, largura="meia", altura=3.4, margem_esq=0.5)
    mc.barras_horizontais(ax, s, fmt=F.pct, polaridade=True)
    mc.salvar(fig, SAIDA / "07_ranking")


def fig08_barras_linha():
    idx = ["2026e", "2027e", "2028e", "2029e", "2030e"]
    receita = pd.Series([21.3, 25.6, 28.5, 29.8, 29.8], index=idx)
    necessaria = pd.Series([15.1, 18.4, 20.5, 22.2, 23.4], index=idx)
    fig, ax = mc.figura("Receita de taxas vs. necessária", unidade="US$ bi", numero=8,
                        fonte=FONTE, largura="meia", altura=3.4, margem_esq=0.35)
    mc.barras_com_linha(ax, receita, necessaria, "Receita, caso-base", "Necessária p/ 15%",
                        fmt=lambda v: F.num(v, 1))
    mc.salvar(fig, SAIDA / "08_barras_com_linha")


def fig09_numeros():
    fig, ax = mc.figura("Caso você tenha apenas um minuto", numero=None, fonte=FONTE,
                        legenda=False, altura=2.4, margem_esq=0.06, margem_dir=0.06)
    mc.numeros_chave(ax, [
        ("US$ 345 bi", "Oferta de USDT projetada para 2030", "+60% vs. 2026"),
        ("27%", "Retorno anual estimado da carteira-modelo", "+4 p.p. vs. 2025"),
        ("2,4 anos", "Payback médio das posições de mineração", "−0,3 ano vs. 2025"),
    ])
    mc.salvar(fig, SAIDA / "09_numeros_chave")


def fig10_escuro():
    datas = pd.date_range("2025-01-01", "2026-10-01", freq="W")
    df = pd.DataFrame({"BTC": 100 * np.exp(np.cumsum(rng.normal(0.006, 0.035, len(datas)))),
                       "ETH": 100 * np.exp(np.cumsum(rng.normal(0.004, 0.05, len(datas))))},
                      index=datas)
    fig, ax = mc.figura("BTC vs. ETH", unidade="base 100", fonte=FONTE, tema="escuro",
                        largura="social", altura=3.4, margem_dir=0.85)
    t = mc.tema_atual()
    mc.linhas(ax, df, cores=[t.destaque, t.categorica[2]], area=True, base=100)
    ax.xaxis.set_major_formatter(F.eixo_data())
    mc.salvar(fig, SAIDA / "10_tema_escuro")
    mc.usar_tema("claro")


if __name__ == "__main__":
    for f in [fig01_empilhadas, fig02_cascata, fig03_linhas, fig04_multiplos, fig05_mapa_calor,
              fig06_tabela, fig07_ranking, fig08_barras_linha, fig09_numeros, fig10_escuro]:
        f()
        print("ok", f.__name__)
