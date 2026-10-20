"""Tokens visuais Mercurius Research.

Referências de linguagem: exhibits de Morgan Stanley Research, JPM Guide to the
Markets e figuras do FMI (WEO/GFSR). Tipografia pequena e precisa, linhas finas,
navy como âncora e o teal da marca como destaque.

Paleta categórica validada (excluindo o navy-âncora, que é neutro por design):
banda de luminosidade, croma, ΔE para deutan/protan/tritan ≥ 13 entre vizinhas.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Tema:
    nome: str
    fundo: str
    texto: str          # títulos e valores
    texto_2: str        # ticks, rótulos
    texto_3: str        # fonte, notas, anotações discretas
    grade: str          # linhas de grade
    eixo: str           # linha de base / zero
    sombra: str         # faixas de período, fundos de caixa
    regua: str          # régua superior da figura
    principal: str      # navy — série âncora
    destaque: str       # teal da marca
    outros: str         # contexto / "Outros"
    categorica: tuple   # ordem FIXA
    positivo: str
    negativo: str
    divergente: tuple   # (negativo, meio, positivo)
    sequencial: tuple   # claro -> escuro


CLARO = Tema(
    nome="claro",
    fundo="#ffffff",
    texto="#0e1a24",
    texto_2="#4a5761",
    texto_3="#7b8791",
    grade="#e4e9ed",
    eixo="#55626c",
    sombra="#eef2f5",
    regua="#0e2a3b",
    principal="#0e2a3b",
    destaque="#17a398",
    outros="#b9c4cc",
    categorica=("#0e2a3b", "#17a398", "#d2a03c", "#3d7cc9", "#d0605e", "#8e7cc3"),
    positivo="#17a398",
    negativo="#d0605e",
    divergente=("#c4504e", "#f4f5f6", "#138f86"),
    sequencial=("#f0f7f7", "#c3e5e2", "#7fcbc4", "#2ea79c", "#0f766e", "#0e2a3b"),
)

ESCURO = Tema(
    nome="escuro",
    fundo="#0e1318",
    texto="#f2f6f8",
    texto_2="#a6b3bd",
    texto_3="#76828b",
    grade="#1f272e",
    eixo="#56636d",
    sombra="#161d23",
    regua="#50ddd5",
    principal="#d5dde2",
    destaque="#50ddd5",
    outros="#4c575f",
    categorica=("#d5dde2", "#22a8a0", "#b8841c", "#3f7fe0", "#e05a55", "#8a70e0"),
    positivo="#3ad693",
    negativo="#fd736d",
    divergente=("#e05a55", "#222a31", "#22a8a0"),
    sequencial=("#132226", "#134a47", "#16736d", "#1f9c94", "#3fc9c0", "#a6f0eb"),
)

TEMAS = {"claro": CLARO, "escuro": ESCURO}

# Arial/Helvetica: o padrão de facto em research sell-side e no FMI.
# Disponível em qualquer Windows/Mac, então a figura sai igual na máquina de todos.
FONTES = ["Arial", "Helvetica", "Liberation Sans", "DejaVu Sans"]

# Tamanhos em pontos para figura de 6,5 pol (coluna de relatório A4/Carta).
T = {
    "eyebrow": 6.5,
    "titulo": 10.5,
    "subtitulo": 8,
    "painel": 8,
    "painel_unidade": 7,
    "tick": 7,
    "rotulo": 7,
    "anotacao": 6.5,
    "legenda": 7,
    "fonte": 6,
}

LARGURA = {"inteira": 6.5, "meia": 3.15, "slide": 10.0, "social": 5.4}
