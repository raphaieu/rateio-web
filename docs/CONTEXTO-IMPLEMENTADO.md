# Rateio Justo — Contexto e Estado da Implementação

Documento de referência para manter o contexto do projeto e o que já está implementado/funcional (atualizado em **março/2026**).

---

## 1. Visão do Produto (PRD)

- **O que é:** Webapp mobile-first para dividir contas de forma justa, item a item (bar/restaurante). A ideia é **saber quem consumiu o quê** para cada um pagar **apenas a sua parte** ao estabelecimento — não dividir igualmente entre todos.
- **Proposta de valor:** Justiça (cada um paga só o que consumiu ao estabelecimento), rapidez, clareza.
- **Fluxo Principal (Onboarding V2):** Criar rateio → Fluxo guiado em 3 passos (Participantes → Itens → Revisão) → **Desbloquear valores** (PIX da taxa do app) → Ver quanto cada um paga ao estabelecimento → Link público/Recibo.
- **Nome do rateio e geolocalização:** O nome do rateio pode ser definido manualmente ou via GPS/Busca de lugares. Metadados do lugar são persistidos no split.
- **Identidade Persistente:** O sistema utiliza um `guest_id` persistente no navegador. Isso permite que usuários criem e gerenciem rateios sem login obrigatório, mantendo a posse dos seus dados.
- **Semântica da Revisão:**
  - **Desbloquear valores:** O usuário paga a **taxa do app via PIX**. Após a confirmação, os valores **por pessoa** são revelados e a página torna-se pública.
- **Monetização/IA:** Taxa do app baseada em consumo de IA (tiers dinâmicos). Todo uso de IA é logado (`ai_usage`) para auditoria e controle de custos.

---

## 2. Stack

| Camada    | rateio-web (front)      | rateio-api (back)               |
| --------- | ----------------------- | ------------------------------- |
| Runtime   | Vue 3 + Vite            | Node (Hono)                     |
| Auth      | Clerk (Vue) + Guest ID  | Clerk (JWT) + Hybrid Auth       |
| DB        | —                       | Drizzle + Turso (SQLite)        |
| Pagamento | —                       | Mercado Pago (PIX)              |
| IA        | —                       | OpenAI (GPT-4o/mini)            |

### URLs de produção (Vercel)

- **Frontend:** https://rateio.ckao.in  
- **Backend (API):** https://api-rateio.ckao.in  

---

## 3. Rotas

### Frontend (rateio-web)

| Rota       | Componente     | Observação                                             |
| ---------- | -------------- | ------------------------------------------------------ |
| `/`        | Landing        | Dashboard simplificado + Hero                          |
| `/v2`      | OnboardingV2   | Novo fluxo guiado em 3 passos para criação imediata    |
| `/app`     | Dashboard      | Dashboard do usuário logado                            |
| `/app/splits/:id` | SplitEditor | Editor clássico com abas                               |
| `/p/:slug` | PublicSplit    | **Recibo Público** (Funcional, integrado c/ backend)   |

### Backend (rateio-api)

| Método | Rota                         | Função                                                   |
| ------ | ---------------------------- | -------------------------------------------------------- |
| GET    | `/health`                    | Health check                                             |
| GET    | `/pricing/current`           | Taxa base + tiers de IA baseados em consumo              |
| POST   | `/splits/:id/compute-review` | Calcula revisão, salva custos e congela preços           |
| POST   | `/splits/:id/mark-as-paid`   | **(Dev Only)** Simula pagamento aprovado                 |
| GET    | `/public/:slug`              | Dados públicos do rateio pago                            |

---

## 4. O que está implementado e funcional

### 4.1 Backend (rateio-api)
- **Hybrid Auth:** Middlewares `populateAuth` e `authMiddleware` permitem fluxos para usuários autenticados (Clerk) e convidados (Guest ID) simultaneamente.
- **Lógica de Dono Inclusiva:** Validação de posse do rateio aceita tanto o Clerk User ID quanto o Guest ID.
- **AI Usage Tracking:** Registro detalhado de cada consumo de IA na tabela `ai_usage` (model, tokens, custo).
- **Pricing Service:** Cálculo dinâmico da taxa do app baseado no tamanho da nota e uso de IA.
- **Webhook Mercado Pago:** Integração completa para aprovação de PIX em tempo real.
- **OCR e Voice Parsing (Funcional):** 
  - `POST /ocr-parse`: Recebe imagem, utiliza **GPT-4o** para extrair itens e valores.
  - `POST /voice-parse`: Recebe áudio, utiliza **Whisper-1** para transcrição e **GPT-4o-mini** para estruturar itens.
  - `POST /transcribe`: Transcreve áudio para identificar participantes e quantidades pelo contexto da fala.

### 4.2 Frontend (rateio-web)
- **Onboarding V2:** Interface moderna e fluida para o fluxo principal do app.
- **Recibo Público:** Implementação completa da página de visualização pós-pagamento.
- **Persistência de Sessão:** Gerenciamento resiliente de `currentSplitId` e `rateio_guest_id`.
- **Prevenção de Furtos:** Botão de pagamento desabilitado se houver erros de lógica no rateio (ex: item sem dono).
- **Entrada Inteligente de Itens:** Botões de Câmera (OCR) e Microfone (Voz) integrados no `ItemsTab.vue`.

---

## 5. Lacunas / Ajustes sugeridos

1. **Limpeza de Banco:** Implementar cron para apagar `DRAFTs` abandonados de convidados após 30 dias.
2. **Histórico para Guests:** LocalStorage armazena IDs de rateios antigos, mas falta UI para listá-los de forma amigável no Dashboard sem login.
3. **Divisão por Peso/ML:** Atualmente a divisão é por "item inteiro" ou frações simples. Suporte a pesagem manual por item seria um diferencial.
4. **Integração com Contatos:** Facilitar adição de participantes buscando da agenda do celular.
