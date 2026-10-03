# Decisões de arquitetura e produto

Registro inicial: 16/09/2026; revisão de implementação: 17/09/2026. “Aceita para a fundação” não significa implementação de todas as fases. “Proposta para backend” registra uma direção revisável antes de haver dados persistidos.

## ADR-001 — Entregar fundação e shell antes de serviços reais

**Status:** aceita para a fundação.

O repositório inspecionado continha skills e seu lockfile, sem aplicação prévia. A execução cria documentação, design system, Expo e quatro frentes com mocks. Backend, contas, uploads, realtime e integrações permanecem fora desta entrega. Isso permite validar informação e navegação antes de comprometer contratos de produção. Arquivos existentes de skills devem ser preservados.

Na fundação, o Git encontrado era de um diretório ancestral e não exclusivo do aplicativo. Em 02/10/2026 foi criado um repositório próprio na raiz deste projeto, sem alterar arquivos ou configuração do ancestral.

## ADR-002 — Monorepo com npm workspaces

**Status:** aceita para a fundação.

Usar `apps/mobile` e `packages/domain`, com um lockfile. Contratos puros e Zod podem ser reutilizados por testes e backend futuro. Evitar orquestrador adicional, pacotes vazios e dependência do domínio em React. npm foi escolhido pela disponibilidade e suficiência para duas unidades; reavaliar tooling apenas quando escala de build justificar.

## ADR-003 — Expo, React Native, TypeScript strict e Expo Router

**Status:** aceita para a fundação.

Manter a stack preferida do briefing. Versões ficam registradas em manifests/lockfile e devem ser compatíveis com o SDK efetivamente instalado. A [documentação do Expo para monorepos](https://docs.expo.dev/guides/monorepos/) foi consultada em 16/09/2026. Não acrescentar plugins ou configurações históricas do Metro sem necessidade demonstrada.

## ADR-004 — Quatro tabs e detalhes no stack raiz

**Status:** aceita para a fundação; rótulos sujeitos a teste de usabilidade.

Social, Eventos, Mercado e Cavalos oferecem acesso direto às quatro intenções principais. “Mercado” é o rótulo compacto do Marketplace; a rota permanece `/marketplace`. “Cavalos” recebe contexto de pesquisa independente para evitar confusão com a categoria de venda. Social é a entrada inicial reversível. O stack raiz preserva a origem de detalhes acessados pelo feed ou listas. Grupos e mensagens terão caminhos documentados, sem tabs ou telas falsas funcionais agora. Ver [NAVIGATION.md](NAVIGATION.md).

## ADR-005 — Um sistema visual compartilhado

**Status:** aceita para a fundação.

Tokens semânticos, tipografia, espaçamento, bordas, estados e primitives são comuns. Cards variam conforme a informação que precisam apresentar. A direção deve transmitir tradição e credibilidade com sobriedade, sem dourado excessivo, couro artificial, efeitos decorativos ou aparência de dashboard. Marca e identidade definitiva seguem pendentes. Ver [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## ADR-006 — Referência social restrita a evento ou anúncio

**Status:** regra de produto obrigatória.

`PostAttachment` é união discriminada de `event | listing`, opcional e com um destino por post nesta fundação. Não há `horse`. O Marketplace também não vincula automaticamente atributos declarados a uma ficha da base. Uma integração futura exige decisão explícita de produto, autorização das fontes e contratos próprios.

## ADR-007 — Pesquisa independente por provider

**Status:** aceita para a fundação.

`HorseDataProvider` normaliza busca, detalhe, pedigree e filhos. Apenas `MockHorseDataProvider` está disponível. Fontes oficiais têm status de integração indisponível, sem credenciais, scraping ou classes que finjam conectividade. A identidade externa é fonte + ID externo; a UI não depende do formato de uma associação. Dados demonstrativos carregam procedência explícita.

O contrato atual de página inclui total para o conjunto mock. A primeira integração real pode exigir evoluí-lo para contagem opcional; não impor custo ou comportamento não suportado à fonte.

## ADR-008 — NestJS como monólito modular

**Status:** proposta para backend, fase 6.

NestJS atende à preferência do projeto e fornece módulos/injeção úteis para separar domínios em um único serviço. Não há motivação inicial para microservices. Domínios exportam casos de uso/contratos, não repositórios compartilhados. Postgres começa como banco único com ownership lógico de dados por módulo. A [documentação de módulos do NestJS](https://docs.nestjs.com/modules) sustenta o mecanismo técnico; a disciplina de limites continua responsabilidade do projeto.

## ADR-009 — Drizzle e SQL revisável

**Status:** escolha arquitetural para a fase 6; sem dependência instalada agora.

Drizzle foi escolhido por seu desenho próximo de SQL, schema TypeScript, constraints explícitas e migrations SQL revisáveis. Consultas com autorização por recurso e filtros especializados se beneficiam de transparência sobre o SQL produzido. A equipe assume a responsabilidade de projetar consultas, relações e índices.

Prisma continua alternativa viável, com vantagens de ergonomia em CRUD e navegação de relações. Não fundamentamos a escolha em limitações antigas: as [referências atuais de índices do Prisma](https://docs.prisma.io/docs/orm/prisma-schema/data-model/indexes) incluem capacidades que dependem da versão. As fontes do Drizzle para [índices/constraints](https://orm.drizzle.team/docs/indexes-constraints) e [migrations](https://orm.drizzle.team/docs/migrations) foram consultadas em 16/09/2026. Reconfirmar versões na implementação; nenhum ORM fornece autorização automaticamente.

## ADR-010 — Comunidade pública e grupo privado são modelos distintos

**Status:** aceita para o desenho conceitual.

Comunidades públicas pertencem à experiência social com regras e publicações. Grupos privados são conversas com participantes, convites e mensagens. Podem compartilhar mídia e infraestrutura, mas não um modelo genérico cuja flag pública/privada determine toda a UX e segurança. Histórico visível após entrada/saída permanece pendente.

## ADR-011 — Perfil não é papel administrativo

**Status:** aceita para o desenho conceitual.

Usuário possui identidade de conta e perfil público; atuação profissional é uma extensão. Organizações possuem membros e permissões locais. Administrador é um papel autorizado, não uma categoria que o próprio usuário seleciona para ganhar poder. Menor privilégio, ownership e participação serão verificados no servidor.

## ADR-012 — Redis, busca externa e serviços de mídia adiados

**Status:** aceita para a fundação.

Não há cache distribuído, fila, serviço de busca ou fornecedor de storage nesta etapa. PostgreSQL atende o ponto de partida de persistência/busca; índices devem ser orientados às consultas. `MediaStorage` é somente um contrato, sem adapter; vídeo terá integração quando houver processamento real. Redis será avaliado com necessidade de múltiplas instâncias, filas ou coordenação; não é requisito para o shell.

## ADR-013 — Classificados e participação externa

**Status:** regra de produto obrigatória.

Marketplace intermedeia descoberta e contato. Eventos podem apontar para inscrição/ingresso em terceiros. Não construir checkout de cavalos, carteira, escrow, fintech ou ticketing próprio. Links externos devem ter destino claro e validação; links de exemplo não representam integração ativa.

## ADR-014 — Segurança planejada é diferente de segurança implementada

**Status:** aceita para todas as fases.

O shell não tem contas, mensagens privadas ou backend seguro. Contratos e navegação não são controles de acesso. A fase 6 implementará autenticação/autorização e, antes de UGC real, bloqueio, denúncia e operação mínima de moderação. A fase 13 amplia ferramentas; não adia essas proteções. Publicação depende dos critérios de [SECURITY.md](SECURITY.md).

## ADR-015 — Dados fictícios, permissões e imagens

**Status:** aceita para a fundação.

Dados de pessoas, animais, registros, genealogias, eventos e anúncios usados em demonstração devem ser identificados como fictícios. Não solicitar permissões de localização, câmera, biblioteca ou push para recursos que não foram implementados. A origem de cada imagem distribuída está registrada em [ASSETS.md](ASSETS.md). A marca fornecida pelo usuário e os assets gerados nesta publicação substituem os arquivos antigos de origem não documentada.

## ADR-016 — Motion subordinado à compreensão

**Status:** aceita para a fundação.

Usar transições de navegação e feedback de toque para continuidade. Reanimated e gestos complexos entram somente quando apropriados ao componente e à experiência nativa. Respeitar redução de movimento; não adicionar animação decorativa para preencher ausência de funcionalidade. Validar desempenho em dispositivo antes de declarar meta de quadros atingida.

## ADR-017 — Configuração local aceita apenas mocks

**Status:** implementada na fundação.

`EXPO_PUBLIC_DATA_MODE` tem valor permitido e padrão `mock`; o parser Zod rejeita outros valores. `.env.example` documenta a configuração pública, e copiar para `.env` é opcional. Não há API ou credenciais para alternar. Ambientes reais exigem nova configuração validada junto da implementação do backend, mantendo segredos fora do cliente.

## Decisões pendentes e marcos dependentes

| Pendência                            | Alternativa reversível nesta execução                        | Resolver antes de                               |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| Marca e identidade jurídica          | “Equestre” como nome de trabalho                             | Lojas, domínio e comunicação pública            |
| Bundle ID/package name e domínio     | Identificadores de desenvolvimento sem associação verificada | Build de distribuição/universal links/app links |
| Autenticação e recuperação           | Ausência de contas reais                                     | Fase 6                                          |
| Público etário e regiões             | Sem cadastro/coleta real                                     | Políticas e onboarding                          |
| Retenção, exclusão e bases legais    | Modelo documentado, sem dados pessoais reais                 | Persistência real                               |
| Regras/operadores de moderação       | Mocks sem UGC público                                        | Fase 7 com usuários externos                    |
| Licenças de imagem e dados           | Mídia demonstrativa com origem documentada                   | Distribuição pública                            |
| Acesso às associações                | Provider mock identificado                                   | Ativação de qualquer fonte oficial              |
| Contato de anunciantes e verificação | Sem contato/transação real                                   | Fase 9                                          |
| Histórico privado e convites         | Apenas modelo conceitual                                     | Fase 11                                         |
| Monetização                          | Sem cobrança                                                 | Qualquer implementação comercial                |

Uma pendência de lançamento não exige interromper a fundação local. O trabalho que depende dela deve ficar explicitamente sem ativação até a definição correspondente.
