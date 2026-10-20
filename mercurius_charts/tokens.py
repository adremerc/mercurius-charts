"""Tokens de marca Mercurius para gráficos.

Cores extraídas do design system de mercuriuscrypto.com e ajustadas para
leitura em gráfico. As paletas categóricas foram validadas (banda de
luminosidade, croma, separação para daltonismo deutan/protan/tritan e
contraste com o fundo). Não invente cores novas: use os papéis abaixo.
"""

from dataclasses import dataclass, field

# --- Cores de marca (site) -------------------------------------------------
MARCA = {
    "superficie_0": "#070c10",
    "superficie_1": "#0e1318",
    "superficie_2": "#161b20",
    "texto_1": "#f2f6f8",
    "texto_2": "#a6b3bd",
    "texto_3": "#76828b",
    "texto_4": "#4c575f",
    "acento": "#50ddd5",      # teal da marca (botões, destaques)
    "neon": "#02fef3",        # só para assinatura/logo, nunca em dados
    "positivo": "#3ad693",
    "negativo": "#fd736d",
    "alerta": "#f4c352",
    "info": "#59c5f5",
}


@dataclass(frozen=True)
class Tema:
    nome: str
    fundo: str
    texto: str            # títulos, valores
    texto_2: str          # eixos, legendas
    texto_3: str          # notas, fonte
    linha_fina: str       # réguas, grid, bordas de tabela
    principal: str        # série protagonista (o "preto" do estilo XP)
    destaque: str         # série/coluna a destacar (o "amarelo" do estilo XP)
    outros: str           # "Outros", contexto, séries de fundo
    categorica: tuple     # ordem FIXA — nunca reordene, nunca gere a 7ª cor
    positivo: str
    negativo: str
    divergente: tuple     # (polo negativo, meio neutro, polo positivo)
    sequencial: tuple     # do mais claro ao mais escuro, um só matiz
    cabecalho_tabela: str
    texto_cabecalho: str
    faixa_tabela: str     # fundo de linhas de subtotal / seções


CLARO = Tema(
    nome="claro",
    fundo="#ffffff",
    texto="#0e1318",
    texto_2="#4c575f",
    texto_3="#76828b",
    linha_fina="#d5dadd",
    principal="#1f2529",
    destaque="#1aa39b",
    outros="#c5cdd3",
    # validada: L 0.43–0.77, croma ≥ 0.1, ΔE CVD ≥ 18 entre vizinhas
    categorica=("#1f2529", "#1aa39b", "#3b6fd4", "#e8a317", "#8a6bd6", "#e2605a"),
    positivo="#1aa39b",
    negativo="#e2605a",
    divergente=("#e2605a", "#f3f5f6", "#1aa39b"),
    sequencial=("#e6f6f5", "#b3e6e2", "#6fcdc6", "#1aa39b", "#0b6e69"),
    cabecalho_tabela="#1f2529",
    texto_cabecalho="#ffffff",
    faixa_tabela="#eef1f3",
)

ESCURO = Tema(
    nome="escuro",
    fundo=MARCA["superficie_1"],
    texto=MARCA["texto_1"],
    texto_2=MARCA["texto_2"],
    texto_3=MARCA["texto_3"],
    linha_fina="#2a3238",
    principal="#c9d2d8",
    destaque=MARCA["acento"],
    outros="#4c575f",
    # validada contra #0e1318: L 0.48–0.67, ΔE CVD ≥ 16 entre vizinhas
    categorica=("#c9d2d8", "#22a8a0", "#3f7fe0", "#b8841c", "#8a70e0", "#e05a55"),
    positivo="#3ad693",
    negativo="#fd736d",
    divergente=("#e05a55", "#2a3238", "#22a8a0"),
    sequencial=("#163634", "#145a56", "#1a8a83", "#2fbdb5", "#7fe6e0"),
    cabecalho_tabela=MARCA["superficie_2"],
    texto_cabecalho=MARCA["acento"],
    faixa_tabela="#161b20",
)

TEMAS = {"claro": CLARO, "escuro": ESCURO}

# --- Tipografia ------------------------------------------------------------
# Preferências na ordem; a primeira instalada (ou em mercurius_charts/fonts) vence.
FONTE_TEXTO = ["Inter", "Segoe UI", "Arial", "DejaVu Sans"]
FONTE_TITULO = ["Outfit", "Inter", "Segoe UI", "Arial", "DejaVu Sans"]
FONTE_MONO = ["JetBrains Mono", "Consolas", "DejaVu Sans Mono"]

# Tamanhos em pontos (impressão A4; figura "inteira" ≈ 17 cm de largura)
TAMANHO = {
    "titulo_figura": 10.5,
    "unidade": 10.5,
    "eixo": 8,
    "rotulo": 8,
    "rotulo_total": 8.5,
    "legenda": 8,
    "fonte": 6.8,
    "assinatura": 7,
}

# Larguras padrão (polegadas). "inteira" = coluna cheia de um relatório A4.
LARGURA = {"inteira": 6.9, "meia": 3.35, "slide": 11.0, "social": 6.0}
