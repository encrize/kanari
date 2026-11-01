import { getTranslation, Language, LOCALES } from '../services/i18n';

export interface TranslationStrings {
  appName: string;
  appSubtitle: string;
  tabPractice: string;
  tabWords: string;
  tabTofugu: string;
  tabChart: string;
  tabStats: string;
  tabSettings: string;
  proUnlockedBadge: string;
  allFeaturesFree: string;
  proModalTitle: string;
  proModalDesc: string;
  proModalClose: string;
  scriptKatakana: string;
  scriptHiragana: string;
  scriptBoth: string;
  selectGroups: string;
  selectedGroupsCount: (count: number, total: number) => string;
  selectAll: string;
  deselectAll: string;
  startPractice: string;
  selectStages: string;
  stageTitle: (n: number) => string;
  stageSubtitle: string;
  streakDays: (n: number) => string;
  dailyGoal: string;
  accuracy: string;
  totalPracticed: string;
  weakCharacters: string;
  practiceMistakes: string;
  noMistakesYet: string;
  nextCharacter: string;
  checkAnswer: string;
  correct: string;
  incorrect: string;
  streakCombo: (n: number) => string;
  drawPrompt: string;
  clearCanvas: string;
  toggleGuide: string;
  showAnswer: string;
  practiceAgain: string;
  stageCompleted: string;
  wellDone: string;
  typeRomajiPlaceholder: string;
  streamLives: string;
  score: string;
  highScore: string;
  listenReplay: string;
  strokeAnimationSpeed: string;
  stepByStep: string;
  playAllStrokes: string;
  pauseStroke: string;
  pairMatchesRemaining: (n: number) => string;
  voiceGender: string;
  voiceSpeed: string;
  fontFamily: string;
  soundEffects: string;
  audioPronunciation: string;
  timerMode: string;
  resetProgress: string;
  resetConfirm: string;
  themeToggle: string;
  englishMeaning: string;
  russianMeaning: string;
  // Tofugu Mode Translations
  tofuguTitle: string;
  tofuguRule1: string;
  tofuguRule2: string;
  tofuguRule3: string;
  tofuguRule4: string;
  tofuguRule5: string;
  tofuguFinishQuiz: string;
  tofuguStartQuiz: string;
  tofuguSetupTitle: string;
  tofuguSetupDesc: string;
  tofuguCompletedCards: (c: number, t: number) => string;
  tofuguAccuracyScore: (score: number, total: number, pct: number) => string;
  tofuguRetryMistakes: string;
  tofuguTryAgain: string;
  tofuguNewSetup: string;
}

export const TRANSLATIONS: Record<'ru' | 'en', TranslationStrings> = {
  en: {
    appName: 'Kana Pro',
    appSubtitle: 'Japanese Kana Master',
    tabPractice: 'Practice',
    tabWords: 'Word Mode',
    tabTofugu: 'Tofugu Quiz',
    tabChart: 'Kana Chart',
    tabStats: 'Statistics',
    tabSettings: 'Settings',
    proUnlockedBadge: 'PRO Unlocked',
    allFeaturesFree: 'All 9 stages and learning modes are unlocked!',
    proModalTitle: 'All Learning Features Unlocked',
    proModalDesc:
      'In the official Kana Pro app, stages 5-9 (word typing, falling stream, audio listening, stroke order, canvas drawing) and additional groups are locked behind a paywall. Here, EVERY single mode, the complete Katakana and Hiragana syllabaries, native speaker recordings, and vector stroke animations are unlocked for everyone!',
    proModalClose: 'Awesome, let\'s study!',
    scriptKatakana: 'Katakana (カタカナ)',
    scriptHiragana: 'Hiragana (ひらがな)',
    scriptBoth: 'Both Scripts (Mixed)',
    selectGroups: 'Character Groups',
    selectedGroupsCount: (c, t) => `Selected: ${c} of ${t} groups`,
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    startPractice: 'Start Practice Session',
    selectStages: 'Learning Modes (Stages 1–9)',
    stageTitle: (n) => `Stage ${n}`,
    stageSubtitle: 'Select exercises for your session',
    streakDays: (n) => `${n}-day streak`,
    dailyGoal: 'Daily Goal',
    accuracy: 'Accuracy',
    totalPracticed: 'Total Attempts',
    weakCharacters: 'Tricky Characters (Errors)',
    practiceMistakes: 'Practice Mistakes Only',
    noMistakesYet: 'No mistakes recorded yet! Perfect memory!',
    nextCharacter: 'Next',
    checkAnswer: 'Check',
    correct: 'Correct!',
    incorrect: 'Incorrect!',
    streakCombo: (n) => `${n} in a row 🔥`,
    drawPrompt: 'Draw the kana for syllable:',
    clearCanvas: 'Clear',
    toggleGuide: 'Ghost Guide',
    showAnswer: 'Show Answer',
    practiceAgain: 'Practice Again',
    stageCompleted: 'Stage Completed!',
    wellDone: 'Brilliant work! Your reading speed is getting faster!',
    typeRomajiPlaceholder: 'Type romaji...',
    streamLives: 'Lives',
    score: 'Score',
    highScore: 'High Score',
    listenReplay: 'Replay Audio',
    strokeAnimationSpeed: 'Animation Speed',
    stepByStep: 'Step by Step',
    playAllStrokes: 'Play Strokes',
    pauseStroke: 'Pause',
    pairMatchesRemaining: (n) => `Remaining pairs: ${n}`,
    voiceGender: 'Speaker Voice',
    voiceSpeed: 'Speech Speed',
    fontFamily: 'Japanese Font',
    soundEffects: 'Sound Effects',
    audioPronunciation: 'Audio Pronunciation',
    timerMode: 'Timer Mode',
    resetProgress: 'Reset Progress',
    resetConfirm: 'Are you sure you want to reset all training stats and history?',
    themeToggle: 'Appearance Theme',
    englishMeaning: 'English',
    russianMeaning: 'Russian',
    tofuguTitle: 'Type Romaji for the Kana You Know',
    tofuguRule1: 'Type your answer in romaji in the card\'s text field',
    tofuguRule2: 'Press ENTER to submit',
    tofuguRule3: 'Repeat for as many cards as you can',
    tofuguRule4: 'You can try as many times as you want',
    tofuguRule5: 'When you\'re done press the "Finish Quiz" button at the bottom',
    tofuguFinishQuiz: 'Finish Quiz',
    tofuguStartQuiz: 'Start Quiz',
    tofuguSetupTitle: 'Tofugu Kana Grid Quiz',
    tofuguSetupDesc: 'Select which rows you want on the board, then test your active recall across all cards at once.',
    tofuguCompletedCards: (c, t) => `Completed: ${c} / ${t} cards`,
    tofuguAccuracyScore: (s, t, p) => `Results: ${s} of ${t} (${p}%)`,
    tofuguRetryMistakes: 'Retry Mistake Cards',
    tofuguTryAgain: 'Try Again',
    tofuguNewSetup: 'Change Rows',
  },
  ru: {
    appName: 'Kana Pro',
    appSubtitle: 'Мастер Японской Каны',
    tabPractice: 'Тренировка',
    tabWords: 'Слова',
    tabTofugu: 'Tofugu Квиз',
    tabChart: 'Таблица кан',
    tabStats: 'Статистика',
    tabSettings: 'Настройки',
    proUnlockedBadge: 'PRO Разблокировано',
    allFeaturesFree: 'Все 9 режимов и функции доступны без ограничений!',
    proModalTitle: 'Все режимы обучения доступны',
    proModalDesc:
      'В оригинальном приложении Kana Pro режимы 5-9 (слова, скоростной поток, аудирование, порядок черт, рисование на холсте) и дополнительные группы заблокированы за платной подпиской. Здесь ВСЕ эти режимы, полная база Катаканы и Хираганы, аудиозаписи дикторов и векторные анимации черт доступны без ограничений!',
    proModalClose: 'Отлично, начать учить!',
    scriptKatakana: 'Катакана (カタカナ)',
    scriptHiragana: 'Хирагана (ひらがな)',
    scriptBoth: 'Обе каны (Смешанный)',
    selectGroups: 'Группы символов',
    selectedGroupsCount: (c, t) => `Выбрано: ${c} из ${t} групп`,
    selectAll: 'Выбрать все',
    deselectAll: 'Снять выбор',
    startPractice: 'Начать тренировку',
    selectStages: 'Режимы обучения (Этапы 1–9)',
    stageTitle: (n) => `Этап ${n}`,
    stageSubtitle: 'Выберите упражнения для сессии',
    streakDays: (n) => `${n} дн. ударный режим`,
    dailyGoal: 'Цель на день',
    accuracy: 'Точность',
    totalPracticed: 'Всего ответов',
    weakCharacters: 'Трудные символы (Ошибки)',
    practiceMistakes: 'Тренировать только ошибки',
    noMistakesYet: 'Ошибок пока нет! Отличная память!',
    nextCharacter: 'Дальше',
    checkAnswer: 'Проверить',
    correct: 'Правильно!',
    incorrect: 'Неверно!',
    streakCombo: (n) => `Серия: ${n} 🔥`,
    drawPrompt: 'Нарисуйте кану для слога:',
    clearCanvas: 'Очистить',
    toggleGuide: 'Подсказка контура',
    showAnswer: 'Показать оригинал',
    practiceAgain: 'Повторить тренировку',
    stageCompleted: 'Этап пройден!',
    wellDone: 'Великолепная работа! Ваши навыки чтения растут!',
    typeRomajiPlaceholder: 'Введите ромаджи...',
    streamLives: 'Жизни',
    score: 'Очки',
    highScore: 'Рекорд',
    listenReplay: 'Повторить аудио',
    strokeAnimationSpeed: 'Скорость анимации',
    stepByStep: 'По чертам',
    playAllStrokes: 'Анимация черт',
    pauseStroke: 'Пауза',
    pairMatchesRemaining: (n) => `Осталось пар: ${n}`,
    voiceGender: 'Голос диктора',
    voiceSpeed: 'Скорость речи',
    fontFamily: 'Японский шрифт',
    soundEffects: 'Звуковые эффекты',
    audioPronunciation: 'Озвучивание каны',
    timerMode: 'Таймер на вопрос',
    resetProgress: 'Сбросить прогресс',
    resetConfirm: 'Вы уверены, что хотите сбросить всю статистику и историю?',
    themeToggle: 'Тема оформления',
    englishMeaning: 'Английский',
    russianMeaning: 'Русский',
    tofuguTitle: 'Type Romaji for the Kana You Know',
    tofuguRule1: 'Введите ответ ромаджи в поле карточки',
    tofuguRule2: 'Нажмите ENTER для подтверждения',
    tofuguRule3: 'Повторите для стольких карточек, сколько знаете',
    tofuguRule4: 'Вы можете пробовать неограниченное количество раз',
    tofuguRule5: 'Когда закончите, нажмите кнопку "Finish Quiz" внизу',
    tofuguFinishQuiz: 'Finish Quiz',
    tofuguStartQuiz: 'Начать квиз',
    tofuguSetupTitle: 'Tofugu Квиз по сетке карточек',
    tofuguSetupDesc: 'Выберите нужные строки каны и проверяйте активное вспоминание прямо на интерактивной сетке.',
    tofuguCompletedCards: (c, t) => `Завершено: ${c} / ${t} карточек`,
    tofuguAccuracyScore: (s, t, p) => `Результат: ${s} из ${t} (${p}%)`,
    tofuguRetryMistakes: 'Повторить только ошибки',
    tofuguTryAgain: 'Попробовать снова',
    tofuguNewSetup: 'Изменить строки',
  },
};

export { getTranslation };
export type { Language };
