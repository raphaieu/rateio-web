<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2">
          <img src="/logo.svg" alt="Rateio Justo Logo" class="h-7 w-auto object-contain shrink-0" />
          <span class="font-bold text-lg tracking-tight">Rateio Justo</span>
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
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Sobre o projeto</h1>
      <p class="text-muted-foreground leading-relaxed mb-10">
        O Rateio Justo nasceu para resolver um problema real: dividir a conta “item a item”, de forma clara e justa,
        sem planilhas, sem discussão por centavos e sem confusão no fim do rolê.
      </p>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">A ideia</h2>
        <p class="text-muted-foreground leading-relaxed">
          Em vez de dividir tudo igualmente, você marca quem consumiu cada item. O app calcula quanto cada pessoa deve pagar,
          respeitando centavos e evitando arredondamentos injustos.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">Status atual</h2>
        <p class="text-muted-foreground leading-relaxed">
          Este é um MVP em evolução. A prioridade é entregar o essencial com uma experiência rápida no celular e ir melhorando com o uso real.
        </p>
      </section>

      <section class="space-y-3 mb-10">
        <h2 class="text-xl font-bold">O que vem por aí</h2>
        <ul class="list-disc pl-5 text-muted-foreground space-y-2">
          <li><span class="font-medium text-foreground">Scanear a conta (OCR)</span>: tirar uma foto da nota e o app sugerir os itens automaticamente.</li>
          <li><span class="font-medium text-foreground">Ditado por voz</span>: narrar os itens e o app transcrever/preencher automaticamente.</li>
          <li><span class="font-medium text-foreground">Página pública do rateio</span>: compartilhar um link read-only para conferência.</li>
          <li><span class="font-medium text-foreground">Melhorias de extras</span>: taxa de serviço, descontos, couverts e alocações.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-bold">Feedback</h2>
        <p class="text-muted-foreground leading-relaxed">
          Se você usar e encontrar fricções, bugs ou tiver sugestões, isso ajuda muito a guiar as próximas evoluções.
        </p>
        <p class="text-muted-foreground leading-relaxed">
          Se você curte os detalhes técnicos, veja também a página
          <router-link to="/tech" class="text-primary underline underline-offset-4 hover:opacity-90">Tech</router-link>.
        </p>
      </section>
    </main>
  </div>
</template>

