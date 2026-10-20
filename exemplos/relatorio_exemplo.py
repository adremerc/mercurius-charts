"""Exemplo de relatório completo (capa + páginas) usando as figuras da galeria.

    python exemplos/galeria.py            # gera as figuras
    python exemplos/relatorio_exemplo.py  # -> galeria/relatorio_exemplo.pdf

Texto e números ILUSTRATIVOS.
"""

import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))
from mercurius_charts.relatorio import Relatorio  # noqa: E402

G = RAIZ / "galeria"

rel = Relatorio(G / "relatorio_exemplo.pdf", data="20 de outubro de 2026")
rel.capa("Stablecoins: o dólar que roda na blockchain",
         "Projeções de oferta, receita e retorno até 2030",
         autores=["Equipe Mercurius Research"])
rel.pagina(
    "Caso você tenha apenas cinco minutos", "Da oferta ao retorno",
    paragrafos=[
        "**A oferta de stablecoins deve mais que dobrar até 2030.** Em nosso cenário ilustrativo, "
        "o estoque sai de cerca de US$ 281 bilhões em 2025 para US$ 625 bilhões em 2030, puxado "
        "por USDT e USDC, enquanto emissores menores ganham participação gradualmente.",
        "**O crescimento vem mais de uso do que de preço.** Pagamentos, remessas e colateral em "
        "DeFi explicam a maior parte da expansão; o texto aqui é apenas um exemplo de como a "
        "frase-tese em negrito abre cada parágrafo, no mesmo ritmo dos relatórios sell-side.",
    ],
    figuras=[G / "01_barras_empilhadas.png", G / "02_cascata.png"],
)
rel.pagina(
    "Retorno e risco", "Sensibilidades da carteira-modelo",
    paragrafos=[
        "**O retorno é mais sensível à alocação do que ao preço de entrada.** A tabela abaixo "
        "cruza o preço do BTC com a alocação; o contorno marca o cenário-base.",
    ],
    figuras=[G / "05_mapa_calor.png", (G / "07_ranking.png", G / "08_barras_com_linha.png")],
)
print("ok", rel.fechar())
