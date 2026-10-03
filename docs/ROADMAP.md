# Portteira — roadmap do marketplace

Revisão: 24/09/2026. Este plano substitui a sequência anterior de evolução das quatro frentes. O escopo confirmado agora é o marketplace; social, agenda de eventos, mensagens, comunidades e consulta independente de cavalos não integram este roadmap.

## Incremento atual

| Frente             | Entrega                                                                          | Situação e limite                                                 |
| ------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Navegação          | Mercado, Favoritos, Meus anúncios e Preferências; Anunciar e detalhe na pilha    | Rotas anteriores redirecionadas, mantendo o código-fonte anterior |
| Anúncios           | Formulário validado e persistência local                                         | Não publica na internet nem envia fotos                           |
| Continuidade local | Favoritos, preferências e histórico persistidos no aparelho                      | Sem contas, backend ou sincronização                              |
| Recomendação       | Ordenação por regras com preferências, visitas, favoritos e exclusões explícitas | Sem aprendizado de máquina ou dados entre usuários                |
| Associações        | Contratos de identificação e evidência para ABCCMM e ABQM                        | Acesso real ainda não configurado                                 |
| Selos              | Estados, validação de evidência e vínculo com associação/registro                | Nenhum selo oficial emitido na execução atual                     |

O catálogo fictício anterior continua disponível para avaliar a descoberta. Anúncios criados pelo usuário têm procedência local. A eventual permanência de código social, de eventos ou de pesquisa de cavalos é preservação do trabalho anterior.

## Próximos marcos

| Marco                                 | Trabalho necessário                                                                                                | Critério de avanço                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 1 — Validar a experiência local       | Ensaiar criar anúncio, reabrir app, favoritar, ajustar preferências, ocultar/restaurar e navegar por links antigos | Fluxos claros; sem confusão entre demonstração, anúncio local e publicação online             |
| 2 — Preparar publicação real          | Definir identidade de anunciante, contato, estados do anúncio, backend, autorização e armazenamento de mídia       | Anúncios acessíveis somente com as permissões corretas e operações confirmadas pelo servidor  |
| 3 — Conectar ABCCMM e ABQM            | Obter canal autorizado, documentação, campos, condições de uso e ambiente de teste                                 | Busca por nome e identificação por registro validadas com dados reais e autorização de acesso |
| 4 — Ativar selos com evidência        | Verificar no servidor, mapear títulos específicos, tratar homônimos, ausência de dados e correções                 | Cada selo rastreável ao mesmo animal e à conquista oficial, com data e fonte                  |
| 5 — Avaliar recomendações em uso real | Definir métricas de descoberta, favoritos e contatos; observar resultados e ajustar regras                         | Relevância demonstrada sem perder controle do usuário, variedade e explicabilidade            |
| 6 — Preparar distribuição             | Revisar experiência nativa, acessibilidade, desempenho, políticas e configuração de distribuição                   | Validação em iOS/Android e dependências operacionais concluídas                               |

Os marcos são planejamento; não autorizam, por si, contratação, contato com associações, publicação nas lojas ou uma operação externa. Não é necessário aguardar uma integração oficial para desenvolver e validar a criação de anúncios sem selo.

## Dependências para fontes e selos

O acesso de consulta em um site não confirma a existência de API pública ou autorização para reutilizar a base. Cada associação precisa ter um adapter que respeite o canal acordado. Não está previsto automatizar login de associados ou contornar CAPTCHA.

Antes de ativar um selo, confirmar:

- Associação e registro do animal selecionado; tratar homônimos e resultados ambíguos.
- Título específico reconhecido pela fonte, com evento, ano, modalidade e categoria.
- URL oficial, data de conferência, histórico de evidência e tratamento de correções.
- Campos permitidos, limites de consulta, atualização e condições para armazenamento e exibição.
- Autenticidade da resposta no servidor; validação de formato no cliente não substitui a fonte confiável.

O provider DEMO serve à avaliação de estados e seleção, sem selo oficial. Na ausência de acesso real, os providers oficiais continuam indisponíveis e o anúncio segue sem verificação.

## Validação do incremento

Executar lint, tipagem, formatação e os testes pertinentes à mudança; registrar resultados efetivamente obtidos no relatório da entrega. O módulo de associações possui testes para identidade, evidência completa, origem oficial, homônimos fictícios, cancelamento e indisponibilidade sem requisição de rede.

As verificações de recomendação precisam cobrir ordenação sem histórico, preferências explícitas, influência limitada de visitas repetidas, favoritos, exclusões e desativação. Persistência deve cobrir carregar dados, salvar antes de confirmar sucesso e manter erro recuperável sem sobrescrever silenciosamente dados que não puderam ser lidos.

Na interface, ensaiar as quatro áreas atuais, criação e detalhe, preço inválido, raça/associação incompatíveis, fonte indisponível, voltar, anúncio desconhecido e reabertura do aplicativo. Preview web, tipagem e testes unitários não substituem testes de gestos, áreas seguras, teclado e armazenamento em aparelhos iOS/Android.

## Decisões ainda necessárias

Marca Portteira, foco no marketplace e associações ABCCMM/ABQM já estão confirmados. Permanecem para etapas dependentes: regiões e público inicial, política de contato, validação de anunciantes, direitos de mídia, operação e atendimento, método de autenticação e termos das integrações. Pagamentos, financiamento e checkout não fazem parte da entrega atual.

O histórico da alteração está em [MARKETPLACE_UPDATE_2026-09-24.md](MARKETPLACE_UPDATE_2026-09-24.md).
