# Portteira — produto e escopo

Revisão: 24/09/2026. Este documento substitui o escopo de quatro módulos da fundação de 17/09/2026. O foco atual é exclusivamente o marketplace. Social, agenda de eventos e pesquisa independente de cavalos ficam fora da navegação e do incremento atual.

## Proposta

O Portteira ajuda compradores a encontrar anúncios relevantes de cavalos, equipamentos, produtos e serviços equestres. Nesta etapa, o produto combina um catálogo demonstrativo com anúncios criados e salvos no próprio aparelho. Ainda não é um serviço de publicação online.

As duas prioridades confirmadas são identificar o animal anunciado em fontes de ABCCMM e ABQM, para futuramente exibir selos com evidência, e ordenar os anúncios de acordo com os interesses de cada pessoa.

## Experiência disponível

| Área                    | Comportamento                                                                                                                   | Limite                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Mercado                 | Catálogo, busca, filtros, detalhe e ordenação personalizada por regras                                                          | O catálogo inicial é fictício; não representa ofertas reais                         |
| Favoritos               | Salvar e retirar anúncios dos favoritos                                                                                         | Dados disponíveis somente nesta instalação                                          |
| Meus anúncios           | Consultar anúncios locais e gerenciar seu status                                                                                | Nenhum anúncio é publicado para outros usuários                                     |
| Anunciar                | Formulário validado com categoria, título, descrição, preço, localização e anunciante; atributos de animal na categoria Cavalos | Persistência local; sem upload de fotos, conta ou envio a servidor                  |
| Preferências            | Escolher interesses e controlar personalização, histórico e anúncios ocultos                                                    | Perfil do aparelho, sem sincronização entre contas ou dispositivos                  |
| Identificação do cavalo | Nome inicia a busca na associação escolhida; contrato suporta associação e registro                                             | Providers oficiais retornam indisponibilidade enquanto não houver acesso autorizado |

A navegação principal é Mercado, Favoritos, Meus anúncios e Preferências. A criação e os detalhes de anúncio abrem em uma pilha de navegação. As rotas antigas têm redirecionamento ao marketplace; o código anterior pode continuar no repositório, sem representar módulos ativos.

## Anúncios e armazenamento

As categorias permanecem Cavalos, Equipamentos, Produtos e Serviços. Um novo anúncio de cavalo usa Mangalarga Marchador/ABCCMM ou Quarto de Milha/ABQM. O nome é obrigatório para o animal; o registro, quando informado, participa da identidade com a associação. A validação rejeita a combinação incompatível de raça e associação.

O catálogo demonstrativo preexistente é mantido e pode incluir conteúdos fora das duas raças habilitadas para novos anúncios. Isso não amplia o escopo de integração. Dados fictícios e anúncios locais têm indicações de procedência distintas.

Anúncios criados, favoritos, preferências e eventos de interação são persistidos com AsyncStorage no aparelho. A gravação local não constitui publicação, reserva, negociação ou transação. Não há contas, autenticação, backend, sincronização ou processamento financeiro. Imagens do catálogo são demonstrativas; a criação não faz upload de mídia.

Falhas de carregamento ou gravação devem aparecer como erro recuperável. A interface só pode confirmar que um anúncio foi salvo depois da gravação bem-sucedida. Limpar dados do aplicativo ou perder a instalação pode remover os dados locais.

## Identificação e selos

O nome serve para encontrar candidatos; não autoriza um selo. A identidade que vincula um resultado ao anúncio é a combinação **associação + número de registro**. Havendo homônimos ou dúvida, será necessário selecionar e confirmar o animal correto. O registro também não confirma, sozinho, propriedade ou autorização para venda.

O contrato de verificação distingue:

| Estado      | Significado                                                     |
| ----------- | --------------------------------------------------------------- |
| pending     | Verificação em andamento para uma identidade definida           |
| unavailable | Fonte sem acesso configurado ou temporariamente indisponível    |
| unverified  | Resultado insuficiente, ausente ou ambíguo                      |
| verified    | Evidência validada e vinculada à identidade consultada          |
| demo        | Dados fictícios isolados, sem elegibilidade para selos oficiais |

Os selos previstos no modelo são Registro e Campeão. Cada selo verificado exige título, identidade, URL oficial da associação e data de conferência. Uma conquista exige também evento, ano, modalidade e categoria. Nome, posição isolada em prova, inscrição ou habilitação para um evento não geram automaticamente um título de campeão.

Nesta execução, os providers de ABCCMM e ABQM retornam explicitamente acesso não configurado. **Nenhum selo oficial é concedido no fluxo atual.** O modelo de evidências foi implementado e testado, mas isso não comprova a conexão com uma fonte real. A demonstração de busca é um provider separado, com associação DEMO e nomes fictícios, sem promover seus dados a verificação oficial.

O fluxo de anúncio pode continuar sem selo. Fonte indisponível significa que a consulta não foi concluída; não significa que o animal não tenha registro ou premiações.

## Personalização

A ordenação usa regras locais compreensíveis, sem um modelo treinado. Considera raça, categoria, estado e orçamento escolhidos, visitas aos anúncios, favoritos, recência e preenchimento do anúncio. Interações repetidas têm influência limitada; o peso do comportamento diminui com o tempo. A ordenação também procura variar anúncios com relevância semelhante.

As preferências explícitas têm prioridade sobre sinais de navegação. O favorito é um sinal mais forte que a visita. A ação “Não tenho interesse” oculta o anúncio da descoberta, inclusive com a personalização desativada; restaurar anúncios ocultos é um controle separado.

A interface apresenta o motivo da recomendação. Desativar a personalização interrompe o uso dos sinais de visita/favorito para ordenar e apresenta os mais recentes primeiro. Limpar histórico remove esses sinais sem apagar a coleção de favoritos, os anúncios criados ou as exclusões explícitas. As preferências salvas continuam controláveis.

Sem histórico, a ordem utiliza as preferências declaradas e características dos anúncios. Não há rastreamento externo, perfil entre contas, recomendação colaborativa ou medição de conversão real nesta etapa. Recomendar um anúncio não verifica a qualidade do animal ou a reputação do vendedor.

## Critérios de aceite

- Apenas o marketplace está na navegação principal.
- Anúncios locais, favoritos e preferências permanecem após reabrir o app, quando a gravação foi concluída.
- Dados demonstrativos e dados informados pelo anunciante permanecem identificáveis.
- Nome ou homônimo nunca concede selo; evidência de outra identidade é rejeitada.
- Indisponibilidade da associação permite continuar sem atribuir prêmio ou registro verificado.
- Personalização explica a ordenação e oferece desativação, limpeza de histórico e restauração dos ocultos.
- Rotas antigas e IDs inválidos têm saída recuperável.
- A interface não anuncia publicação online, integração oficial ou upload que não foram executados.

## Dependências futuras

A publicação para compradores reais requer backend, identidade e autorização de anunciantes, armazenamento de mídia, política de contato e operação do marketplace. Selos funcionais requerem canal autorizado com ABCCMM e ABQM, conferência no servidor e acompanhamento de correções e atualizações da evidência.

Fontes e decisões desta revisão estão em [MARKETPLACE_UPDATE_2026-09-24.md](MARKETPLACE_UPDATE_2026-09-24.md). O plano vigente está em [ROADMAP.md](ROADMAP.md). Documentos anteriores sobre social, eventos, mensagens ou uma consulta independente devem ser lidos como contexto histórico, não como compromissos deste incremento.
