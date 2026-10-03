# Portteira — alteração de escopo em 24/09/2026

## Decisões confirmadas

O usuário definiu o foco exclusivo no marketplace, confirmou a alteração da base existente Equestre e escolheu ABCCMM e ABQM como as primeiras associações. A marca do produto é Portteira.

As duas prioridades são detectar o animal durante a criação do anúncio para atribuir futuramente selos com comprovação oficial e entregar anúncios mais relevantes para cada cliente. O trabalho anterior de Social, Eventos e Pesquisa de Cavalos permanece como código e contexto histórico, fora da navegação atual.

Esta revisão atualiza [PRODUCT.md](PRODUCT.md), [ROADMAP.md](ROADMAP.md) e [NAVIGATION.md](NAVIGATION.md). Documentos técnicos anteriores que descrevem as quatro frentes não ampliam o escopo vigente.

## O que a entrega faz

- Mantém o catálogo fictício anterior, identificado como demonstração.
- Permite criar anúncio validado e salvá-lo localmente com AsyncStorage.
- Persiste favoritos, preferências e eventos de interação somente no aparelho.
- Organiza a navegação em Mercado, Favoritos, Meus anúncios e Preferências, com Anunciar e detalhes na pilha.
- Redireciona as rotas antigas para o marketplace, preservando seu código-fonte.
- Ordena anúncios por regras baseadas em conteúdo, preferências, visitas, favoritos e desinteresse, com explicação e controles.
- Prepara contratos de busca, identidade e verificação para ABCCMM e ABQM.
- Retorna indisponibilidade explícita nos adapters oficiais enquanto o acesso autorizado não estiver configurado.

Não foram entregues publicação online, conta, backend, sincronização, upload de fotos, pagamentos ou conexão real com as associações. O aplicativo não concede selos oficiais nesta execução.

## Identidade e confiança dos selos

O fluxo pretendido começa com nome e associação, apresenta os candidatos quando a integração estiver disponível e exige confirmação do animal correto. A identidade persistente é associação + registro. O nome pode ter homônimos, abreviações ou erros; ele não autoriza um selo.

O domínio distingue pending, unavailable, unverified, verified e demo. Os estados sem verificação não carregam selos. O estado verified exige evidência para cada selo e consistência com a identidade selecionada. As conquistas incluem título, evento, ano, modalidade, categoria, URL oficial e data de conferência.

A validação impede evidência de outro animal, URL de outra associação e conversão de dados DEMO em selo oficial. O algoritmo não deduz campeão pela posição em uma prova ou por texto no nome. A origem do animal e a conquista precisam ser confirmadas pelo adapter autorizado; o schema é uma proteção de formato e vínculo, não autenticação da informação.

Existe um provider de demonstração separado das associações reais. Ele usa a identidade DEMO e animais explicitamente fictícios, incluindo dois nomes iguais com registros diferentes para testar seleção. Seu resultado permanece demo e sem selo.

O módulo de associações foi validado com **21 testes passando**, além de tipagem do pacote de domínio e análise estática dos dois arquivos do módulo. Isso não equivale a testar uma integração oficial ou a homologar o aplicativo em aparelhos.

## Pesquisa de fontes oficiais

Verificação realizada em 24/09/2026, apenas em páginas públicas, sem login, contato ou contorno de bloqueios.

| Fonte                                                                                         | Observação confirmada                                                                            | Limite para o Portteira                                                                                                           |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [ABQM — Consulta de Animais](https://www.abqm.com.br/redirect-abqm/consulta-abqm)             | A consulta existe; o acesso pelo site atual redirecionou para login                              | Não foram examinados campos e resultados após autenticação; consulta web não constitui autorização de integração                  |
| [ABQM — API ABQM](https://qas.abqm.com.br/ABQM_API/)                                          | Página no subdomínio oficial identifica API ABQM, versão 1.100.1.0                               | O link de documentação retornou erro 502; não foram confirmados endpoints utilizáveis, credenciais, produção ou licença comercial |
| [ABCCMM — Consulta de Animais](https://abccmm.org.br/animais)                                 | Página oferece pesquisa pelo nome e apresenta verificação de segurança com CAPTCHA               | Confirma consulta web; não comprova API pública nem acesso automatizado autorizado                                                |
| [ABCCMM — Resultados da Exposição Nacional](https://resultados.abccmm.org.br/Resultados.aspx) | Portal oficial apresenta resultados por campeonatos e categorias de Marcha, Morfologia e títulos | É fonte candidata de comprovação específica; inscrição ou habilitação não equivale a título de campeão                            |

A existência da página API ABQM impede concluir que a associação “não tem API”. A conclusão correta é que **não foi confirmada uma API pública liberada para esta integração**. Tampouco foi confirmada API pública de consulta/premiações da ABCCMM nesta pesquisa.

As fontes são evidência de viabilidade a investigar, não integrações entregues. O acesso por web, mesmo oficial, não define sozinho as condições para copiar, armazenar e exibir os dados no Portteira.

## Recomendação local

A primeira versão usa regras transparentes. Interesses declarados por raça, categoria, estado e orçamento influenciam a ordem; favoritos têm peso maior que visitas. A influência comportamental é limitada, repetições não acumulam peso indefinidamente e sinais antigos perdem força. Recência, preenchimento e variedade complementam a ordenação.

Sem histórico, as preferências declaradas e características dos anúncios oferecem uma ordem inicial. O sistema não atribui interesses inferidos a uma conta, porque não há contas nesta etapa.

O usuário pode desativar personalização e limpar seu histórico. Favoritos salvos continuam disponíveis como coleção mesmo quando seus sinais de recomendação são removidos. Desinteresse é uma exclusão explícita; restaurar anúncios ocultos é separado da limpeza de histórico. A interface explica os motivos de recomendação.

Os dados ficam na instalação e não são enviados a uma plataforma de anúncios ou analytics. Essa primeira versão não utiliza treinamento de modelos, rastreamento externo, recomendações entre pessoas ou métricas de vendas reais.

## Pendências que habilitam os próximos passos

1. Definir e obter um canal autorizado para ABCCMM e ABQM: API, fornecimento de arquivos ou outra parceria explicitamente permitida.
2. Confirmar identificadores, cobertura de resultados, títulos reconhecidos, campos permitidos, atualização, limites e condições de armazenamento/exibição.
3. Implementar a busca e a verificação no backend, com resposta vinculada ao animal selecionado e proteção contra resultados atrasados.
4. Guardar evidência auditável, distinguir consulta inconclusiva de inexistência de título e rever selos quando a fonte corrigir dados.
5. Implementar publicação real, autenticação, autorização do anunciante, contato e mídia antes de apresentar o catálogo como serviço online.
6. Validar a experiência em aparelhos e avaliar a relevância da recomendação com uso real antes de aumentar a complexidade do algoritmo.

Uma conferência manual futura, se adotada, também deverá registrar a fonte oficial e a identidade do animal. Ela não está implementada nesta entrega. Nenhum contato com as associações foi realizado.

## Verificação final da entrega

Em 24/09/2026, `npm run check` terminou com sucesso: lint, tipagem dos dois pacotes, 91 testes do domínio, 3 testes de compatibilidade e formatação. `npm run export:web --workspace @equestre/mobile` também concluiu a exportação.

Na prévia web, em viewport de 390 × 844, foram exercitados: validação do formulário vazio, criação de anúncio fictício com preço de R$ 45.000,50, consulta pendente da ABCCMM, favorito, recarga com anúncio e favorito preservados, retirada do favorito, pausa do anúncio, preferências por categoria/orçamento, alteração da ordem, ocultação e restauração, ordenação explícita por menor preço, tema claro e consulta pendente da ABQM.

O anúncio usado no ensaio se chama “Teste Portteira · animal fictício”, não corresponde a uma oferta real e ficou pausado na instalação local de teste. Os interesses temporários de Equipamentos/orçamento foram removidos ao fim da verificação; o tema voltou à preferência do aparelho. O ensaio não enviou dados às associações.

Não foram executados testes em aparelhos nativos Android/iOS ou com fontes oficiais conectadas. Esses pontos continuam pendentes.
