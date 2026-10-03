# Portteira

Marketplace equestre em Expo e React Native, com navegação simples e a identidade visual fornecida pelo responsável pelo produto.

**Versão atual: prévia de demonstração.** O site pode ser acessado por um link público, mas os anúncios criados, favoritos e preferências são guardados somente no navegador ou aparelho de cada visitante. Ainda não existe publicação compartilhada entre pessoas.

## Acessar

- Site: [Portteira no GitHub Pages](https://btcsolucoes.github.io/portteira/)
- Código: [btcsolucoes/portteira](https://github.com/btcsolucoes/portteira)

## Funcionalidades

- Mercado com busca, filtros por categoria, raça e estado, ordenação por preço ou data e sugestões pelos interesses da pessoa.
- Cadastro em três etapas, com preço em reais, seleção do estado pelo nome e revisão antes de salvar.
- Favoritos, ocultar/desfazer e gerenciamento dos anúncios locais: pausar, reativar e marcar como vendido.
- Preferências opcionais, controle do histórico, personalização e temas claro/escuro.
- Lista estável durante a leitura: visitas e favoritos não reposicionam os anúncios sob o toque.
- Contratos preparados para busca de animais e comprovação de conquistas na ABCCMM e ABQM.

## Limites importantes

A busca oficial de animais **não está conectada**: os adapters retornam `access_not_configured`. Nenhum selo oficial de campeão é concedido nesta prévia. A integração exige acesso às fontes das associações e implementação no servidor.

Não há contas, backend, sincronização, fotos enviadas pelo anunciante, contato comercial ou pagamentos. Os exemplos são fictícios. Um anúncio criado em um navegador não aparece para outro visitante, e limpar os dados do navegador remove o conteúdo salvo ali. Não use a prévia como cadastro definitivo de ofertas reais.

## Executar localmente

Requer Node.js 22.13 ou superior.

```sh
npm ci
npm run web
```

Para usar a porta 8082:

```sh
npm run web --workspace @equestre/mobile -- --port 8082
```

Nenhuma chave de API ou arquivo `.env` é necessário. Os pacotes internos mantêm os nomes `equestre` e `@equestre/*` por compatibilidade. A marca, o ícone e os identificadores Expo usam Portteira.

## Validar e compilar

```sh
npm run check
npm run export:pages
```

`check` executa lint, tipagem, testes do domínio e dos scripts de publicação, compatibilidade e formatação. `export:pages` prepara `apps/mobile/dist-pages` para o prefixo `/portteira`, incluindo `.nojekyll`, rotas fixas e fallback de navegação. `PORTTEIRA_BASE_PATH` permite escolher outro prefixo ou a raiz de um domínio.

## Publicação no GitHub Pages

A publicação atual usa o branch `codex/pages`, com o conteúdo compilado na raiz. O código-fonte fica no branch padrão `codex/portteira`. Alterar apenas o código-fonte não atualiza o site: valide com `npm run check`, execute `npm run export:pages` e publique a nova saída no branch do site.

O modelo opcional em `docs/deployment/pages-workflow.yml` está pronto para validação, compilação e publicação automáticas. Ele não está ativo: a credencial usada na entrega não tem permissão para criar workflows. Para adotá-lo futuramente, um administrador com acesso adequado deve colocá-lo em `.github/workflows/pages.yml` e alterar o modo de publicação do Pages para GitHub Actions. Não é necessário nenhum segredo de associação para a prévia.

GitHub Pages não oferece reescritas de servidor: as rotas fixas têm arquivos próprios; uma URL dinâmica de anúncio usa `404.html` para abrir o aplicativo na mesma URL. O servidor pode responder HTTP 404 nessa primeira requisição, embora a interface funcione. Identificadores de anúncios locais só resolvem no navegador onde foram criados.

## Documentação

- [Princípios de simplicidade](docs/UX_PRINCIPLES.md)
- [Produto e limites](docs/PRODUCT.md)
- [Origem da marca e imagens](docs/ASSETS.md)
- [Navegação](docs/NAVIGATION.md)
- [Roadmap](docs/ROADMAP.md)
- [Associações e recomendação](docs/MARKETPLACE_UPDATE_2026-09-24.md)

A prévia web não substitui testes com o público-alvo e homologação em aparelhos Android/iOS. Não foram publicados aplicativos nas lojas.
