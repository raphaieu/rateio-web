<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/vue'
import { ArrowRight, Zap, Users, Wallet } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col font-sans">
    <!-- Navbar -->
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/logo.svg" alt="Rateio Justo Logo" class="h-8 w-8" />
          <span class="font-bold text-xl tracking-tight">Rateio Justo</span>
        </div>
        <div class="flex items-center gap-4">
           <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Entrar</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Cadastrar</Button>
            </SignUpButton>
           </SignedOut>
           <SignedIn>
             <router-link to="/app">
               <Button size="sm">Dashboard</Button>
             </router-link>
           </SignedIn>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <main class="flex-1">
      <section class="py-20 md:py-32 relative overflow-hidden">
        <!-- Background Elements -->
        <div class="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div class="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

         <div class="container mx-auto px-4 relative z-10 text-center">
            <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-6">
              ✨ A nova forma de dividir contas
            </div>
            <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl mb-6 text-foreground">
              Divida contas sem <br class="hidden md:block" />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">dor de cabeça</span>.
            </h1>
            <p class="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Organize despesas de viagens, churrascos e do dia a dia. Simples, rápido e justo para todos. 
              Pare de brigar por centavos.
            </p>
            
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
               <SignedOut>
                 <SignUpButton mode="modal">
                   <Button size="lg" class="h-12 px-8 text-base gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                     Criar conta grátis <ArrowRight class="h-4 w-4" />
                   </Button>
                 </SignUpButton>
                 <SignInButton mode="modal">
                    <Button variant="outline" size="lg" class="h-12 px-8 text-base w-full sm:w-auto">
                        Já tenho conta
                    </Button>
                 </SignInButton>
               </SignedOut>
               <SignedIn>
                 <router-link to="/app">
                   <Button size="lg" class="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/20">
                     Ir para o app <ArrowRight class="h-4 w-4" />
                   </Button>
                 </router-link>
               </SignedIn>
            </div>
         </div>
      </section>

      <!-- Value Props -->
      <section id="features" class="py-24 bg-muted/40 border-t">
        <div class="container mx-auto px-4">
           <div class="text-center mb-16">
              <h2 class="text-3xl font-bold mb-4">Por que usar o Rateio Justo?</h2>
              <p class="text-muted-foreground text-lg max-w-2xl mx-auto">Feito para resolver a bagunça do "quem deve quanto" de uma vez por todas.</p>
           </div>
           
           <div class="grid md:grid-cols-3 gap-8">
              <div class="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div class="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <Zap class="h-6 w-6" />
                </div>
                <h3 class="text-xl font-bold mb-2">Rápido e Fácil</h3>
                <p class="text-muted-foreground leading-relaxed">Adicione despesas em segundos. Interface otimizada para celular. Sem planilhas complicadas.</p>
              </div>
               <div class="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div class="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <Users class="h-6 w-6" />
                </div>
                <h3 class="text-xl font-bold mb-2">Grupos Ilimitados</h3>
                <p class="text-muted-foreground leading-relaxed">Crie grupos para viagens, dividir aluguel, churrascos no fim de semana. Tudo em um só lugar.</p>
              </div>
               <div class="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div class="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <Wallet class="h-6 w-6" />
                </div>
                <h3 class="text-xl font-bold mb-2">Pagamentos Integrados</h3>
                <p class="text-muted-foreground leading-relaxed">Em breve, pague tudo diretamente pelo app com facilidade e segurança.</p>
              </div>
           </div>
        </div>
      </section>
    </main>
    
    <footer class="border-t py-12 bg-background">
      <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
           <img src="/logo.svg" alt="Rateio Justo Logo" class="h-6 w-6 grayscale" />
           <span class="font-bold text-lg">Rateio Justo</span>
        </div>
        <p class="text-muted-foreground text-sm text-center md:text-right">
            &copy; {{ new Date().getFullYear() }} Rateio Justo. <br class="md:hidden"/> Todos os direitos reservados.
        </p>
      </div>
    </footer>
  </div>
</template>
