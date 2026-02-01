# Rateio Justo — SPECS (Frontend)

## 0. Objetivo
Implementar a interface mobile-first do MVP, consumindo a API do Rateio Justo, com foco em rapidez, clareza e zero fricção.

---

## 1. Stack
- Vue 3
- TypeScript
- Vite
- TailwindCSS
- shadcn-vue
- Pinia
- Vue Router
- Auth: Clerk
- Deploy: Vercel

---

## 2. Regras de UI
- Mobile-first sempre
- Fluxo linear (wizard)
- Sem dashboards
- Sem sobrecarga visual

---

## 3. Rotas
- /
- /new
- /s/:id/participants
- /s/:id/items
- /s/:id/extras
- /s/:id/review
- /s/:id/pay
- /p/:slug

---

## 4. Telas

### Criar Rateio
- Nome (opcional)
- Quantidade de pessoas

### Participantes
- Lista editável
- Apenas criador pode editar

### Itens
- Aba Manual
- Aba Colar Texto
- Preview editável
- Botão “Usar IA” com custo exibido

### Extras
- Serviço %
- Couvert
- Extras fixos
- Tipo de rateio

### Revisão
- Total geral visível
- Valores por pessoa bloqueados
- Exibição de custo do app
- Saldo da wallet (se logado)

### Pagamento
- PIX QR Code
- Top-up opcional (+10 / +20 / +50)
- Status de pagamento

### Público
- Página read-only
- Lista de pessoas + valores

---

## 5. Estado Global (Pinia)
- splitDraft
- participants
- items
- extras
- review
- wallet
- pricing

---

## 6. Regras importantes
- Front nunca calcula preço do app
- Front nunca recalcula rateio final após PAID
- Front respeita snapshot retornado pela API
- Valores por pessoa só exibidos após PAID

---

## 7. Variáveis de ambiente
- VITE_API_URL
- VITE_CLERK_PUBLISHABLE_KEY
