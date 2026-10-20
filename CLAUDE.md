# Padrão de gráficos Mercurius Research (para analistas e agentes de IA)

Todo gráfico da Mercurius sai deste repositório. O caminho padrão é a biblioteca web
`web/mercurius-charts.js`. A versão Python (`mercurius_charts/`) serve só quando o
destino exige PNG ou SVG estático.

## Fluxo para uma análise nova

1. Copie `analise/` para uma pasta nova (por exemplo `analises/2026-10-halving/`) e ajuste
   os caminhos `../web/`.
2. Ponha os dados em `dados.js` (datas como `"AAAA-MM-DD"`) ou carregue um JSON.
3. Para cada figura, `const [plot] = MC.figura(alvo, {...})` e depois uma função `MC.*`.
   Consulte a galeria (`web/index.html`) e copie o bloco **</> Código** do tipo mais parecido.
4. Confira as duas versões: `<html data-theme="light">` e `"dark"`. Nada pode sobrepor ou cortar.
5. Se faltar um tipo, crie a função em `web/mercurius-charts.js` seguindo o padrão das outras
   (usar `montar`, `tema`, `eixoY`, `tip`, `legenda`) e acrescente um exemplo na galeria.

## Texto

- **Título = conclusão**, em frase ("ETFs voltaram a receber recursos"), nunca só o assunto.
- **Subtítulo = unidade + frequência + período** ("US$ bilhões, semanal, jan/24–dez/25").
- **`fonte:` é obrigatória.** Dados simulados levam "Dados ilustrativos.".
- O título precisa ser verdadeiro para os dados mostrados. Confira o número antes de escrever.
- Números no padrão BR via `MC.F` (1.388 · 27% · −204 · 88 mil · mar/26).

## Visual (não negociável)

- Cores só por papel: `"s1"`…`"s6"` (série, em ordem), `"pos"`/`"neg"` (só polaridade),
  `"outros"` (contexto), `"destaque"`. Nunca hex fixo. Assim os temas claro e escuro funcionam.
- No máximo 6 séries com cor. Da 7ª em diante, use "Outros" ou painéis (`paineis: [...]`).
- **Nada de eixo y duplo.** Escalas diferentes vão em painéis lado a lado.
- Prefira rótulo direto (etiquetas na ponta, rótulos dentro das áreas) a legenda solta.
- Toda figura nova tem tooltip. As funções da biblioteca já trazem.
- Use pizza só para até 5 fatias que somam 100%. Prefira `rosca` ou barras.
