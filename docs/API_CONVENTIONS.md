# Contratos e convenções de API

Status: contratos locais executáveis + desenho de API futura. Revisão: 17/09/2026. Não há servidor HTTP, autenticação ou endpoint real nesta execução. URLs abaixo são propostas, não serviços disponíveis.

## Contratos presentes na fundação

`packages/domain` concentra tipos e schemas Zod. Dados que cruzam fronteiras devem ser validados em runtime; TypeScript sozinho não valida JSON recebido. O pacote não conhece componentes React ou persistência.

```ts
type PostAttachment = { type: 'event'; id: string } | { type: 'listing'; id: string };

type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};

type Breed = 'mangalarga-marchador' | 'quarto-de-milha' | 'arabe';
```

`PostAttachment` usa schemas estritos e não aceita uma associação `horse`. A referência é opcional no post. Uma ID existente no cliente nunca prova que o usuário tem acesso ao destino.

Os dados mockados trazem procedência fictícia: `kind: 'fictional'`, `source: 'equestre-demo'` e rótulo explícito de demonstração. Esse tipo não deve ser reutilizado para declarar dados oficiais; a introdução de fontes autorizadas requer uma extensão discriminada de procedência com validação e testes.

### Porta de pesquisa de cavalos

O contrato público previsto nesta entrega é:

```ts
interface HorseDataProvider {
  readonly source: string;
  readonly capabilities: Readonly<{
    search: boolean;
    getById: boolean;
    pedigree: boolean;
    offspring: boolean;
  }>;

  search(request?: HorseSearchRequest, context?: ProviderContext): Promise<Page<Horse>>;
  getById(id: string, context?: ProviderContext): Promise<Horse>;
  getPedigree(id: string, context?: ProviderContext): Promise<HorsePedigree>;
  getOffspring(
    id: string,
    request?: PaginationRequest,
    context?: ProviderContext,
  ): Promise<Page<Horse>>;
}
```

`ProviderContext` aceita `AbortSignal`. `HorseSearchRequest` aceita query, breed, cursor e limit; paginação aceita cursor e limit. A implementação atual aceita páginas de 1 a 50 itens, com padrão 20, e busca de até 200 caracteres. `HorseProviderError` distingue `PROVIDER_UNAVAILABLE`, `NOT_FOUND`, `ABORTED`, `INVALID_CURSOR` e `INVALID_REQUEST`. A UI traduz erros recuperáveis e não deve substituir um erro da fonte por “nenhum resultado”.

O mock compõe a identidade como fonte + identificador externo, com codificação de cada parte, por `makeHorseId`. O consumidor trata a ID como opaca. Em uma rota, o valor deve ser passado como parâmetro do Router, não concatenado sem encoding. Essa composição não é uma credencial nem autorização.

O pedigree mock limita a árvore a três gerações ancestrais, com nós explicitamente desconhecidos. Filhos usam consulta própria paginada; um resultado truncado não pode ser apresentado como genealogia completa. As capacidades oficiais permanecem indisponíveis até integração autorizada.

## HTTP futuro

Proposta: REST JSON em `/v1`, OpenAPI gerada e validada no pipeline do backend. Rotas de navegação mobile e rotas HTTP são contratos diferentes: `/events/:id` abre uma tela; `/v1/events/:id` consultará dados.

| Recurso      | Operações candidatas                                                       | Fase |
| ------------ | -------------------------------------------------------------------------- | ---- |
| Sessões      | `POST /v1/auth/sessions`, refresh e revogação                              | 6    |
| Perfil atual | `GET/PATCH /v1/me/profile`                                                 | 6    |
| Feed/posts   | `GET /v1/social/feed`, `POST /v1/social/posts`, `GET /v1/social/posts/:id` | 7    |
| Eventos      | `GET /v1/events`, `GET /v1/events/:id`                                     | 8    |
| Anúncios     | `GET/POST /v1/marketplace/listings`, `GET /v1/marketplace/listings/:id`    | 9    |
| Cavalos      | `GET /v1/horses`, detalhe, pedigree e filhos                               | 10   |
| Comunidades  | `/v1/groups/:id` para comunidades públicas                                 | 11   |
| Conversas    | `/v1/conversations/:id/messages`                                           | 11   |

Escritas adicionais, payloads de login, filtros e endpoints de exclusão de conta serão definidos junto dos casos de uso. Não criar um catálogo de endpoints vazios. O recurso de conversa privada é separado do recurso público de comunidade, mesmo que a UI use a palavra “grupo”.

## Representação e validação

- JSON usa `camelCase`; arrays são arrays vazios quando conhecidos e vazios. Valores desconhecidos usam a representação definida pelo schema.
- IDs são strings opacas. Datas civis usam `YYYY-MM-DD`; instantes usam ISO 8601 com offset; a API normaliza UTC preservando fuso de evento em campo próprio.
- Dinheiro usa quantidade inteira na menor unidade + código da moeda; não transportar float como valor financeiro de referência.
- Requests rejeitam campos não reconhecidos quando o schema é estrito e impõem limites a texto, arrays, profundidade e arquivos.
- O servidor deriva autor, permissões e ownership da sessão e do recurso; não aceita `userId`, `role` ou `ownerId` enviado pelo cliente como prova de autoridade.
- Ordenação, filtros e campos de busca são allowlists. SQL usa parâmetros; campos de ordenação não são interpolados livremente.
- Escritas retornam a representação canônica relevante para reconciliar a UI, sem expor entidades internas completas do ORM.

## Paginação

Filtros são aplicados antes da paginação. A ordem inclui desempate por ID; cursores pertencem à consulta e não podem ser reaproveitados em filtros diferentes. `nextCursor: null` representa fim da coleção.

O `Page<T>` atual inclui total porque o mock conhece o conjunto completo. Providers reais podem não oferecer contagem exata a custo aceitável; antes da primeira integração, rever o contrato explicitamente para total opcional/estimado, se necessário. Não fabricar total e não executar varredura integral só para preservar o mock.

A API futura deve impor limites de página e usar cursor opaco verificável, além de autorização por recurso em toda consulta. O cursor não é um mecanismo de controle de acesso. Evitar paginação por offset em feed e conversas volumosos; índices e cursor devem refletir a ordenação escolhida.

## Erros HTTP futuros

Adotar payload coerente e seguro, por exemplo:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos informados.",
    "requestId": "opaque-request-id",
    "fields": [{ "path": "title", "code": "TOO_LONG" }]
  }
}
```

O código é estável; a mensagem é apresentável e pode ser localizada. Não devolver stack trace, SQL, segredo, detalhes da sessão ou existência de contas privadas. Códigos HTTP: 400 para contrato inválido, 401 para sessão ausente/inválida, 403 para acesso recusado quando revelar a existência for permitido, 404 para ausência/ocultação de recurso privado, 409 para conflito, 429 para limite e 5xx para falha de serviço. Mapear erros de providers ao contexto HTTP sem perder distinção entre indisponibilidade e vazio.

## Escritas, concorrência e retries

Operações repetíveis, como salvar/favoritar, devem usar identidade composta e semântica idempotente. Criações sujeitas a retransmissão usarão chave de idempotência com escopo por usuário e operação. Retries automáticos só serão aplicados a operações seguras ou protegidas contra duplicação, com backoff e limite; não repetir cegamente envio de mensagens ou criação de anúncios.

Versionamento por `updatedAt`/versão e `If-Match` pode prevenir perda de edição quando houver concorrência real. Transações mantêm estado e eventos duráveis consistentes. A API suporta clientes mobile antigos durante uma janela definida; remoções de campos exigem plano de compatibilidade.

## Upload, links e realtime

O pacote de domínio já define a porta `MediaStorage`, sem adapter: `createUpload` recebe proprietário, nome, content type e tamanho e devolve ID, URL, expiração e headers; `getReadUrl` obtém uma URL temporária; `delete` solicita remoção. A API futura deriva o proprietário de contexto autorizado antes de chamar a porta. O cliente não pode escolher um proprietário arbitrário. A interface não realiza upload nem concede acesso por si só.

Upload futuro: solicitar intenção autorizada → enviar para storage com URL limitada → validar conteúdo → confirmar processamento → disponibilizar variantes. A API não recebe uma URL arbitrária como prova de mídia confiável. Mensagens/mídia privadas não usam objetos publicamente enumeráveis.

Links de inscrição externa aceitam esquemas seguros e destino visível. Credenciais e tokens de sessão não são passados em URL. Compartilhar referência interna exige revalidar a visibilidade do destino para o destinatário.

Realtime autentica conexão e autorização por ação/recurso; participar de um canal não basta. Eventos terão ID, tipo, versão e timestamp, com retomada por cursor e deduplicação. A implementação e garantia de entrega ficam para a fase de mensagens.
