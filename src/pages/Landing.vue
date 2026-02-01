<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/vue'
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
    <h1 class="text-4xl font-bold mb-6 text-primary">Rateio Justo</h1>
    <p class="text-xl mb-8 text-muted-foreground text-center">Split bills instantly without the headache. Mobile first.</p>
    
    <div class="flex gap-4">
      <SignedOut>
        <SignInButton mode="modal">
            <Button size="lg" variant="default">Sign In</Button>
        </SignInButton>
        <SignUpButton mode="modal">
            <Button size="lg" variant="outline">Sign Up</Button>
        </SignUpButton>
      </SignedOut>
      
      <SignedIn>
        <router-link to="/app">
           <Button size="lg">Go to Dashboard</Button>
        </router-link>
      </SignedIn>
    </div>
  </div>
</template>
