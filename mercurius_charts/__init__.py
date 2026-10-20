"""mercurius_charts — gráficos no padrão visual Mercurius Research.

    import mercurius_charts as mc
    fig, ax = mc.figura("Título", unidade="US$ bilhões", numero=1, fonte="...")
    mc.barras_empilhadas(ax, df)
    mc.salvar(fig, "saida/fig01")
"""

from . import formato
from .figura import figura, legenda, salvar, subtitulo, texto_rico
from .graficos import (barras_com_linha, barras_empilhadas, barras_horizontais, cascata,
                       linhas, mapa_calor, multiplos_area, numeros_chave, tabela)
from .tema import tema_atual, usar_tema
from .tokens import CLARO, ESCURO, MARCA, TEMAS

__all__ = [
    "figura", "legenda", "salvar", "subtitulo", "texto_rico",
    "barras_empilhadas", "cascata", "barras_com_linha", "linhas", "barras_horizontais",
    "multiplos_area", "mapa_calor", "tabela", "numeros_chave",
    "usar_tema", "tema_atual", "formato", "CLARO", "ESCURO", "MARCA", "TEMAS",
]

usar_tema("claro")
