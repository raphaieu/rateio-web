import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
    const activeRequests = ref(0)

    const isLoading = computed(() => activeRequests.value > 0)

    function startRequest() {
        activeRequests.value++
    }

    function endRequest() {
        if (activeRequests.value > 0) {
            activeRequests.value--
        }
    }

    return {
        activeRequests,
        isLoading,
        startRequest,
        endRequest
    }
})
