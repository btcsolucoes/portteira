# Sistema de design Equestre — Contemporary Equestrian

## Leitura e limites desta fase

Comunidade, descoberta e pesquisa equestre para públicos de diferentes idades e letramentos digitais, com interface Contemporary Equestrian destinada a iOS e Android e preview web de verificação. Dials: variação 5/10, motion 2/10, densidade útil 7/10. A identidade vem da fotografia, do verde profundo, do marfim quente e da precisão da informação; os controles continuam familiares.

A primeira fase valida Feed, Marketplace e Ficha de Cavalo em claro e escuro. A composição das demais telas não faz parte deste redesign. As quatro frentes permanecem independentes e só há vínculos do Social para Eventos e Marketplace.

## Auditoria e decisões anteriores à implementação

| Before                                                                     | After                                                                         | Why                                                                      |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Títulos de 32 px com serif e slogans ocupam boa parte do primeiro viewport | Cabeçalhos compactos; Figtree para funções, nomes e preços                    | O conteúdo de decisão deve aparecer cedo e ser fácil de ler              |
| Um único tema claro exportado estaticamente                                | Papéis semânticos independentes para claro e escuro                           | Fotografias, contraste e controles precisam funcionar nos dois contextos |
| Cards, bordas pesadas e grandes arredondamentos repetidos                  | Feed aberto; anúncios comparáveis; ficha em grupos e divulgações progressivas | A estrutura deve refletir a tarefa de cada domínio                       |
| Todos os filtros com a mesma força visual das ações                        | Controles neutros; seleção com check, texto e verde                           | Menor competição com fotos e informação principal                        |
| Cobre tratado como qualquer texto                                          | Cobre decorativo e `accentText` com contraste próprio                         | A cor original não garante leitura de texto pequeno                      |
| Skeleton e controles sem sistema de motion explícito                       | Skeleton estático; feedback opcional de pressão de 120 ms                     | Motion serve ao feedback e respeita a preferência do sistema             |

## Arquitetura de tokens

Fonte de verdade: `apps/mobile/src/ui/theme.ts`.

1. `primitiveTokens`: valores brutos de cor, espaçamento, raio e tamanho.
2. `semanticTokensByScheme`: papéis de uso para cada tema; não existe inversão automática.
3. `themes.light.components` e `themes.dark.components`: decisões de botão, campo, chip, tela e skeleton que apontam para os papéis semânticos.

`theme`, `semanticTokens` e `componentTokens` exportam o tema claro apenas para compatibilidade transitória. Interfaces em execução consomem `useTheme` ou `useThemedStyles`; não capturam cor estática fora do componente.

| Papel            | Claro   | Escuro  |
| ---------------- | ------- | ------- |
| background       | #F7F4ED | #0B0F0E |
| surface          | #FFFFFF | #141917 |
| surfaceSecondary | #EEEAE2 | #1D2421 |
| textPrimary      | #171B19 | #F2EEE6 |
| textSecondary    | #59635E | #B4BDB8 |
| brand            | #0F4A3A | #6BC6A8 |
| brandPressed     | #0B382C | #50A98C |
| accent           | #D07A46 | #E58A52 |
| border           | #DDDCD6 | #2D3531 |

Os aliases `text`, `muted`, `primary`, `primaryPressed`, `subtle`, `danger` preservam APIs existentes. `brandSoft` é uma superfície para seleção; sage `#9BAE9E` permanece primitivo de marca. Verde identifica ações e seleção. Cobre é reservado a prêmios ou detalhes editoriais; não é CTA principal. `accentText` oferece uma variante escura no tema claro para texto sobre `accentSubtle`. `onPrimary` é branco no claro e quase preto no escuro. `controlBorder` identifica campos; `border` é apenas divisor. Sucesso, aviso e erro recebem cor e texto/iconografia.

## Tipografia, espaço e forma

Figtree é embarcada em quatro pesos (400/500/600/700) via expo-font, sem chamadas a serviço de fontes em uso. A personalidade humana da família e sua consistência entre plataformas justificam o recurso local. A família de cada peso define o desenho; não sintetizar negrito sobre outro arquivo. Serif pode existir somente na assinatura editorial, nunca em preço, filtro ou ficha.

| Papel    | Tamanho / entrelinha | Peso | Uso                                  |
| -------- | -------------------- | ---- | ------------------------------------ |
| display  | 32 / 38              | 600  | Uso editorial excepcional            |
| title    | 26 / 32              | 700  | Nome de animal ou título de tela     |
| heading  | 20 / 26              | 600  | Seção principal                      |
| body     | 16 / 24              | 400  | Leitura e legenda                    |
| label    | 15 / 20              | 600  | Ação e controle                      |
| caption  | 13 / 18              | 400  | Contexto secundário                  |
| price    | 22 / 28              | 700  | Preço comparável                     |
| numeric  | 18 / 24              | 600  | Quantidade, data ou estatística      |
| metadata | 13 / 18              | 500  | Registro, localização e proveniência |

Preços e números usam algarismos tabulares. `AppText` permite escala de fonte e não impõe teto nem altura fixa. Textos longos quebram; não reduzir a fonte para fazê-los caber. Margens laterais usuais: 16. Ritmo: 4, 8, 12, 16, 20, 24, 32. Grupos relacionados usam 8–12; grupos distintos, 16–24. 48 existe para alvo de toque e situações excepcionais. Raios: 8 / 12 / 16; pill é reservado a avatar ou chip apropriado. Superfícies são planas, sem sombras ornamentais. Sheet pode usar scrim de fundo para preservar contexto e foco.

## API e primitivas

```tsx
import { ThemeProvider, useTheme, useThemedStyles, type Theme } from '@/ui';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    surface: { backgroundColor: theme.colors.surface },
  });

function Example() {
  const { theme, styles } = useThemedStyles(createStyles);
  const { scheme, preference, setPreference } = useTheme();
  // preference: 'system' | 'light' | 'dark'; escolha local à sessão.
}
```

`ThemeProvider` acompanha o tema do sistema enquanto preference é `system`; a escolha explícita permanece em memória durante a sessão. `ThemeToggle` oferece uma ação acessível para alternar a aparência. A preferência não altera domínio nem persiste dados do produto.

| Componente    | Responsabilidade                                                                          |
| ------------- | ----------------------------------------------------------------------------------------- |
| AppText       | Nove papéis tipográficos; cor semântica atual; escala de texto                            |
| Button        | Primary, secondary, ghost; foco, pressão, desabilitado, carregando                        |
| IconButton    | Nome acessível obrigatório; selecionado; alvo 48; feedback opcional                       |
| SearchField   | Label acessível, label visível por padrão, foco, limpar sem perder foco, teclado de busca |
| Chip          | Check e semântica de seleção; expanded opcional para divulgação progressiva               |
| Screen        | Safe areas e largura máxima de leitura; a tela escolhe scroll e gutters                   |
| Badge         | Estado textual discreto; cobre com contraste correto em premiações                        |
| StateView     | Loading, empty, error com mensagem e recuperação                                          |
| Skeleton      | Reserva estática de conteúdo; excluído da árvore acessível                                |
| SectionHeader | Agrupamento por título, descrição e ação visível                                          |

Busca compacta pode usar `visuallyHiddenLabel` quando o contexto já informa sua finalidade; o nome acessível continua obrigatório. Não usar essa opção para formulários extensos. Textos de ação dizem o resultado: Ver evento, Ver anúncio, Limpar filtros. Ícones Feather acompanham texto em navegação e ações principais. Ícones decorativos não duplicam o nome acessível.

## Composição das telas de referência

Feed: autor/contexto → mídia → ações → legenda → resumo de comentários e vínculo contextual. Evitar borda ao redor de todo post. Marketplace: busca e intenção explícita → filtros selecionados → preço e informações comparáveis → localização e favorito. Ficha: nome/raça/registro → dados básicos → pai/mãe → pedigree, filhos, prêmios e resultados por divulgação progressiva. Não inventar informação ausente ou exibir mídia de exemplo como fotografia documental.

## Estados, acessibilidade e motion

Todos os alvos interativos têm pelo menos 48 × 48. Foco recebe contorno sem mudança de bounds. Estados de seleção combinam contraste, peso e check. Inputs mantêm nome acessível mesmo quando o label visual é omitido. Skeletons não pulsam. Erros têm texto e recuperação; carregamento bloqueia envio duplicado. Nenhum gesto é o único meio de executar uma ação.

O gate de motion aceita apenas feedback de toque, opcional, em IconButton: transformação 0,97 em 120 ms, curva `cubic-bezier(0.23, 1, 0.32, 1)`, Reanimated CSS transition. Não há animação de layout nem ciclo infinito. A preferência de redução de movimento desativa a escala, inclusive quando alterada durante a sessão. Navegação de tabs não desliza; transições de stack pertencem à plataforma. Fluidez real ainda exige build release no aparelho Android mais lento suportado.

## Aplicação das skills e verificação

`design-system` orienta as três camadas e os contratos; `mobile-design` determina densidade, toque, escala e ergonomia; `react-native-design` orienta StyleSheet, memoização de estilos e componentes nativos; `animate-expo` define o gate e a implementação de feedback; `emil-design-eng` orienta pressão, foco e continuidade. A revisão das Golden Screens pelo fluxo principal aplica também `impeccable` e `ui-ux-pro-max`. Consultar os arquivos de auditoria para resultados observados, sem confundir diretriz com teste concluído.

Referências de implementação: [React Native Accessibility](https://reactnative.dev/docs/accessibility), [Text](https://reactnative.dev/docs/text), [Reanimated reduced motion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/) e [CSS transitions](https://docs.swmansion.com/react-native-reanimated/docs/css-transitions/transitionDuration/). A validação por preview web não substitui VoiceOver, TalkBack, fonte máxima, orientação, sol e teclado em aparelhos reais.
