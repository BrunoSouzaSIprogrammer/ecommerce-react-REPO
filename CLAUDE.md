# CLAUDE.md

Instruções do projeto **Mazza Moda Masculina** — e-commerce de roupas masculinas.

---

## Visão geral

- **Frontend:** React (CRA) em `mazza-moda-masculina/` (porta 3000). React Router, Context API (Auth + Cart).
- **Backend:** Node.js + Express em `backend/` (porta 5000). Firebase Admin SDK, JWT, Multer.
- **Banco:** Firebase Firestore (projeto `mazza-store`).
- **Integrações externas:**
  - **Mercado Pago** — PIX (QR + copia-e-cola) e Cartão de Crédito/Débito. Marketplace split 95/5 via `marketplace_fee`.
  - **Frenet** — cálculo de frete (múltiplas transportadoras, sem contrato direto Correios).
  - **Resend** — envio de emails transacionais (ainda não implementado).
  - **JWT** — autenticação de sessão.
- **ADMIN master:** `jackfrostbr3210@gmail.com` (definido em `backend/.env` via `ADMIN_EMAIL`). Apenas este pode promover outros a ADMIN.

## Estrutura de pastas

```
backend/
  config/         # firebase.js, upload.js (multer), credenciais (IGNORADAS)
  controllers/    # auth, categorias, produtos, pedidos, pagamentos, frete, cupons, favoritos, webhooks, oauthMp, financeiro
  middlewares/    # auth.js (JWT + isAdmin)
  routes/         # endpoints Express (espelham controllers)
  services/       # frenet.js, mercadopago.js (SDKs/integrações externas)
  shared/         # filtros.js (fonte única de categorias/filtros — espelhado no frontend)
  uploads/        # imagens de produtos (IGNORADO pelo Claude)
  server.js       # bootstrap
mazza-moda-masculina/
  src/
    components/   # Navbar, ProductCard, CartSidebar, AvaliacaoModal, Admin/* (PedidosManager, CuponsManager, FavoritosRanking)
    context/      # AuthContext, CartContext
    pages/        # Home, Login, Register, Admin, Cart, Catalogo, Checkout, Produto, MeusPedidos, PedidoDetalhe, MeusFavoritos, PagamentoResultado
    hooks/        # useTheme (dark/light)
    services/     # api.js (axios)
    utils/        # filtros.js (espelho do backend), pedidoStatus.js, viacep.js
    styles/       # CSS modular (theme.css define variáveis CSS)
```

## Convenções

- **Idioma:** código e mensagens em **português-BR** (variáveis, rotas, mensagens de erro).
- **Rotas backend:** `/produtos`, `/categorias`, `/pedidos`, `/pagamentos`, `/frete`, `/favoritos`, `/cupons`, `/financeiro`, `/webhooks`, `/admin/mp-oauth`, `/auth/*`.
- **Auth:** JWT no header `Authorization: Bearer <token>`. Middleware em `backend/middlewares/auth.js`.
- **Uploads:** Multer salva em `backend/uploads/`, servido via `app.use("/uploads", express.static(...))`.
- **Imagens de produto:** `.png` ou `.jpeg`, 450x600px (validar no upload).
- **Tema:** `useTheme` hook + variáveis CSS em `src/styles/theme.css` (modos claro/escuro).
- **Responsivo:** todo CSS precisa funcionar em PC, Android e iOS (mobile-first quando possível).

## Variáveis de ambiente (`backend/.env`)

Nunca versionar. O arquivo real está em `.gitignore` e `.claudeignore`. Chaves usadas:

- `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- `ADMIN_EMAIL`, `ADMIN_SENHA`
- `FIREBASE_PROJECT_ID`
- `COMISSAO_PADRAO` (% da comissão do ADMIN sobre cada venda)
- `MERCADO_PAGO_ACCESS_TOKEN` (conta seller MAZZA)
- `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_REDIRECT_URI` (OAuth marketplace)
- `FRENET_TOKEN`, `CEP_ORIGEM` (Frenet API + CEP de envio da loja)
- `RESEND_API_KEY` (a configurar na fase 7)

## Categorias e filtros

As categorias suportadas são: `camisetas`, `blusas`, `calcas`, `bermudas`, `shorts`,
`calcados` (tênis/chinelos), `bones`, `acessorios`, `cobra-dagua`. Cada categoria tem seu
próprio conjunto de filtros (ver arquitetura completa no repositório principal / prompt inicial).
Regra especial: em `shorts`, se o tipo for `Mauricinho`, o range de tamanho muda para `P/M/G/GG`
em vez de `36–48`.

## Fluxos importantes

- **Pedido:** cliente fecha compra → status inicia em `Em produção` → quando postado → `Enviado` (com código de rastreio) → quando entregue → `Recebido` (dispara modal de avaliação 1–5 estrelas + comentário). Rastreio via Frenet quando disponível; fallback: ADMIN atualiza status manualmente.
- **Cupom:** código + % de desconto + escopo (categoria, filtros, ou valor total com mínimo).
- **Favoritos:** ADMIN vê lista de produtos mais favoritados (input para decisão de promoção).
- **Remoção automática:** estoque zerado → produto removido da vitrine automaticamente.

## Regras de trabalho com o Claude

- Não tentar implementar múltiplas features grandes em um único passe — priorizar uma fase por vez.
- Sempre ler o arquivo antes de editar. Evitar refatorações colaterais que não foram pedidas.
- Não criar arquivos de documentação (`*.md`, README novos) a menos que solicitado.
- Nunca commitar credenciais, `.env`, ou service accounts.
- Ao adicionar endpoints, atualizar `server.js` e o `api.js` do frontend em conjunto.
- Ao adicionar CSS, usar as variáveis de `theme.css` para manter consistência claro/escuro.

---

## gstack

Use the `/browse` skill form gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

### Available skills

- `/office-hours` - YC Office Hours barinstorming
- `/plan-ceo-review` - CEO/founder-mode plan review
- `/plan-eng-review` - Eng manager-mode plan review
- `/plan-design-review` - Designer's eye plan review
- `/design-consultation` - Design system consultation
- `/deign-shotgun` - Generate multiple design variants
- `/review` - Pre-landing PR review
- `/ship` - Ship workflow (tests, review, PR)
- `/land-and-deploy` - Merge PR and deploy
- `/canary` - Post-deploy canary monitoring
- `/benchmark` - Performance regression detection
- `/browse` - Headless browser for QA and browsing
- `/connect-chrome` - Launch real Chrome controlled by gstack
- `/qa` - QA test and fix bugs
- `/qa-only` - QA report only (no fixes)
- `/design-review` - Visual QA and fix
- `/setup-browser-cookies` - Import browser cookies
- `/setup-deploy` - Configure deployment settings
- `/retro` - Weekly engineering retrospective
- `/investigate` - Sestematic debugging
- `/document-release` - Post-ship docs update
- `/codex` - OpenAI Codex CLI wrapper
- `/cso` - Chief Security Officer audit
- `/autoplan` - Auto-review pipeline
- `/careful` - Safety guardrails for desctructive commands
- `/freeze` - Restrict edits to a directory
- `/guard` - Full safety mode (careful + freeze)
- `/unfreeze` - Clear freeze boundary
- `/gstack-upgrade` - Upgrade gstack to latest
