<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth } from '@clerk/vue'
import {
  ArrowRight,
  Check,
  MessageCircle,
  UserPlus,
  ListChecks,
  Sparkles,
  Utensils,
  Plane,
  PartyPopper,
  Home,
  Users,
  ChevronDown,
} from 'lucide-vue-next'
import { toast } from '@/components/ui/toast/use-toast'

const route = useRoute()
const router = useRouter()
const { isSignedIn, isLoaded } = useAuth()

const whatsappNumberRaw = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? ''
const whatsappText = (import.meta.env.VITE_WHATSAPP_TEXT as string | undefined) ?? 'Olá! Tenho um feedback sobre o Rateio Justo.'

const whatsappHref = computed(() => {
  const digits = whatsappNumberRaw.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappText)}`
})

// Scroll-reveal system
const revealed = ref(new Set<string>())
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (route.query.reason === 'login_required') {
    toast({
      title: 'Faça login para acessar',
      description: 'Entre ou cadastre-se para usar o dashboard e criar rateios.',
    })
  }

  nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = (entry.target as HTMLElement).dataset.reveal
            if (key) revealed.value = new Set([...revealed.value, key])
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => observer!.observe(el))
  })
})

onUnmounted(() => {
  observer?.disconnect()
})

const show = (key: string) => revealed.value.has(key)

watch(
  () => ({ isLoaded: isLoaded.value, isSignedIn: isSignedIn.value, returnUrl: route.query.returnUrl }),
  (curr) => {
    if (!curr.isLoaded || !curr.isSignedIn || !curr.returnUrl) return
    const url = typeof curr.returnUrl === 'string' ? curr.returnUrl : '/app'
    if (!url.startsWith('/app')) return
    router.replace(url)
  },
  { immediate: true }
)

const painPoints = [
  'alguém bebe água e paga drink premium',
  'alguém vai embora cedo',
  'alguém fala "depois te faço um pix"',
  'e você vira contador da mesa',
]

const problemScript = [
  'alguém paga tudo',
  'começam as contas aproximadas',
  'surgem os "arredonda aí"',
  'silêncio constrangedor',
]

const steps = [
  { num: '01', icon: UserPlus, title: 'Crie o Rateio', desc: 'Adicione as pessoas que estão no rolê' },
  { num: '02', icon: ListChecks, title: 'Insira os itens', desc: 'Selecione quem consumiu o quê' },
  { num: '03', icon: Sparkles, title: 'Revise a conta', desc: 'O app calcula tudo automaticamente' },
]

const benefits = [
  'ninguém precisa cobrar ninguém',
  'ninguém paga pelos outros',
  'ninguém faz conta de cabeça',
  'ninguém fica desconfortável',
]

const useCases = [
  { icon: Utensils, label: 'Saídas em grupo' },
  { icon: PartyPopper, label: 'Aniversários' },
  { icon: Plane, label: 'Viagens' },
  { icon: Home, label: 'Repúblicas / Coworking' },
  { icon: Users, label: 'Despesas compartilhadas' },
]

const testimonials = [
  { text: 'Nunca mais tive aquele momento constrangedor de pedir o pix depois.', name: 'Victor Martins' },
  { text: 'A galera do churrasco já nem discute mais quem deve quanto.', name: 'Vila Jr.' },
  { text: 'Uso em toda viagem. Cada um vê o que deve no final, sem drama.', name: 'Hudson Nepomuceno' },
]
</script>

<template>
  <div class="min-h-screen scroll-smooth overflow-x-hidden">

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- NAVBAR                                                      -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-zinc-200">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center">
          <img
            src="/logo.svg"
            alt="Rateio Justo"
            class="h-10 w-auto object-contain shrink-0"
          />
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          <router-link to="/sobre" class="hidden sm:block">
            <Button variant="ghost" size="sm" class="text-zinc-600 hover:text-zinc-900">
              Sobre
            </Button>
          </router-link>
          <router-link to="/tech" class="hidden sm:block">
            <Button variant="ghost" size="sm" class="text-zinc-600 hover:text-zinc-900">
              Tech
            </Button>
          </router-link>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" class="text-zinc-600 hover:text-zinc-900">
                Entrar
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" class="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm">
                Cadastrar
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <router-link to="/app">
              <Button size="sm" class="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm">
                Dashboard
              </Button>
            </router-link>
          </SignedIn>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- HERO — Dark, full-screen, emotional hook                    -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="min-h-screen flex flex-col justify-center bg-zinc-950 relative overflow-hidden px-4 pt-24 pb-20">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div class="max-w-4xl mx-auto relative text-center">
        <!-- Headline -->
        <div class="mb-10">
          <h1
            class="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] opacity-0 animate-fade-in-up"
            style="animation-delay: 100ms"
          >
            Dividir conta não é matemática.
          </h1>
          <p
            class="text-[3rem] sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-emerald-400 leading-[1.05] mt-3 opacity-0 animate-fade-in-up"
            style="animation-delay: 300ms"
          >
            é chatão.
          </p>
        </div>

        <!-- Pain points -->
        <div class="opacity-0 animate-fade-in-up" style="animation-delay: 500ms">
          <p class="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-5 font-medium">Sempre acontece</p>
          <div class="space-y-3 max-w-md mx-auto text-left">
            <p
              v-for="(point, i) in painPoints"
              :key="i"
              class="text-zinc-400 text-lg flex items-start gap-3"
            >
              <span class="text-emerald-500/60 shrink-0 mt-0.5">—</span>
              <span :class="i === painPoints.length - 1 ? 'text-zinc-200 font-medium' : ''">{{ point }}</span>
            </p>
          </div>
        </div>

        <!-- Closing hook -->
        <div class="mt-10 opacity-0 animate-fade-in-up" style="animation-delay: 700ms">
          <p class="text-zinc-500 text-lg mb-8">e no final ninguém fica confortável.</p>
          <p class="text-2xl md:text-3xl font-bold text-white mb-2">
            O Rateio Justo resolve isso em <span class="text-emerald-400">30 segundos</span>.
          </p>
          <p class="text-zinc-400 text-lg">
            Cada pessoa paga exatamente o que consumiu.
          </p>
        </div>

        <!-- CTA -->
        <div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style="animation-delay: 900ms">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button
                size="lg"
                class="h-14 px-10 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-white border-0 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto"
              >
                Começar agora <ArrowRight class="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="lg"
                class="h-14 px-10 text-lg font-medium border-zinc-600 text-zinc-700 hover:bg-zinc-100 rounded-full transition-all w-full sm:w-auto"
              >
                Já tenho conta
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <router-link to="/app">
              <Button
                size="lg"
                class="h-14 px-10 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-white border-0 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                Ir para o app <ArrowRight class="ml-2 h-5 w-5" />
              </Button>
            </router-link>
          </SignedIn>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in" style="animation-delay: 1200ms">
        <ChevronDown class="w-6 h-6 text-zinc-600 animate-bounce" />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- PROBLEM — Empathy building                                  -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-20 md:py-28 bg-white relative">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center" data-reveal="problem">
        <h2
          :class="[
            'text-3xl md:text-5xl font-black text-zinc-900 leading-tight transition-all duration-700',
            show('problem') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          A conta não quebra amizade.
          <br />
          <span class="text-zinc-400">A negociação quebra.</span>
        </h2>

        <p
          :class="[
            'text-lg text-zinc-500 mt-10 mb-8 transition-all duration-700 delay-150',
            show('problem') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Você já viu esse roteiro:
        </p>

        <!-- The problem script -->
        <div class="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-14">
          <div
            v-for="(item, i) in problemScript"
            :key="i"
            :class="[
              'flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-left transition-all duration-700',
              show('problem') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            ]"
            :style="{ transitionDelay: `${300 + i * 100}ms` }"
          >
            <span class="text-2xl font-black text-zinc-200 shrink-0 tabular-nums">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="text-zinc-600">{{ item }}</span>
          </div>
        </div>

        <!-- Emotional close -->
        <div
          :class="[
            'transition-all duration-700 delay-700',
            show('problem') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          <p class="text-xl md:text-2xl font-bold text-zinc-900">
            Não é sobre dinheiro.
            <br />
            É sobre evitar parecer ser <span class="text-emerald-600">chato</span>.
          </p>
          <p class="text-zinc-500 mt-4 text-lg">
            e por isso as pessoas aceitam pagar errado.
          </p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- SOLUTION — How it works                                     -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-20 md:py-28 bg-zinc-50 relative">
      <div class="max-w-5xl mx-auto px-4 sm:px-6" data-reveal="solution">
        <div class="text-center mb-16">
          <p
            :class="[
              'text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-4 transition-all duration-700',
              show('solution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            ]"
          >
            Como funciona
          </p>
          <h2
            :class="[
              'text-3xl md:text-5xl font-black text-zinc-900 leading-tight transition-all duration-700 delay-100',
              show('solution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            ]"
          >
            Justiça automática,
            <br />
            <span class="text-emerald-600">sem conversa</span>
          </h2>
        </div>

        <!-- Steps -->
        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="(step, i) in steps"
            :key="i"
            :class="[
              'bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-700',
              show('solution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            ]"
            :style="{ transitionDelay: `${200 + i * 150}ms` }"
          >
            <span class="text-6xl font-black text-emerald-500/10 leading-none">{{ step.num }}</span>
            <div class="mt-4 mb-4 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <component :is="step.icon" class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-zinc-900 mb-2">{{ step.title }}</h3>
            <p class="text-zinc-500 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>

        <!-- No-hassle tags -->
        <div
          :class="[
            'mt-14 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 delay-700',
            show('solution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          <span class="bg-white px-5 py-2.5 rounded-full border border-zinc-200 text-sm font-medium text-zinc-500">sem calculadora</span>
          <span class="bg-white px-5 py-2.5 rounded-full border border-zinc-200 text-sm font-medium text-zinc-500">sem conta de cabeça</span>          
          <span class="bg-white px-5 py-2.5 rounded-full border border-zinc-200 text-sm font-medium text-zinc-500">sem rabiscar no guardanapo</span>
        </div>

        <p
          :class="[
            'text-center text-lg text-zinc-500 mt-6 transition-all duration-700 delay-[800ms]',
            show('solution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Sentou. Sorriu... o <strong class="text-zinc-700">Rateio Justo</strong> dividiu.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- BENEFITS — What you get                                     -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-20 md:py-28 bg-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6" data-reveal="benefits">
        <div class="grid sm:grid-cols-2 gap-5">
          <div
            v-for="(benefit, i) in benefits"
            :key="i"
            :class="[
              'flex items-center gap-4 p-5 rounded-xl bg-zinc-50 border border-zinc-100 transition-all duration-700',
              show('benefits') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            ]"
            :style="{ transitionDelay: `${i * 120}ms` }"
          >
            <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check class="w-5 h-5 text-emerald-600" />
            </div>
            <p class="text-base sm:text-lg font-medium text-zinc-800">{{ benefit }}</p>
          </div>
        </div>

        <p
          :class="[
            'text-center text-2xl md:text-3xl font-bold text-zinc-900 mt-14 transition-all duration-700 delay-500',
            show('benefits') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          A conta fecha e a amizade <span class="text-emerald-600">continua</span>.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- DIFFERENTIAL — Why this app is different                    -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-20 md:py-28 bg-zinc-950 text-white relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none"></div>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 relative text-center" data-reveal="diff">
        <p
          :class="[
            'text-xl text-zinc-400 mb-4 transition-all duration-700',
            show('diff') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Outros apps dividem valores.
        </p>
        <h2
          :class="[
            'text-3xl md:text-5xl lg:text-6xl font-black leading-tight transition-all duration-700 delay-200',
            show('diff') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          O Rateio Justo divide
          <span class="text-emerald-400">consumo</span>.
        </h2>
        <p
          :class="[
            'text-lg md:text-xl text-zinc-400 mt-8 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-[400ms]',
            show('diff') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Isso elimina negociação social — o principal motivo de erro no rateio.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- USE CASES — When to use                                     -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-20 md:py-28 bg-zinc-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center" data-reveal="usecases">
        <p
          :class="[
            'text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-4 transition-all duration-700',
            show('usecases') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Quando usar
        </p>
        <h2
          :class="[
            'text-3xl md:text-4xl font-black text-zinc-900 mb-12 transition-all duration-700 delay-100',
            show('usecases') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Mais de 3 pessoas? Já compensa.
        </h2>

        <div class="flex flex-wrap justify-center gap-4">
          <div
            v-for="(usecase, i) in useCases"
            :key="i"
            :class="[
              'flex items-center gap-3 bg-white rounded-full px-6 py-3.5 border border-zinc-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-700',
              show('usecases') ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
            ]"
            :style="{ transitionDelay: `${200 + i * 100}ms` }"
          >
            <component :is="usecase.icon" class="w-5 h-5 text-emerald-600" />
            <span class="text-sm font-medium text-zinc-700">{{ usecase.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- SOCIAL PROOF — Placeholder                                  -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-20 md:py-28 bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center" data-reveal="social">
        <h2
          :class="[
            'text-3xl md:text-4xl font-black text-zinc-900 mb-12 transition-all duration-700',
            show('social') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Quem usa não volta pra calculadora.
        </h2>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="(testimonial, i) in testimonials"
            :key="i"
            :class="[
              'bg-zinc-50 rounded-2xl p-6 text-left border border-zinc-100 transition-all duration-700',
              show('social') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
            ]"
            :style="{ transitionDelay: `${200 + i * 150}ms` }"
          >
            <div class="text-4xl text-emerald-300 mb-3 leading-none">"</div>
            <p class="text-zinc-600 leading-relaxed mb-4">{{ testimonial.text }}</p>
            <p class="text-sm font-medium text-zinc-400">— {{ testimonial.name }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- FINAL CTA — Provocative closing                             -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <section class="py-24 md:py-32 bg-zinc-950 text-white relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none"></div>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 relative text-center" data-reveal="cta">
        <p
          :class="[
            'text-xl md:text-2xl text-zinc-400 mb-4 transition-all duration-700',
            show('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          Na próxima saída você vai dividir na calculadora...
        </p>
        <h2
          :class="[
            'text-3xl md:text-5xl font-black leading-tight mb-12 transition-all duration-700 delay-200',
            show('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          ou resolver isso <span class="text-emerald-400">de vez</span>?
        </h2>

        <div
          :class="[
            'flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-[400ms]',
            show('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          ]"
        >
          <SignedOut>
            <SignUpButton mode="modal">
              <Button
                size="lg"
                class="h-14 px-10 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-white border-0 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto"
              >
                Usar o Rateio Justo <ArrowRight class="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <router-link to="/app">
              <Button
                size="lg"
                class="h-14 px-10 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-white border-0 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                Ir para o app <ArrowRight class="ml-2 h-5 w-5" />
              </Button>
            </router-link>
          </SignedIn>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- FOOTER                                                      -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <footer class="bg-zinc-950 border-t border-zinc-800/50 py-10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center opacity-60 hover:opacity-100 transition-opacity">
          <img
            src="/logo.svg"
            alt="Rateio Justo"
            class="h-10 w-auto brightness-0 invert"
          />
        </div>
        <div class="flex items-center gap-6">
          <router-link to="/sobre" class="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Sobre
          </router-link>
          <router-link to="/tech" class="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Tech
          </router-link>
        </div>
        <p class="text-zinc-600 text-sm text-center md:text-right">
          &copy; {{ new Date().getFullYear() }} Rateio Justo.
        </p>
      </div>
    </footer>

    <!-- WhatsApp floating button -->
    <a
      v-if="whatsappHref"
      :href="whatsappHref"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center h-14 w-14 rounded-full shadow-lg bg-[#25D366] text-white hover:brightness-110 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label="Falar no WhatsApp"
      title="Falar no WhatsApp"
    >
      <MessageCircle class="h-7 w-7" />
    </a>
  </div>
</template>
