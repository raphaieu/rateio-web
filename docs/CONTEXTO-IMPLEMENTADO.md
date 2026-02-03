# Rateio Justo — Contexto e Estado da Implementação

Documento de referência para manter o contexto do projeto e o que já está implementado/funcional (atualizado em fev/2025).

---

## 1. Visão do Produto (PRD)

- **O que é:** Webapp mobile-first para dividir contas de forma justa, item a item (bar/restaurante). A ideia é **saber quem consumiu o quê** para cada um pagar **apenas a sua parte** ao estabelecimento — não dividir igualmente entre todos.
- **Proposta de valor:** Justiça (cada um paga só o que consumiu ao estabelecimento), rapidez, clareza.
- **Fluxo MVP:** Criar rateio → Participantes → Itens (manual / colar texto / IA) → Extras → Revisão → **Desbloquear valores** (PIX da taxa do app) → Ver quanto cada um paga ao estabelecimento → Link público read-only.
- **Semântica da Revisão:**
  - **Total da conta:** Só para **conferência** com a conta física do estabelecimento (double check). Não é valor a “pagar” no app.
  - **Desbloquear valores:** O usuário paga apenas a **taxa do app via PIX**. Depois disso, os valores **por pessoa** são exibidos (quanto cada um deve pagar ao estabelecimento). A soma desses valores fecha o total da conta.
- **Monetização:** Taxa do app (PIX) para desbloquear o rateio; custo variável se usar IA; wallet de créditos; sem assinatura no MVP.
- **Regras:** Só o criador edita; link público só após pagamento da taxa; preços vêm do backend; preço congelado na revisão.

---

## 2. Stack

| Camada   | rateio-web (front)     | rateio-api (back)              |
|----------|------------------------|---------------------------------|
| Runtime  | Vue 3 + Vite           | Node (Hono)                     |
| Lang     | TypeScript             | TypeScript                      |
| UI       | Tailwind, shadcn-vue   | —                               |
| State    | Pinia                  | —                               |
| Auth     | Clerk (Vue)            | Clerk (JWT, backend)            |
| DB       | —                      | Drizzle + Turso (SQLite)        |
| Pagamento| —                      | Mercado Pago (PIX)              |
| Deploy   | Vercel                 | Vercel                          |

### URLs de produção (Vercel)

- **Frontend:** https://rateio.ckao.in  
- **Backend (API):** https://api-rateio.ckao.in  

O front consome a API via `VITE_API_BASE_URL` (em produção apontando para o backend acima).

---

## 3. Rotas

### Frontend (rateio-web)

| Rota            | Componente   | Observação                    |
|-----------------|-------------|-------------------------------|
| `/`             | Landing     | Pública; Sign In/Up + “Go to Dashboard” |
| `/app`          | Dashboard   | Requer auth; lista e cria splits |
| `/app/splits/:id` | SplitEditor | Requer auth; abas Participantes, Itens, Extras, Revisão |
| `/p/:slug`      | PublicSplit | Página pública; **stub** (“coming soon”) |

**Nota:** SPECS prevêem `/new`, `/s/:id/participants`, etc. O app usa `/app` + `/app/splits/:id` com abas no mesmo editor.

### Backend (rateio-api)

| Método | Rota                         | Função                          |
|--------|------------------------------|----------------------------------|
| GET    | `/health`                    | Health check                     |
| GET    | `/me`                        | Auth; retorna clerkUserId        |
| GET    | `/pricing/current`           | Taxa base + tiers de IA          |
| GET    | `/splits`                    | Lista splits do usuário          |
| GET    | `/splits/:id`                | Detalhe do split (participants, items, shares, extras) |
| PATCH  | `/splits/:id`                | Atualiza nome                    |
| POST   | `/splits`                    | Cria split (name, peopleCount)   |
| PUT    | `/splits/:id/participants`   | Sincroniza participantes         |
| PUT    | `/splits/:id/items`          | Sincroniza itens + consumerIds   |
| PUT    | `/splits/:id/extras`         | Sincroniza extras                |
| POST   | `/splits/:id/ai-parse`       | Parse por IA (stub; retorna mock + custo) |
| POST   | `/splits/:id/compute-review` | Calcula revisão, salva split_costs, retorna cálculo + wallet |
| POST   | `/splits/:id/pay`            | Pagamento (wallet e/ou PIX)      |
| POST   | `/webhooks/mercadopago`      | Webhook MP; aprova pagamento, wallet, slug. URL produção: `https://api-rateio.ckao.in/webhooks/mercadopago` (registrar no painel MP). Em **Suas integrações** ativar tópico **Pagamentos** (`payment`), não Orders. GET na mesma URL retorna 200 para verificação. Debug: `DEBUG_WEBHOOK=true` e logs `[WEBHOOK MP]`. |
| GET    | `/public/:slug`             | Dados read-only do split pago    |

---

## 4. O que está implementado e funcional

### 4.1 Backend (rateio-api)

- **Auth:** Middleware Clerk (JWT); variável `clerkUserId` nas rotas protegidas.
- **DB (Drizzle + Turso):** Tabelas `splits`, `participants`, `items`, `item_shares`, `extras`, `split_costs`, `wallets`, `wallet_ledger`, `payments` conforme SPECS.
- **CRUD de splits:** Criar, listar, buscar por id, PATCH nome; checagem de owner e status PAID (bloqueio de edição).
- **Participantes:** PUT com array (cria/atualiza/remove); sortOrder.
- **Itens + shares:** PUT com `items[]` e `consumerIds` por item; replace completo por request.
- **Extras:** PUT com array (SERVICE_PERCENT / FIXED, allocationMode PROPORTIONAL / EQUAL).
- **Cálculo:** `services/calculation.ts` — itens divididos entre consumidores, extras EQUAL/PROPORTIONAL, centavos fechando; testes em `test/calculation.test.ts`.
- **Revisão:** `POST compute-review` chama `calculateSplit`, persiste em `split_costs`, retorna `calculation` + `wallet.balanceCents` e `remainingToPay`.
- **Pagamento:**  
  - Se custo total coberto pela wallet → marca PAID, gera slug, debita wallet.  
  - Senão → cria cobrança PIX (Mercado Pago), retorna QR + copy-paste; em dev sem token MP retorna mock.
- **Webhook Mercado Pago:** Verificação de assinatura (x-signature, x-request-id); em aprovação: TOPUP no wallet, CHARGE do custo do split, split → PAID, gera `public_slug`.
- **Público:** `GET /public/:slug` só para status PAID; recalcula totais por participante e retorna `splitName`, `date`, `totals`, `grandTotal`, `proof`.
- **Wallet:** `WalletService` (saldo, TOPUP/CHARGE com ledger); usado em pay e webhook.
- **Pricing:** `GET /pricing/current` lê BASE_FEE_CENTS e tiers de IA do `.env`.

### 4.2 Frontend (rateio-web)

- **Auth:** Clerk (plugin Vue); `useApi()` com Bearer token; rotas `/app` e `/app/splits/:id` para uso autenticado.
- **Landing:** Sign In / Sign Up (modal); “Go to Dashboard” quando logado.
- **Dashboard:** Lista splits do usuário (cards com nome, data, nº participantes e itens); botão “+” para criar; ao criar redireciona para `/app/splits/:id`.
- **SplitEditor:** Cabeçalho com voltar e nome editável (debounced PATCH). Abas: Participantes, Itens, Extras, Revisão.
- **Participantes:** Lista editável (nome inline); adicionar; remover; sync via PUT `/splits/:id/participants`.
- **Itens:** Adicionar item (nome + valor em R$ via `CurrencyInput`); lista com valor; por item, seleção de consumidores via `ParticipantSelector` (badges toggle); “Todos” / “Nenhum”; sync com debounce (PUT items + consumerIds).
- **Extras:** Apenas mensagem “Em breve” — **não implementado** (backend já tem PUT extras e cálculo).
- **Revisão:**  
  - Valida participantes, itens e itens com ao menos um consumidor.  
  - **Total da conta** (grandTotalCents): só para conferir com a conta física.  
  - **Por pessoa:** quanto cada um paga ao estabelecimento; valores ficam **blurrados** até desbloquear.  
  - Botão **“Desbloquear valores”** (taxa do app em R$): chama `paySplit` (PIX da taxa); se PENDING abre modal com QR PIX e copy-paste; polling até PAID; ao confirmar, fecha modal e exibe valores por pessoa. Se já pago, mostra “Valores desbloqueados”.
- **Pagamento:** Fluxo completo (wallet ou PIX); modal com QR e copiar PIX; `markAsPaid` existe no store mas não é usado na UI (comentado).
- **Página pública (`/p/:slug`):** Só stub (“Public Bill View – coming soon”); **não consome** `GET /public/:slug`.

### 4.3 API client e estado (rateio-web)

- **client.ts:** `apiFetch` com `VITE_API_BASE_URL`; opção `VITE_USE_STUBS=true` para stub.
- **useApi.ts:** `get/post/put/patch` com token Clerk e `uiStore` (startRequest/endRequest) para loading global.
- **splitStore:**  
  - draft, mySplits, currentSplitId (persistido), isLoading, error, isSaving.  
  - listSplits, createSplit, fetchSplit, updateSplit (nome).  
  - add/remove/updateParticipant, syncParticipants.  
  - addItem, deleteItem, toggleShare, setAllShares, scheduleSyncItems/syncItems.  
  - addExtra/syncExtras (só console.log).  
  - computeReview, paySplit, markAsPaid.
- **uiStore:** activeRequests, isLoading, startRequest, endRequest (GlobalLoader).
- **Tipos (api/types.ts):** SplitDraft com `status: 'OPEN' | 'PAID'` — backend envia `DRAFT`; funcionalmente ok (só PAID é tratado), mas o tipo ideal é `'DRAFT' | 'PAID'`.

### 4.4 i18n e UI

- **i18n:** pt-BR (default) e en; chaves para dashboard, split, participants, items, extras, review.
- **Componentes UI:** shadcn-vue (Button, Card, Input, Tabs, Dialog, Badge, etc.); CurrencyInput (R$ centavos); ParticipantSelector (badges); GlobalLoader (overlay durante requests).

---

## 5. Lacunas / Ajustes sugeridos

1. **Extras (front):** Backend pronto; falta tela em ExtrasTab (serviço %, couvert, extras fixos, tipo de rateio).
2. **Página pública:** Implementar em `PublicSplit.vue` a chamada a `GET /public/:slug` e exibir totais por pessoa (read-only).
3. **Rotas:** SPECS falam em `/new` e `/s/:id/...`; hoje é `/app` e `/app/splits/:id` — alinhar se quiser aderência literal às SPECS.
4. **Tipo status:** Em `api/types.ts`, usar `status: 'DRAFT' | 'PAID'` para refletir a API.
5. **Variável de ambiente:** SPECS dizem `VITE_API_URL`; código usa `VITE_API_BASE_URL` — manter um nome e documentar.
6. **Colar texto / IA:** SPECS: “Colar texto (parser local + IA opcional)”. Backend tem stub `ai-parse`; front não tem aba “Colar texto” nem “Usar IA”.
7. **Preço do app na revisão:** Revisão mostra “Total da Conta” (conta em si). Não exibe explicitamente a taxa do app (BASE_FEE + IA) nem saldo da wallet; backend já retorna em `compute-review` (wallet, remainingToPay).
8. **Top-up no pagamento:** Backend aceita `topupCents` em `/splits/:id/pay`; front chama `paySplit(api)` sem top-up; falta UI para +10/+20/+50 se desejado.

---

## 6. Arquivos-chave

**rateio-web:**  
`src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/api/client.ts`, `src/api/useApi.ts`, `src/api/types.ts`, `src/stores/splitStore.ts`, `src/stores/uiStore.ts`, `src/pages/Landing.vue`, `src/pages/Dashboard.vue`, `src/pages/SplitEditor.vue`, `src/pages/PublicSplit.vue`, `src/components/split/app/*.vue`.

**rateio-api:**  
`src/index.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/middleware/auth.ts`, `src/routes/splits.ts`, `src/routes/payment.ts`, `src/routes/public.ts`, `src/services/calculation.ts`, `src/services/mercadopago.ts`, `src/services/wallet.ts`.

---

## 7. Glossário rápido

- **Split:** Um rateio (uma “conta” a dividir).
- **DRAFT / PAID:** Estados do split na API; front usa tipo `OPEN` para draft.
- **Shares / consumerIds:** Quem consumiu cada item (item_shares).
- **grandTotalCents:** Soma itens + extras (total da conta, só para conferência com a conta física).
- **finalTotalToPayCents:** Taxa do app (PIX) paga pelo criador para **desbloquear** os valores por pessoa.
- **public_slug:** Gerado após PAID; usado em `/public/:slug` e na página `/p/:slug`.
