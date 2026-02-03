import { loadMercadoPago } from "@mercadopago/sdk-js";

declare global {
    interface Window {
        MercadoPago: any;
    }
}

let mp: any = null;

export const useMercadoPago = async () => {
    if (mp) return mp;

    await loadMercadoPago();

    const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (!publicKey) {
        console.warn("MercadoPago Public Key not found in environment variables");
        return null;
    }

    mp = new window.MercadoPago(publicKey, {
        locale: "pt-BR",
    });

    return mp;
};
