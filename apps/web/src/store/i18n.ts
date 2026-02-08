import { create } from 'zustand';

export type Locale = 'ru' | 'en';

interface I18nStore {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
    ru: {
        // HomeScreen
        'home.play': 'Играть',
        'home.rules': 'Правила',
        'home.settings': 'Настройки',

        // SetupScreen
        'setup.title': 'Настройка игры',
        'setup.size': 'Размер',
        'setup.mode': 'Режим',
        'setup.difficulty': 'Сложность',
        'setup.selected': 'Выбранные параметры',
        'setup.mini': 'Мини',
        'setup.standard': 'Стандарт',
        'setup.large': 'Большой',
        'setup.pvp': 'PvP',
        'setup.single': 'Одиночная',
        'setup.easy': 'Легкий',
        'setup.medium': 'Средний',
        'setup.hard': 'Сложный',

        // GameScreen
        'game.new': 'Новая',
        'game.turn': 'Ход',
        'game.ai_thinking': 'ИИ думает…',
        'game.lines': 'Линии',
        'game.cells': 'Клетки',
        'game.mode': 'Режим',
        'game.hints': 'Подсказки захвата',
        'game.on': 'Вкл',
        'game.off': 'Выкл',

        // RulesScreen
        'rules.title': 'Правила',
        'rules.draw_line': 'Проведи линию',
        'rules.draw_line_desc': 'Соедини любые две соседние точки линией. Линии не могут пересекаться или дублироваться.',
        'rules.capture': 'Замкни квадрат',
        'rules.capture_desc': 'Когда ты рисуешь четвертую сторону квадрата, он становится твоим! Внутри появится твой символ (X или O).',
        'rules.extra': 'Дополнительный ход',
        'rules.extra_desc': 'Если ты захватил квадрат, ты ОБЯЗАН сделать еще один ход. Можно захватывать цепочки квадратов!',
        'rules.win': 'Победа',
        'rules.win_desc': 'Игра заканчивается, когда все линии нарисованы. Побеждает тот, кто захватил больше квадратов.',

        // SettingsScreen
        'settings.title': 'Настройки',
        'settings.sound': 'Звук',
        'settings.animations': 'Анимации',
        'settings.language': 'Язык',
        'settings.feedback': 'Обратная связь',
        'settings.back': 'Назад',

        // GameOver
        'gameover.win': 'победил!',
        'gameover.draw': 'Ничья!',
        'gameover.margin': 'Перевес',
        'gameover.menu': 'Меню',
        'gameover.restart': 'Ещё раз',

        // SplashScreen
        'splash.subtitle': 'Стратегическая игра'
    },
    en: {
        // HomeScreen
        'home.play': 'Play',
        'home.rules': 'Rules',
        'home.settings': 'Settings',

        // SetupScreen
        'setup.title': 'Game Setup',
        'setup.size': 'Size',
        'setup.mode': 'Mode',
        'setup.difficulty': 'Difficulty',
        'setup.selected': 'Selected options',
        'setup.mini': 'Mini',
        'setup.standard': 'Standard',
        'setup.large': 'Large',
        'setup.pvp': 'PvP',
        'setup.single': 'Single',
        'setup.easy': 'Easy',
        'setup.medium': 'Medium',
        'setup.hard': 'Hard',

        // GameScreen
        'game.new': 'New',
        'game.turn': 'Turn',
        'game.ai_thinking': 'AI thinking…',
        'game.lines': 'Lines',
        'game.cells': 'Cells',
        'game.mode': 'Mode',
        'game.hints': 'Capture hints',
        'game.on': 'On',
        'game.off': 'Off',

        // RulesScreen
        'rules.title': 'Rules',
        'rules.draw_line': 'Draw a line',
        'rules.draw_line_desc': 'Connect any two adjacent dots with a line. Lines cannot cross or overlap.',
        'rules.capture': 'Capture a square',
        'rules.capture_desc': 'When you draw the fourth side of a square, it becomes yours! Your symbol (X or O) appears inside.',
        'rules.extra': 'Extra turn',
        'rules.extra_desc': 'If you capture a square, you MUST take another turn. You can chain captures!',
        'rules.win': 'Victory',
        'rules.win_desc': 'The game ends when all lines are drawn. The player with more squares wins.',

        // SettingsScreen
        'settings.title': 'Settings',
        'settings.sound': 'Sound',
        'settings.animations': 'Animations',
        'settings.language': 'Language',
        'settings.feedback': 'Feedback',
        'settings.back': 'Back',

        // GameOver
        'gameover.win': 'wins!',
        'gameover.draw': 'Draw!',
        'gameover.margin': 'Margin',
        'gameover.menu': 'Menu',
        'gameover.restart': 'Play again',

        // SplashScreen
        'splash.subtitle': 'Strategy game'
    }
};

export const useI18n = create<I18nStore>((set, get) => ({
    locale: 'ru',
    setLocale: (locale) => set({ locale }),
    t: (key) => {
        const { locale } = get();
        return translations[locale][key] ?? key;
    }
}));
