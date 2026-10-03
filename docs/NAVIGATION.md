# Portteira — navegação do marketplace

Revisão: 24/09/2026. Este contrato substitui a navegação anterior por Social, Eventos, Mercado e Cavalos. O foco atual é somente o marketplace.

## Destinos principais

Quatro abas inferiores organizam tarefas do marketplace: **Mercado**, **Favoritos**, **Meus anúncios** e **Preferências**. Mercado é a entrada inicial. A criação e o detalhe de um anúncio ficam na pilha, com retorno à origem.

| Destino            | Rota pública             | Função                                            |
| ------------------ | ------------------------ | ------------------------------------------------- |
| Mercado            | /marketplace             | Descobrir, pesquisar, filtrar e ordenar anúncios  |
| Favoritos          | /favorites               | Consultar anúncios salvos neste aparelho          |
| Meus anúncios      | /my-listings             | Consultar e gerenciar anúncios criados localmente |
| Preferências       | /preferences             | Definir interesses e controlar a personalização   |
| Anunciar           | /marketplace/create      | Criar um anúncio local validado                   |
| Detalhe do anúncio | /marketplace/listing/:id | Ler o anúncio e acessar suas ações disponíveis    |

O grupo de abas do Expo Router não aparece nas URLs. A rota raiz encaminha para Mercado. A biblioteca visual, quando disponível, é uma ferramenta técnica de revisão, fora da navegação de produto.

## Continuidade e recuperação

Abrir um anúncio mantém o contexto de origem. Voltar usa o histórico existente e recupera a lista de onde o usuário veio; uma abertura direta sem histórico usa Mercado como destino de recuperação. IDs ausentes ou desconhecidos produzem um estado recuperável, sem selecionar outro anúncio por aproximação.

Rotas antigas de Social, Eventos e Cavalos, incluindo seus detalhes, redirecionam ao marketplace. O código-fonte dessas experiências é preservado; elas não continuam como módulos navegáveis. A consulta da associação pertence ao formulário de anúncio, sem reabrir uma área independente de pesquisa de cavalos.

A aba Favoritos representa salvamentos locais, e Meus anúncios representa criação local. Seus rótulos e mensagens não podem sugerir que existe uma conta autenticada ou um catálogo publicado para outras pessoas.

## Criar anúncio e consultar a associação

A ação Anunciar abre /marketplace/create. O formulário mantém um fluxo único para as categorias e mostra campos de animal apenas para Cavalos. Mangalarga Marchador usa ABCCMM; Quarto de Milha usa ABQM.

Digitar o nome inicia a tentativa de pesquisa na associação correspondente. A busca e seus estados não alteram a navegação global. Nenhum resultado é selecionado apenas por semelhança de nome. O contrato permite escolher um candidato e vincular associação e registro; na execução atual, o acesso oficial está indisponível.

A mensagem de indisponibilidade permite continuar sem selo. Um selo futuro deve abrir sua comprovação: animal identificado, fonte, data da conferência e, quando for conquista, evento, ano, modalidade e categoria. A demonstração fictícia, se usada em revisão de desenvolvimento, precisa ficar separada das opções oficiais.

Salvar exige validação e gravação local bem-sucedida. O texto da ação e do retorno devem deixar claro que o anúncio está neste aparelho. Não há fluxo de upload, autenticação, pagamento ou publicação online nesta etapa.

## Preferências e descoberta

Pesquisa, filtros e ordenação pertencem ao Mercado. O detalhe apresenta a procedência do anúncio; o motivo da recomendação explica sua presença na descoberta, sem sugerir verificação do vendedor ou animal.

Preferências reúne interesses por categoria e raça, estado, orçamento e controles de personalização. A limpeza de histórico e a restauração de anúncios ocultos são ações distintas. Desativar personalização não apaga anúncios próprios ou favoritos.

A ação de desinteresse retira o anúncio da descoberta. A navegação deve permitir restaurar os ocultos sem exigir uma conta ou serviço externo.

## Critérios de aceitação

- A entrada inicial é Mercado e apenas as quatro áreas do marketplace aparecem nas abas.
- Criação e detalhes abrem com retorno visível; destinos inválidos oferecem recuperação.
- As rotas anteriores não reativam Social, Eventos ou Cavalos.
- Abrir um anúncio de Favoritos, Meus anúncios ou Mercado conserva o contexto ao voltar.
- Os rótulos distinguem conteúdo demonstrativo, criação local e futura verificação oficial.
- Erros de formulário, armazenamento e associação permitem continuar ou tentar novamente quando aplicável.
- No dispositivo, validar teclado, área segura, texto ampliado, leitor de tela e retorno do sistema.

As rotas locais não demonstram que Universal Links/App Links de produção estejam configurados. A publicação e a verificação de links em iOS/Android continuam dependentes de domínio, build e ensaios próprios.
