# Padrão Mercurius Research: instruções para analistas e agentes de IA

Este repositório define como **todo** gráfico e relatório da Mercurius deve sair.
Ao produzir uma análise aqui, siga estas regras sem exceção.

## Fluxo de trabalho

1. Dados em `pandas.DataFrame`: índice = eixo x (anos/datas/categorias), colunas = séries.
2. Uma figura por pergunta: `fig, ax = mc.figura(titulo, unidade=..., numero=N, fonte=...)`.
3. Escolha o tipo pela tarefa dos dados (tabela no README). Nunca use `ax.bar`/`ax.plot` cru
   se houver função pronta. Se faltar um tipo, adicione-o em `graficos.py` seguindo o mesmo padrão.
4. `mc.salvar(fig, "saida/figNN")` gera PNG e SVG.
5. Para relatório: `mercurius_charts.relatorio.Relatorio` (veja `exemplos/relatorio_exemplo.py`).
6. Abra os PNGs e confira se há rótulos sobrepostos ou cortados antes de entregar.

## Regras de conteúdo

- **Título = o que o gráfico mostra**, curto ("Capex por empresa"), e a unidade vai em `unidade=`
  ("US$ bilhões", "% a/a", "índice, base 100").
- **`fonte=` é obrigatória.** Formato: "Glassnode, DefiLlama e Mercurius Research." Dados
  simulados levam "Dados ilustrativos.".
- Notas metodológicas curtas vão em `nota=`; as longas vão no texto do relatório.
- Projeções usam o sufixo `e` (2026e) e `projecao_desde=` quando houver.
- Números em padrão BR via `mercurius_charts.formato`: `num`, `pct`, `pp`, `moeda`, `eixo_data`.
  Ponto separa milhar, vírgula separa decimal e o sinal de menos é tipográfico (−).
- Parágrafo de relatório: abre com a **frase-tese em negrito** (`**...**`) e segue com a
  evidência em números.

## Regras visuais (não negociáveis)

- Cores apenas do tema (`mc.tema_atual()`): `principal`, `destaque`, `outros`,
  `categorica[0..5]`, `positivo`/`negativo`, `divergente`, `sequencial`. Nunca escreva hex à mão.
- No máximo 6 séries com cor. Da 7ª em diante, agrupe em "Outros" (`t.outros`) ou use small multiples.
- A cor segue a entidade: BTC tem sempre a mesma cor em todas as figuras do relatório.
- **Nada de eixo y duplo.** Escalas diferentes viram `grade=(1, 2)`.
- Sem pizza 3D, sem gradiente decorativo e sem sombra. Rosca só para até 3 fatias; prefira barras.
- Texto nunca leva a cor da série: valores e rótulos usam cores de texto.
- Positivo/negativo (teal/coral) só para polaridade, nunca como "série 5".
- Tema `claro` para PDF e relatório; tema `escuro` para app, site e redes sociais.

## Tamanhos

- `largura="inteira"` (6,9 pol) para coluna cheia do A4 e `"meia"` (3,35 pol) para lado a lado.
- `"slide"` para apresentações e `"social"` para posts.
- `altura` é a altura total. Para barras e linhas use 2,8 a 3,4; para small multiples 2×4, 3,6 a 4,0.
