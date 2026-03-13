import { ref } from 'vue';

export function useAudioRecorder() {
    const isRecording = ref(false);
    const isProcessing = ref(false);
    const error = ref<string | null>(null);
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];

    const startRecording = async () => {
        try {
            error.value = null;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Tenta tipos comuns de áudio suportados pelos navegadores
            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/ogg')
                    ? 'audio/ogg'
                    : 'audio/mp4';

            mediaRecorder = new MediaRecorder(stream, { mimeType });
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.start();
            isRecording.value = true;
        } catch (err: any) {
            console.error('Erro ao acessar microfone:', err);
            error.value = 'Não foi possível acessar o microfone. Verifique as permissões.';
        }
    };

    const stopRecording = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorder) {
                return reject(new Error('MediaRecorder não iniciado'));
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType });
                isRecording.value = false;

                // Parar todos os tracks do stream para liberar o microfone
                mediaRecorder?.stream.getTracks().forEach(track => track.stop());

                resolve(audioBlob);
            };

            mediaRecorder.stop();
        });
    };

    return {
        isRecording,
        isProcessing,
        error,
        startRecording,
        stopRecording
    };
}
