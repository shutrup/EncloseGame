import { useEffect } from 'react';
import { getTelegramWebApp } from '../lib/telegram';

export function useTelegramBackButton(onClick: () => void) {
    useEffect(() => {
        const tg = getTelegramWebApp();
        if (!tg) return;
        tg.BackButton.show();
        tg.BackButton.onClick(onClick);

        return () => {
            tg.BackButton.offClick(onClick);
            tg.BackButton.hide();
        };
    }, [onClick]);
}

export function useTelegramMainButton(
    text: string,
    onClick: () => void,
    isVisible = true,
    isActive = true
) {
    useEffect(() => {
        const tg = getTelegramWebApp();
        if (!tg) return;

        // Set color to match app accent
        tg.MainButton.setParams({
            text,
            color: '#007AFF', // Standard iOS blue or use your accent color hex
            text_color: '#FFFFFF',
            is_active: isActive,
            is_visible: isVisible
        });

        // Explicit show just in case setParams doesn't trigger it immediately on some clients
        if (isVisible) tg.MainButton.show();
        else tg.MainButton.hide();

        tg.MainButton.onClick(onClick);

        return () => {
            tg.MainButton.offClick(onClick);
            tg.MainButton.hide();
        };
    }, [text, onClick, isVisible, isActive]);
}

export function useTelegram() {
    const tg = getTelegramWebApp();
    return {
        tg,
        user: tg?.initDataUnsafe?.user,
        queryId: tg?.initDataUnsafe?.query_id,
    };
}
