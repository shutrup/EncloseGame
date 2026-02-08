import { useEffect } from 'react';
import { getTelegramWebApp } from '../lib/telegram';

const tg = getTelegramWebApp();

export function useTelegramBackButton(onClick: () => void) {
    useEffect(() => {
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
        if (!tg) return;

        // Set color to match app accent
        tg.MainButton.setParams({
            text,
            color: '#007AFF', // Standard iOS blue or use your accent color hex
            text_color: '#FFFFFF',
            is_active: isActive,
            is_visible: isVisible
        });

        tg.MainButton.onClick(onClick);

        return () => {
            tg.MainButton.offClick(onClick);
            tg.MainButton.hide();
        };
    }, [text, onClick, isVisible, isActive]);
}

export function useTelegram() {
    return {
        tg,
        user: tg?.initDataUnsafe?.user,
        queryId: tg?.initDataUnsafe?.query_id,
    };
}
