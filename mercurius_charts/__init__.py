"""mercurius_charts — gráficos no padrão visual Mercurius Research.

    import mercurius_charts as mc
    fig, ax = mc.figura("Título que conta a conclusão", "US$ bilhões, mensal",
                        numero=1, fonte="Glassnode e Mercurius Research.")
    mc.linhas(ax, df)
    mc.salvar(fig, "saida/fig01")
"""

from . import formato
from .anotacoes import caixa, destacar, etiquetas_finais, evento, linha_ref, periodo
from .figura import figura, legenda, salvar
from .graficos import (area_empilhada, barras, barras_100, barras_horizontais, barras_tempo,
                       calendario, cascata, correlacao, dispersao, eixo_tempo, halteres,
                       intervalos, leque, linhas)
from .tema import tema_atual, usar_tema
from .tokens import CLARO, ESCURO, TEMAS

usar_tema("claro")
