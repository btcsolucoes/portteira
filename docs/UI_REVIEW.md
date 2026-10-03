# Revisão de UI — fonte React Native

Revisão em 17/09/2026. Escopo: `apps/mobile/src/ui`, `components`, `features`, layouts do Expo Router e configuração de aparência/plataforma. Esta rodada é uma **auditoria estática de código**, feita com `impeccable audit.native`, referências iOS/Android e `emil-design-eng`. Não contém captura de Simulator, emulador, dispositivo ou resultado de teste visual no navegador. Os achados descrevem a fonte observada antes das correções integradas; a seção final pode receber as evidências posteriores do fluxo principal.

## Conformidade com as plataformas

**Estrutura aprovada por inspeção; comportamento nativo ainda não aprovado.** A composição usa tabs para os quatro destinos, stack para detalhes, `SafeAreaProvider`, `Pressable`, texto escalável e listas virtualizadas. Não há customização de gesto de voltar nem motion decorativo nas tabs. A direção clara e os ícones Feather são escolhas explícitas e reversíveis do projeto; não foram trocados por SF Symbols/Material apenas por uma preferência da ferramenta.

`Screen` aplica topo e laterais nas tabs, cujo header está oculto. O tab bar cuida da parte inferior. `DetailPage` usa laterais e bottom, enquanto o header nativo do stack cuida do topo. Não foi identificada duplicação de safe area por código. A avaliação de notch, home indicator, barra gestual e teclado depende de execução nativa.

| #         | Dimensão         | Nota do snapshot inicial | Fundamentação                                                                                     |
| --------- | ---------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| 1         | Acessibilidade   | 2/4                      | Labels e estados nas primitivas; metadados de cards e anúncios de resultado iOS incompletos       |
| 2         | Performance      | 3/4                      | FlatList, chaves estáveis, mídia com proporção e cache; sem medição de startup/frames             |
| 3         | Aparência e tema | 3/4                      | Tokens semânticos e contraste calculado; tema claro intencional, dark mode ausente                |
| 4         | Conformidade     | 3/4                      | Navegação e safe areas coerentes; recuperação de detalhes perde o domínio                         |
| 5         | Adaptação        | 2/4                      | Largura máxima e texto flexível; insets de teclado e fontes grandes precisam correção/verificação |
| **Total** |                  | **13/20**                | **Aceitável por fonte, com pendências antes de publicação**                                       |

A nota registra o snapshot inicial anterior às correções integradas abaixo; não é uma certificação de usabilidade ou desempenho. Não significa que 60 fps, VoiceOver, TalkBack, Dynamic Type, multiwindow ou deep links frios tenham sido testados. Depois das correções, atualizar a nota somente com escopo e evidências identificados.

## Achados acionáveis

Prioridade: P1 afeta informação/acesso e deve ser resolvida antes de publicação; P2 tem recuperação, mas prejudica a experiência. Nenhum P0 foi demonstrado nesta inspeção. Foram encontrados **9 pontos: 2 P1 e 7 P2**. A tabela preserva o encaminhamento do snapshot inicial; a atualização após integração está na seção seguinte. Correção de fonte e validação em runtime são estados distintos.

| Prioridade / situação                    | Before                                                                                                                                                                           | After                                                                                                                                                                            | Why                                                                                                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 · Encaminhado                         | `ResultCard` define um único `accessibilityLabel` limitado a “Ver título”; `EventCard`, `MarketplaceCard` e `HorseResultCard` omitem data, preço, cidade ou registro desse nome. | Compor um resumo acessível contextual no ponto de uso: evento + data/local; anúncio + preço/local; cavalo + raça/registro. Manter role de link e esconder ícones decorativos.    | O Pressable agrupa o card para tecnologia assistiva; substituir a leitura dos filhos por um título curto remove informação usada para escolher antes de abrir.                                                      |
| P1 · Encaminhado                         | As FlatLists de busca não configuram ajuste de inset de teclado ou estratégia equivalente; `keyboardShouldPersistTaps` só controla taps.                                         | Aplicar `automaticallyAdjustKeyboardInsets` no iOS, permitir dismiss ao arrastar e verificar o redimensionamento/IME no Android.                                                 | No iOS o ajuste automático de teclado é `false` por padrão. Ocultar a tab bar não acrescenta por si só espaço para rolar os resultados acima do teclado. Oclusão exata depende do dispositivo.                      |
| P2 · Encaminhado                         | `MissingDetail` sempre executa `router.replace('/social')`, inclusive para cavalos, eventos e anúncios.                                                                          | Receber fallback do domínio e conservar a origem quando houver histórico válido. Na abertura sem histórico, evento → eventos, anúncio → marketplace, ficha → cavalos.            | Um ID inválido na pesquisa independente não deve levar a outra área. O comportamento atual também contradiz `NAVIGATION.md`.                                                                                        |
| P2 · Encaminhado                         | `BreedFilters` e categorias de Marketplace são faixas horizontais com indicador oculto.                                                                                          | Quebrar filtros em linhas com gap consistente; se a faixa horizontal for mantida após teste, explicitar que há mais opções.                                                      | Opções ficam fora do primeiro campo visual, e o controle de 48 deve continuar legível com fonte ampliada. A estratégia de wrap já consta no sistema de design.                                                      |
| P2 · Encaminhado                         | Contadores de Eventos, Marketplace e Cavalos usam apenas `accessibilityLiveRegion="polite"`.                                                                                     | Preservar live region no Android e anunciar mudanças no iOS com `AccessibilityInfo`, agrupando alterações rápidas para evitar uma fala por tecla.                                | `accessibilityLiveRegion` não fornece o anúncio equivalente no VoiceOver. Quem filtra precisa saber quando o resultado mudou sem explorar novamente a tela toda.                                                    |
| P2 · API corrigida; aplicar na tela      | O Chip de genealogia informa `selected`, mas não `expanded`.                                                                                                                     | `Chip` agora aceita `expanded?: boolean`; passar `expanded={showPedigree}` em `HorseDetailScreen`. A seleção visual permanece possível, e a semântica passa a informar expansão. | Abrir/recolher genealogia altera a visibilidade de conteúdo. O leitor de tela deve receber o estado expandido/recolhido, não apenas uma seleção de filtro.                                                          |
| P2 · Encaminhado                         | A tab usa “Marketplace”, embora a documentação tenha escolhido o rótulo curto “Mercado”.                                                                                         | Usar “Mercado” visualmente, com nome acessível completo quando necessário, e verificar fonte máxima em telefone estreito.                                                        | Quatro tabs dividem a largura; um rótulo longo aumenta o risco de corte quando a fonte cresce. Esta é divergência concreta de texto, não uma afirmação de truncamento já observado.                                 |
| P2 · Corrigido em UI                     | Limpar a busca desmonta o botão que recebeu foco, sem devolver o foco a um destino explícito.                                                                                    | `SearchField` mantém ref do TextInput e chama `focus()` após limpar.                                                                                                             | A busca permanece pronta para a próxima consulta e teclado/foco externo têm destino previsível quando o controle de limpar desaparece.                                                                              |
| P2 · Encaminhado como validação dirigida | O stack define `initialRouteName: '(tabs)'`, cuja entrada é Social, sem fallback específico para links diretos de outros domínios.                                               | Testar cold start em cada detalhe e implementar retorno à lista do domínio quando necessário, preservando back normal em abertura interna.                                       | Existe risco verificável pela configuração de a ficha aberta diretamente retornar à Social. O resultado do Expo Router em dispositivo ainda precisa ser observado; não foi declarado como falha visual reproduzida. |

## Atualização após integração

Releitura da fonte confirmou que o fluxo principal corrigiu `MissingDetail` com fallback por domínio e preservação de histórico, removeu `initialRouteName` e acrescentou botão de voltar com fallback em cada detalhe. Os resumos acessíveis dos cards passaram a incluir metadados de escolha. Esses pontos estão corrigidos por fonte; comportamento de gesto e links diretos continua pendente de execução.

Os filtros horizontais serão mantidos para preservar densidade, com indicador e instrução visível de deslize; essa alternativa atende à necessidade de indicar opções fora da área visível e deverá passar pelo teste de fonte ampliada. O anúncio automático de contagens no iOS permanece uma pendência assumida da fundação: o contador continua disponível à leitura manual. Ajustes de teclado, rótulo Mercado e aplicação de `expanded` foram encaminhados ao fluxo principal.

Após instalar as dependências, `npm run typecheck --workspace @equestre/mobile` concluiu com exit code 0 nesta rodada. A verificação cobre compatibilidade de tipos, incluindo `SearchField` e `Chip`, sem comprovar layout ou comportamento nativo.

## Localização e encaminhamento

As linhas abaixo identificam o snapshot auditado, anterior a possíveis reformatações/correções do fluxo principal.

| Achado               | Fonte observada                                                                                                                                                   | Categoria      | Próxima ação                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| Resumo dos cards     | `components/ResultCard.tsx:7`; `features/events/EventCard.tsx:10`; `features/marketplace/MarketplaceCard.tsx:11`; `features/horse-database/HorseResultCard.tsx:9` | Acessibilidade | `$impeccable harden`: fornecer resumo completo e validar VoiceOver/TalkBack |
| Teclado              | `features/events/EventsScreen.tsx:12`; `features/marketplace/MarketplaceScreen.tsx:13`; `features/horse-database/HorsesScreen.tsx:23`                             | Adaptação      | `$impeccable adapt`: insets + rolagem/dismiss no teclado                    |
| Recuperação de ID    | `components/DetailPage.tsx:20`                                                                                                                                    | Conformidade   | `$impeccable harden`: fallback por domínio                                  |
| Filtros ocultos      | `components/BrowseHeader.tsx:20`; `features/marketplace/MarketplaceScreen.tsx:15`                                                                                 | Adaptação      | `$impeccable adapt`: layout dos filtros e fonte ampliada                    |
| Resultado no iOS     | `features/events/EventsScreen.tsx:13`; `features/marketplace/MarketplaceScreen.tsx:17`; `features/horse-database/HorsesScreen.tsx:26`                             | Acessibilidade | `$impeccable harden`: anúncio de status agrupado                            |
| Genealogia           | `features/horse-database/HorseDetailScreen.tsx:43`; `ui/Chip.tsx`                                                                                                 | Acessibilidade | Aplicar `expanded` e verificar anúncio                                      |
| Rótulo da tab        | `src/app/(tabs)/_layout.tsx:9`                                                                                                                                    | Adaptação      | `$impeccable clarify`: rótulo curto consistente                             |
| Foco ao limpar       | `ui/SearchField.tsx`                                                                                                                                              | Acessibilidade | Corrigido; verificar teclado/foco real no preview e dispositivo             |
| Volta de link direto | `src/app/_layout.tsx:9`                                                                                                                                           | Conformidade   | `$impeccable harden`: cold/warm deep links                                  |

## Correções realizadas nesta rodada

Somente `ui/SearchField.tsx` e `ui/Chip.tsx` receberam alterações. O primeiro recupera o foco ao limpar; o segundo expõe estado de expansão e não declara seleção de filtro quando está sendo usado para disclosure. Não foram alteradas telas, configurações, dados ou regras de domínio nesta rodada de revisão.

Não foi rodado `impeccable detect`: a referência `audit.native` orienta revisão da fonte nativa e explicita que o detector web não se aplica. Também não foram executadas entrevistas ou mudanças de direção estética; o briefing e o design system já estabelecem essa direção.

## Decisões a preservar

- As quatro listas principais usam `FlatList`; o detalhe usa ScrollView para conteúdo limitado e informativo.
- A estrutura do provider cancela buscas anteriores, evitando que uma resposta atrasada substitua a pesquisa mais recente.
- O detalhe de cavalo expõe origem de demonstração e não atribui dados às associações oficiais.
- Botões, ícones e chips partem de alvo mínimo 48; texto usa escala do sistema sem teto artificial nas primitivas.
- Estados vazios oferecem ação de recuperar busca; falhas do provider oferecem retry; nenhum estado simula uma transação real.
- Conteúdo e controles não dependem de hover, motion, swipe ou imagem para serem compreendidos.
- A política de Reduce Motion é observada no stack; tabs usam `animation: 'none'`, e skeletons são estáticos.
- O contraste está centralizado e calculado: texto/canvas 13,12:1, muted/canvas 5,27:1 e branco/primary 11,67:1. Esses cálculos são evidência de cores, não captura de tela.

## Validação pendente e limites de produto

A configuração anuncia suporte a tablet iOS, mas a composição atual só limita a largura a 760. Não há evidência de comportamento em iPad, Android tablet, split view ou janelas expandidas. Antes de publicação, verificar essas classes e decidir uma navegação adaptada à largura real. Não introduzir rail apenas para declarar cobertura sem inspecionar a experiência.

Tema escuro não é suportado nesta fundação; `userInterfaceStyle` é `light`, de forma coerente com os tokens. Essa é limitação documentada, não um tema escuro supostamente aprovado. Fotografias são ilustrativas e identificadas como tal. FPS, tempo de partida, peso do binário e consumo de memória não foram medidos.

Próxima rodada deve cobrir, em lote: telefone estreito e landscape; maior texto suportado; teclado aberto; VoiceOver/TalkBack; gesto de voltar; links diretos válidos/inválidos; safe areas; tablet quando anunciado. Após correções, usar `$impeccable audit` para registrar evidência e `$impeccable polish` apenas para o ajuste final delimitado. Esses nomes indicam o tipo de revisão; nenhuma nova autorização é necessária para as correções já solicitadas.

## Evidências visuais e execução posterior

Nenhuma evidência visual foi produzida nesta rodada. O responsável pelo fluxo principal pode acrescentar aqui: ambiente e plataforma, viewport/dispositivo, estado de fonte e teclado, rotas exercitadas, caminhos das capturas, defeitos reproduzidos/corrigidos e limitações. Preview web deve ser identificado como web; não substitui aprovação nativa.

Referências consultadas: [React Native ScrollView — insets de teclado](https://reactnative.dev/docs/scrollview#automaticallyadjustkeyboardinsets-ios), [React Native TextInput — foco](https://reactnative.dev/docs/textinput#focus) e [React Native Accessibility](https://reactnative.dev/docs/accessibility).

O loader de contexto da skill encontrou `docs/PRODUCT.md`, mas não reconheceu `docs/DESIGN_SYSTEM.md` como seu `DESIGN.md` e sinalizou ausência de schema/plataforma em seu formato próprio. As referências nativas foram carregadas manualmente, conforme o alvo Expo/iOS/Android explícito. Não houve migração lateral dos documentos: eventual adequação ao formato da skill pertence ao fluxo `impeccable init/document`, sem bloquear esta revisão.
