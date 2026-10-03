# Segurança e privacidade

Status: modelo de ameaça inicial e requisitos de implementação futura. Revisão: 17/09/2026. O shell possui dados fictícios e contratos locais; não implementa um sistema de segurança de produção.

## O que existe e o que está planejado

| Área                      | Nesta fundação                              | Antes de dados reais                                          |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Contas/sessões            | Ausentes                                    | Autenticação, revogação, recuperação e rate limiting          |
| Autorização               | Sem backend e sem dados privados            | Políticas por recurso verificadas no servidor                 |
| Validação                 | Schemas e contratos de dados demonstrativos | Validação de todas as entradas HTTP e integrações             |
| Upload                    | Ausente                                     | Autorização, inspeção de arquivos e storage privado           |
| Mensagens/grupos privados | Documentados                                | Controle por participante, convites e trilha de acesso        |
| Moderação                 | Modelo planejado                            | Denúncia, bloqueio, remoção, atendimento e auditoria          |
| Associações               | Apenas mocks                                | Contrato de acesso, direitos de uso e credenciais de servidor |
| Publicação em lojas       | Arquitetura considerada                     | Evidências de privacidade, permissões e fluxos operacionais   |

Validação local reduz erros de desenvolvimento; não substitui validação e autorização no backend. Rotas protegidas do Expo Router controlam navegação no cliente, como descreve a [documentação de autenticação do Expo](https://docs.expo.dev/router/advanced/authentication/); APIs continuarão responsáveis por acesso a dados.

## Ativos e fronteiras de confiança

Ativos futuros: credenciais, dados pessoais, relações sociais, contatos de anunciantes, localização, mensagens, mídia privada, dados licenciados de associações e poderes administrativos. Fronteiras: dispositivo → API; API → PostgreSQL/storage; API → fornecedores; usuário comum → moderação/admin; conteúdo público → conversas privadas.

O dispositivo é controlável pelo usuário. IDs opacas, botões ocultos, rotas protegidas, claims enviados pelo cliente e links internos não são evidência suficiente de permissão.

| Ameaça                         | Exemplo                                                   | Controle obrigatório na fase correspondente                                            |
| ------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| IDOR/acesso cruzado            | Trocar ID para ler conversa ou editar anúncio de terceiro | Autorizar recurso e ação no servidor, escopo de consulta e testes negativos            |
| Escalada de privilégio         | Perfil “organizador” conseguir administração global       | Papéis com escopo, deny by default e atribuições auditadas                             |
| Roubo/reuso de sessão          | Refresh token capturado ou reutilizado                    | Armazenamento seguro nativo, hash no servidor, rotação, detecção de reuso e revogação  |
| Enumeração                     | Descobrir emails registrados ou participantes privados    | Respostas uniformes quando necessário, limites e consultas sem vazamento               |
| Spam/abuso                     | Criação massiva de posts, convites e mensagens            | Rate limiting por ator/operação, quotas e controles de bloqueio/moderação              |
| Upload hostil                  | Arquivo com extensão enganosa ou tamanho abusivo          | Inspeção de assinatura/MIME, limites, processamento isolado e quarentena               |
| Vazamento de mídia             | URL permanente de imagem privada compartilhada            | Storage privado, URLs curtas autorizadas e invalidação quando viável                   |
| SSRF/links maliciosos          | Servidor buscar URL fornecida no anúncio                  | Restringir esquemas/destinos; não fazer fetch arbitrário; controlar redirecionamentos  |
| Exposição de localização       | Coordenada exata de haras ou residência em perfil         | Precisão mínima, finalidade explícita, publicação controlada e consentimento aplicável |
| Abuso administrativo           | Moderador acessar conteúdo fora do seu contexto           | Menor privilégio, auditoria restrita e revisão de ações                                |
| Uso indevido de dados oficiais | Copiar proprietário ou pedigree sem licença               | Provider autorizado, minimização, origem e retenção por acordo                         |

## Autenticação e sessões planejadas

Escolher método de autenticação antes da fase 6 e registrar a decisão. Se houver senha, usar algoritmo de derivação apropriado com parâmetros revisados; limitar tentativas e proteger recuperação. Não criar login social, SMS ou serviço de identidade sem avaliar custos e requisitos de produto.

Access tokens terão vida curta definida pela análise de risco. Refresh tokens terão rotação por família, hash no servidor, expiração, revogação por dispositivo e revogação total. Expulsão, suspensão e exclusão da conta invalidam sessões conforme política. WebSockets devem detectar expiração e revogação, não somente validar o handshake.

Tokens nativos persistidos precisam de armazenamento seguro apropriado; não usar storage genérico como cofre. Se o cliente web passar a ter autenticação real, definir sessão específica para web com proteção contra XSS/CSRF e cookies adequados; não presumir equivalência ao ambiente nativo.

## Autorização planejada

RBAC com escopo fornece papéis; ownership, estado do recurso, participação e bloqueios completam a decisão. Toda ação nasce negada e é concedida por política explícita. Uma política recebe ator, ação e recurso, e consulta estado confiável.

- Perfil: edição pelo titular ou ação administrativa autorizada e registrada.
- Evento/anúncio: edição pelo responsável ou membro com permissão da organização.
- Comunidade pública: administração e moderação limitadas à comunidade.
- Conversa: leitura/envio por participante elegível, com regras de entrada, saída e bloqueio.
- Mídia: acesso herdado do contexto ou política explícita; posse de URL não deve ser um modelo permanente de permissão.
- Fonte externa: campos exibidos dependem de autorização/licença, mesmo que retornados pelo provider.

Testar acesso negado entre dois usuários reais de teste, entre organizações e entre conversas. Filtros na UI não contam como controle. FKs e constraints preservam integridade, mas não substituem autorização. RLS no PostgreSQL poderá ser defesa adicional se adotada e testada; não está implementada nem presumida.

## Conteúdo, moderação e operação

Antes de receber UGC real, disponibilizar termos/regras, denúncia, bloqueio, contato de suporte e capacidade de agir sobre conteúdo. A interface administrativa completa pode vir depois; as proteções essenciais não podem esperar a fase 13. A [diretriz 1.2 da Apple](https://developer.apple.com/app-store/review/guidelines/) prevê filtragem, denúncia com resposta, bloqueio e contato; a [política de UGC do Google Play](https://support.google.com/googleplay/android-developer/answer/9876937) também exige termos, moderação e controles adequados às interações.

Denúncia de mensagem deve capturar apenas evidência necessária e disponibilizá-la a equipe autorizada. Não prometer criptografia ponta a ponta; o modelo de proteção de mensagens ainda precisa ser decidido. Administradores não devem navegar livremente por conversas privadas.

Logs não incluem senha, tokens, corpo de mensagens ou payloads pessoais completos. Eventos administrativos registram ator, ação, alvo, resultado e motivo, com integridade, acesso limitado e retenção definida. Plano de incidentes, backups criptografados e testes de restauração entram antes de produção.

## Dados pessoais e permissões

Mapear finalidades, bases legais, compartilhamentos, retenção e direitos por categoria de dado antes de coletar informações pessoais reais. A [LGPD, texto oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), orienta necessidade, transparência, segurança e direitos do titular. O projeto ainda precisa de políticas e revisão jurídica adequada ao público e às operações; este documento não certifica conformidade.

Localização, câmera, biblioteca de fotos e push só devem ser solicitados no contexto da ação correspondente, com explicação e alternativa quando possível. O shell não precisa dessas permissões para consultar mocks. Não coletar localização contínua, agenda de contatos ou dados de dispositivo sem finalidade definida. Remover metadados de localização de mídia quando não forem necessários.

Público etário e tratamento de dados de menores permanecem pendentes. Não cadastrar menores nem declarar faixa etária final das lojas sem política apropriada. A ausência de analytics nesta entrega evita coleta antes de essa definição.

Variáveis `EXPO_PUBLIC_*` ficam acessíveis no bundle, conforme a [documentação do Expo](https://docs.expo.dev/guides/environment-variables/). Não colocar segredos nessas variáveis, em app config público, fixtures, logs ou repositório. Credenciais de associações e storage ficam no servidor, com rotação e menor privilégio.

O exemplo atual contém somente `EXPO_PUBLIC_DATA_MODE=mock`, validado por Zod; `.env` é opcional e fica ignorado pelo Git, enquanto `.env.example` pode ser versionado. Não existe segredo necessário para abrir a prévia. A publicação usa um repositório próprio limitado aos arquivos do aplicativo; dados salvos no navegador não fazem parte do deploy.

## Preparação para App Store e Google Play

Esta é uma lista de trabalho pendente, não uma declaração de aptidão para publicação:

- Identidade de desenvolvedor, marca, bundle identifier/package name definitivos e domínio controlado.
- Termos, política de privacidade, regras de comunidade, canal de suporte e equipe de moderação.
- Inventário de dados/SDKs e declarações de privacidade/Data safety coerentes com o comportamento real.
- Fluxo verificável de exclusão de conta e dados, com retenções legalmente justificadas e comunicadas. A [Apple exige início de exclusão no app para apps com criação de conta](https://developer.apple.com/support/offering-account-deletion-in-your-app); o [Google Play também requer um recurso web para solicitar exclusão](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
- Configuração e testes de permissões, links universais/app links, negação de acesso e cancelamento. [Links verificados exigem configuração do aplicativo e do domínio](https://docs.expo.dev/linking/overview/); nomes de desenvolvimento não substituem essa infraestrutura.
- Testes em dispositivos iOS/Android, VoiceOver/TalkBack, tamanhos de fonte, rede ruim, sessão revogada e conta excluída.
- Direitos de imagem e de dados confirmados; remover fixtures demonstrativas de qualquer apresentação que alegue catálogo real.

Fontes oficiais consultadas em 16/09/2026. Políticas de lojas e requisitos legais devem ser reconferidos antes da submissão e quando o tratamento de dados mudar.
