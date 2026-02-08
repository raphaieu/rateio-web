<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2">
          <div class="flex items-center">
            <img
              src="/logo.svg"
              alt="Rateio Justo Logo"
              class="h-10 w-auto object-contain shrink-0"
            />
          </div>
        </router-link>

        <div class="flex items-center gap-3">
          <router-link to="/">
            <Button variant="ghost" size="sm" class="gap-2">
              <ArrowLeft class="h-4 w-4" />
              Voltar
            </Button>
          </router-link>
          <router-link to="/app">
            <Button size="sm">Abrir app</Button>
          </router-link>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-12 max-w-3xl">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Tech</h1>
      <p class="text-muted-foreground leading-relaxed mb-10">
        Um resumo técnico do projeto: stack, arquitetura, infra e como o app está sendo entregue hoje.
      </p>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Contexto (MVP + IA)</h2>
        <p class="text-muted-foreground leading-relaxed">
          A ideia aqui foi desenvolver um MVP rápido, no estilo “vibecoding”, usando free tiers (Clerk, Turso e Vercel)
          como forma de aprendizado, testes e validação. Como desenvolvedor independente (indie hacker), eu queria medir o
          tempo de desenvolvimento/lançamento e estruturar o projeto com recursos atuais de desenvolvimento com IA.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Frontend (rateio-web)</h2>
        <ul class="list-disc pl-5 text-muted-foreground space-y-2">
          <li><span class="font-medium text-foreground">Vue 3 + Vite + TypeScript</span> (UI mobile-first).</li>
          <li><span class="font-medium text-foreground">Tailwind + shadcn-vue</span> para componentes e consistência visual.</li>
          <li><span class="font-medium text-foreground">Pinia</span> para estado (split draft, saving/loading).</li>
          <li><span class="font-medium text-foreground">vue-i18n</span> (pt-BR padrão, fallback en).</li>
        </ul>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Backend (rateio-api)</h2>
        <ul class="list-disc pl-5 text-muted-foreground space-y-2">
          <li><span class="font-medium text-foreground">Hono + TypeScript</span> (rotas e validação).</li>
          <li><span class="font-medium text-foreground">Drizzle ORM</span> para schema e queries.</li>
          <li><span class="font-medium text-foreground">Serviços</span>: cálculo do rateio, wallet e integrações.</li>
          <li><span class="font-medium text-foreground">Geo (Nominatim)</span>: rota <code class="text-sm bg-muted px-1 rounded">/geo</code> com reverse geocoding e busca de lugares para definir o nome do rateio; auth obrigatório. Splits armazenam latitude, longitude e metadados do lugar (placeProvider, placeId, placeName, placeDisplayName).</li>
        </ul>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Auth</h2>
        <p class="text-muted-foreground leading-relaxed">
          <span class="font-medium text-foreground">Clerk</span> no front e no back. O front envia Bearer token e o backend valida o JWT para autorizar acesso aos splits do owner.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Banco / Persistência</h2>
        <p class="text-muted-foreground leading-relaxed">
          <span class="font-medium text-foreground">Turso (SQLite)</span> como storage principal. Tabelas para splits, participants, items, shares, extras, custos e wallet.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Pagamentos</h2>
        <p class="text-muted-foreground leading-relaxed">
          Integração com <span class="font-medium text-foreground">Mercado Pago</span> para PIX da taxa do app (desbloqueio do rateio). Webhook confirma pagamento e atualiza status do split.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-bold">Deploy / Infra</h2>
        <ul class="list-disc pl-5 text-muted-foreground space-y-2">
          <li><span class="font-medium text-foreground">Vercel</span> para front e API.</li>
          <li><span class="font-medium text-foreground">Env vars</span> para URLs/tokens (Clerk, Turso, MP).</li>
          <li><span class="font-medium text-foreground">Logs e debug</span> para webhook e conexão com o banco.</li>
        </ul>
      </section>
    </main>
  </div>
</template>

