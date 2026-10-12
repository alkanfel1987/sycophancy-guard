// sycophancy-guard / lib / rules.js
// Trigger categories for sycophancy-inducing patterns in user prompts.
// Each rule returns an array of matches (or empty). Patterns cover RU + EN.
//
// IMPORTANT: JS regex `\b` (word boundary) is ASCII-only, breaks on Cyrillic.
// All RU patterns use Unicode-aware lookbehind/lookahead instead:
//   B_START = '(?<!\\p{L})'    — must not be preceded by any letter
//   B_END   = '(?!\\p{L})'     — must not be followed by any letter
// All such patterns must use the `u` flag.
//
// Severity per match:
//   1 = mild | 2 = medium | 3 = strong

'use strict';

// Universal Unicode word boundary (works for any language with the `u` flag)
const BS = '(?<!\\p{L})';
const BE = '(?!\\p{L})';

const RULES = [
  // ─────────────────────────────────────────────────────────────────
  // 1. Pre-loaded conclusions — answer is already embedded in question
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'pre_loaded_conclusion',
    label_en: 'Pre-loaded conclusion',
    label_ru: 'Предзаданный вывод',
    severity: 3,
    description_ru: 'Ответ уже встроен в вопрос. Я склонен подтвердить, а не оценить.',
    compensation_ru: 'Сформулировать сильнейший аргумент ПРОТИВ позиции пользователя ПЕРВЫМ, до оценки.',
    patterns: [
      // RU
      new RegExp(`${BS}(подтверди|подтвердите|согласен\\?|согласись|правильно (ли )?я (думаю|понимаю|мыслю|рассуждаю))${BE}`, 'iu'),
      new RegExp(`${BS}я (думаю|считаю|полагаю|уверен)[^.?!]{0,80}[?,]\\s*(да\\??|так\\??|верно\\??|согласен\\??|правда\\??)`, 'iu'),
      new RegExp(`${BS}ты\\s+(же\\s+)?(видишь|понимаешь|знаешь|согласишься|согласен)${BE}`, 'iu'),
      new RegExp(`${BS}очевидно\\s+(же\\s+)?,?\\s*что${BE}`, 'iu'),
      new RegExp(`${BS}ведь\\s+это\\s+(так|правда|очевидно)${BE}`, 'iu'),
      // EN
      /\b(confirm|right\?|am i right|do you agree|don['’]t you (think|agree))\b/i,
      /\bi (think|believe|feel)[^.?!]{0,80}[?,]\s*(right|yes|correct|agree)\??/i,
      /\bobviously\s*,?\s*(this|that|it)\s+(is|are)\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. Ownership / sunk-cost markers
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ownership_sunk_cost',
    label_en: 'Ownership / sunk-cost',
    label_ru: 'Собственничество / уже вложено',
    severity: 2,
    description_ru: 'Маркеры "это моё / уже потратил". Триггерят моё желание не разочаровать.',
    compensation_ru: 'Оценивать как чужой артефакт. Не смягчать критику из-за вложенных усилий.',
    patterns: [
      // RU
      new RegExp(`${BS}(наш|наша|наше|наши|мой|моя|моё|мои|нашего|нашему|нашим|нашей|моего|моему|моим|моей)\\s+(подход|идея|проект|решение|архитектура|план|стратегия|гипотеза|концепция|метод|вариант|проекта|подхода|идеи|решения)${BE}`, 'iu'),
      new RegExp(`${BS}я\\s+уже\\s+(потратил|вложил|сделал|написал|задеплоил|отправил|реализовал)${BE}`, 'iu'),
      new RegExp(`${BS}уже\\s+(в\\s+коде|в\\s+проде|задеплоено|отправлено|реализовано)${BE}`, 'iu'),
      new RegExp(`${BS}(месяц|неделя|неделю|неделями|год|года|квартал)[а-я]*\\s+(потратил|работаю|разрабатываю|строю)`, 'iu'),
      new RegExp(`${BS}(три|четыре|пять|шесть|семь)\\s+(недели|месяца|года)`, 'iu'),
      // EN
      /\b(my|our)\s+(approach|idea|project|solution|architecture|plan|strategy|hypothesis|concept|method)\b/i,
      /\bi (already|have)\s+(spent|invested|built|written|deployed|shipped|implemented)\b/i,
      /\b(weeks?|months?|years?)\s+of\s+work\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. Authority claims
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'authority_claim',
    label_en: 'Authority claim',
    label_ru: 'Заявление авторитета',
    severity: 2,
    description_ru: 'Заявление экспертизы/опыта. Триггерят deference (склонение перед авторитетом).',
    compensation_ru: 'Оценивать аргумент по существу, не по статусу автора. Профессионалы тоже ошибаются.',
    patterns: [
      // RU
      new RegExp(`${BS}как\\s+(эксперт|специалист|профессионал|инженер|архитектор|разработчик|учёный|врач|юрист)${BE}`, 'iu'),
      new RegExp(`${BS}по\\s+моему\\s+опыту${BE}`, 'iu'),
      new RegExp(`${BS}за\\s+\\d+\\s+(лет|года?)\\s+(опыта|работы|в\\s+индустрии)`, 'iu'),
      new RegExp(`${BS}\\d+\\s+лет\\s+опыта`, 'iu'),
      new RegExp(`${BS}(все|каждый)\\s+(эксперты|специалисты|профессионалы)\\s+(говорят|знают|согласны)`, 'iu'),
      new RegExp(`${BS}известно,?\\s+что${BE}`, 'iu'),
      // EN
      /\bas\s+(an?\s+)?(expert|professional|engineer|architect|developer|scientist|doctor|lawyer)\b/i,
      /\bin\s+my\s+(experience|expert\s+opinion)\b/i,
      /\b\d+\s+years?\s+of\s+(experience|industry)\b/i,
      /\bit['’]?s\s+well[\s-]known\s+that\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. Affective signals
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'affective_excitement',
    label_en: 'Affective: excitement',
    label_ru: 'Эмоция: восторг',
    severity: 2,
    description_ru: 'Восторженный тон. Я склонен подстроить ответ под эмоцию, а не под точность.',
    compensation_ru: 'Не подыгрывать эмоции. Сохранить нейтральный тон оценки.',
    patterns: [
      new RegExp(`${BS}(гениально|гениальная|гениальный|офигенн[оаыую]|круто|шикарно|потрясающе|восхитительно|идеально)`, 'iu'),
      /\b(brilliant|amazing|awesome|fantastic|incredible|perfect|genius)/i,
      /!{2,}/,
      // CAPS WORD: Cyrillic ≥4 (русские слова длиннее).
      // Latin: одиночное слово капсом — почти всегда аббревиатура или имя базы (GRETIL, NVIDIA,
      // SPARQL); крик — это фраза из трёх+ слов капсом. Ложное срабатывание 2026-10-13 на «GRETIL».
      /[А-ЯЁ]{4,}/u,
      /\b[A-Z]{3,}(?:\s+[A-Z]{3,}){2,}\b/,
    ],
  },
  {
    id: 'affective_frustration',
    label_en: 'Affective: frustration',
    label_ru: 'Эмоция: раздражение',
    severity: 2,
    description_ru: 'Раздражённый тон. Я склонен извиниться и согласиться вместо проверки.',
    compensation_ru: 'Не извиняться. Проверить факты, не реагировать на тон.',
    patterns: [
      new RegExp(`${BS}(опять|снова)\\s+(не\\s+работает|ошибка|сломалось|не\\s+то)`, 'iu'),
      new RegExp(`${BS}(задолбал[оа]?|достал[оа]?|сколько\\s+можно|почему\\s+ты\\s+(не|постоянно))`, 'iu'),
      new RegExp(`${BS}ты\\s+(постоянно|всегда)?\\s*ошиб[аеио][сшщ][ьея]?`, 'iu'),
      /\b(again|broken|still\s+not\s+working|why\s+can['’]?t\s+you)\b/i,
      /\byou['’]?re\s+wrong\b/i,
    ],
  },
  {
    id: 'affective_vulnerability',
    label_en: 'Affective: vulnerability',
    label_ru: 'Эмоция: уязвимость',
    severity: 2,
    description_ru: 'Маркеры "я не уверен / новичок". Триггерят моё patronising helpfulness вместо честности.',
    compensation_ru: 'Не упрощать факты ради комфорта. Не превращать оценку в подбадривание.',
    patterns: [
      new RegExp(`${BS}я\\s+(новичок|начинающий|не\\s+уверен|не\\s+знаю|не\\s+понимаю|совсем\\s+не)`, 'iu'),
      new RegExp(`${BS}(помоги|подскажи)[,!]?\\s+я`, 'iu'),
      /\bi['’]?m\s+(a\s+)?(beginner|new(\s+to)?|not\s+sure|lost)\b/i,
      /\bplease\s+help[,!]?\s+i\s+(don['’]t|am)\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. Closed framing
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'closed_framing',
    label_en: 'Closed framing',
    label_ru: 'Закрытое обрамление',
    severity: 1,
    description_ru: 'Forced choice без опции "ни одно / другое". Я склонен принять рамку.',
    compensation_ru: 'Явно указать опцию "ни одно из этого" или "третий вариант", если применимо.',
    patterns: [
      new RegExp(`${BS}(да|нет)\\s+или\\s+(нет|да)\\?`, 'iu'),
      /^\s*(да|нет)\s*\??$/iu,
      /\b(yes|no)\s+or\s+(no|yes)\?/i,
      new RegExp(`${BS}коротко[:,]\\s*(да|нет)${BE}`, 'iu'),
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. Social pressure
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'social_pressure',
    label_en: 'Social pressure',
    label_ru: 'Социальное давление',
    severity: 2,
    description_ru: 'Апелляция к "все так делают". Я склонен присоединиться к консенсусу.',
    compensation_ru: 'Игнорировать аргумент популярности. Оценить позицию по существу.',
    patterns: [
      new RegExp(`${BS}все\\s+(так\\s+делают|согласны|знают|используют)`, 'iu'),
      new RegExp(`${BS}(стандартная|общепринятая|индустриальная)\\s+практика`, 'iu'),
      new RegExp(`${BS}никто\\s+не\\s+(сомневается|спорит|возражает)`, 'iu'),
      new RegExp(`${BS}только\\s+(дурак|идиот|новичок)\\s+не\\s+согласится`, 'iu'),
      /\beveryone\s+(does|knows|agrees)\b/i,
      /\b(industry|standard)\s+practice\b/i,
      /\bno\s+one\s+(doubts|questions|disagrees)\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 7. Time pressure
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'time_pressure',
    label_en: 'Time pressure',
    label_ru: 'Давление времени',
    severity: 1,
    description_ru: 'Срочность. Я склонен срезать углы и упрощать вместо проверки.',
    compensation_ru: 'Не сокращать verification. Срочность не повод для слабого анализа.',
    patterns: [
      new RegExp(`${BS}(срочн[оаыую]|быстро|немедленно|сейчас\\s+же)`, 'iu'),
      new RegExp(`${BS}без\\s+(долгих\\s+)?рассуждений`, 'iu'),
      new RegExp(`${BS}у\\s+меня\\s+нет\\s+времени`, 'iu'),
      /\b(urgent|asap|quickly|right now|no time)\b/i,
      /\bjust\s+(give|tell)\s+me\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 8. Manufactured consistency
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'manufactured_consistency',
    label_en: 'Manufactured consistency',
    label_ru: 'Поддельная согласованность',
    severity: 3,
    description_ru: 'Ссылка на "ты же говорил/обещал". Попытка запереть в позиции.',
    compensation_ru: 'Не принимать утверждение о прошлых словах без верификации. Если в transcript не подтверждается — flag.',
    patterns: [
      new RegExp(`${BS}ты\\s+(же\\s+)?(говорил|сказал|обещал|признал|согласился|подтвердил)${BE}`, 'iu'),
      new RegExp(`${BS}помни[,!]?\\s+ты`, 'iu'),
      new RegExp(`${BS}ты\\s+сам\\s+(говорил|сказал|признал|согласился)`, 'iu'),
      /\bremember[,!]?\s+you\s+(said|promised|agreed)\b/i,
      /\byou\s+(yourself|already)\s+(said|admitted|agreed)\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 9. Naturalization appeal — "это просто человеческая природа"
  // catalogue: ns-nityasama-5-1-35 (Nyāya-sūtra, eternalist rejoinder)
  // The user frames a contingent fact as immutable to suppress critique.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'naturalization_appeal',
    label_en: 'Naturalization appeal (nitya-sama)',
    label_ru: 'Натурализация — «всегда так было»',
    severity: 2,
    description_ru: 'Утверждение что X неизменно по природе («человеческая природа», «всегда так было») — попытка отрезать пространство критики и реформы. Я склонен согласиться вместо проверки.',
    compensation_ru: 'Не принимать «природу» как ground-truth. Спросить: каков временной период наблюдения? Существуют ли контрпримеры? Что меняется при смене контекста? Нет ничего автоматически immutable.',
    patterns: [
      new RegExp(`${BS}человеческ(?:ая|ой|ую)\\s+природ`, 'iu'),
      new RegExp(`${BS}природ[ауые]\\s+человека${BE}`, 'iu'),
      new RegExp(`${BS}всегда\\s+так\\s+(?:было|есть|будет)${BE}`, 'iu'),
      new RegExp(`${BS}во\\s+все\\s+времена${BE}`, 'iu'),
      new RegExp(`${BS}испокон\\s+веков${BE}`, 'iu'),
      new RegExp(`${BS}(?:это\\s+)?нельзя\\s+(?:изменить|побороть|переделать)${BE}`, 'iu'),
      /\bhuman\s+nature\b/i,
      /\balways\s+been\s+(?:this|that)\s+way\b/i,
      /\binherent(?:ly)?\s+(?:to|in)\s+(?:human|man|people)\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 10. False equivalence by levelling
  // catalogue: ns-avisesa-sama-5-1-23 (Nyāya-sūtra, levelling-jāti)
  // catalogue: ns-anityasama-5-1-32
  // The user collapses genuine distinctions via trivial shared property
  // to disable evaluative comparison.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'false_equivalence_levelling',
    label_en: 'False equivalence by levelling (aviśeṣa-sama)',
    label_ru: 'Ложная эквивалентность через тривиальное свойство',
    severity: 2,
    description_ru: 'Уравнивание разных вариантов через общее тривиальное свойство («все одинаково плохи», «обе стороны»). Попытка обесценить мою оценку. Я склонен принять рамку «всё одно и то же» вместо различения.',
    compensation_ru: 'Восстановить различения. Спросить: какое именно общее свойство — и достаточно ли оно для эквивалентности? То же рассуждение левелит ВСЁ?',
    patterns: [
      new RegExp(`${BS}(?:все|оба|обе)\\s+(?:варианта|подхода|фреймворка|инструмента|стороны)\\s+(?:одинаково|равно)\\s+(?:плох|хорош|бесполезн|бесмысленн)`, 'iu'),
      new RegExp(`${BS}нет\\s+принципиальной\\s+разницы\\s+между${BE}`, 'iu'),
      new RegExp(`${BS}(?:в\\s+итоге|по\\s+сути|в\\s+конечном\\s+счёте)\\s+(?:это\\s+)?одно\\s+и\\s+то\\s+же${BE}`, 'iu'),
      new RegExp(`${BS}все\\s+они\\s+одинаков`, 'iu'),
      /\bboth\s+(?:approaches|frameworks|sides|options)\s+(?:are\s+)?(?:equally|just\s+as)\s+(?:bad|good|useless)\b/i,
      /\bno\s+real\s+difference\s+between\b/i,
      /\bthey['’]re\s+all\s+the\s+same\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 11. Silence-as-evidence
  // catalogue: ns-apratibha-5-2-18 (Nyāya-sūtra, defeat-by-silence)
  // The user infers agreement/concession from prior non-objection.
  // Distinct from manufactured_consistency (which cites prior STATEMENTS).
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'silence_as_evidence',
    label_en: 'Silence-as-evidence (apratibhā)',
    label_ru: 'Молчание как согласие',
    severity: 2,
    description_ru: 'Ссылка на моё прошлое МОЛЧАНИЕ как proof согласия («ты не возражал — значит согласен»). В неформальном диалоге молчание ≠ concession (могло быть irrelevant, бережение лимита, fallback). Я склонен принять навязанное согласие, чтобы не казаться непоследовательным.',
    compensation_ru: 'Не принимать «ты не возразил» как ratifying past assent. Прошлое молчание имеет много причин — спросить о чём именно я молчал и проверить, было ли там actual согласие.',
    patterns: [
      new RegExp(`${BS}ты\\s+(?:тогда|раньше|до\\s+этого)?\\s*не\\s+(?:возражал|спорил|противоречил|отрицал)`, 'iu'),
      new RegExp(`${BS}(?:твоё|твое)\\s+молчание\\s+(?:говорит|означает|значит|подтверждает)`, 'iu'),
      new RegExp(`${BS}раз\\s+ты\\s+(?:промолчал|не\\s+ответил|не\\s+возразил)\\s*[—,]\\s*значит`, 'iu'),
      new RegExp(`${BS}ты\\s+согласился,?\\s+иначе\\s+(?:ты\\s+бы\\s+)?возразил`, 'iu'),
      /\byou\s+didn['’]?t\s+(?:object|disagree|push\s+back)\b/i,
      /\byour\s+silence\s+(?:means|confirms|implies)\b/i,
      /\bif\s+you\s+(?:didn['’]?t|hadn['’]?t)\s+(?:agreed|accepted)\b/i,
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 12. Anecdotal override
  // catalogue: ns-upalabdhi-sama-5-1-27 (Nyāya-sūtra, perception-jāti)
  // The user uses single direct experience to displace systematic
  // reasoning ("I tried it once, it didn't work").
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'anecdotal_override',
    label_en: 'Anecdotal override (upalabdhi-sama)',
    label_ru: 'Анекдотический опыт против анализа',
    severity: 2,
    description_ru: 'Использование N=1 личного опыта чтобы перекрыть систематический анализ («я пробовал — не работает»). Попытка отменить мою аргументацию через единичное наблюдение. Я склонен капитулировать перед личным опытом, а не интегрировать его как один data-point.',
    compensation_ru: 'Не отменять анализ из-за N=1. Спросить: какие были условия? Был ли ясен механизм неудачи? Систематические данные и личный опыт — разные источники, обе нуждаются в интерпретации.',
    patterns: [
      new RegExp(`${BS}я\\s+(?:сам|лично)\\s+(?:видел|пробовал|проверял|испытал)`, 'iu'),
      new RegExp(`${BS}у\\s+меня\\s+(?:это\\s+)?(?:не\\s+)?(?:сработал[оа]?|работает)\\s*[—,]\\s*(?:значит|поэтому)`, 'iu'),
      new RegExp(`${BS}своими\\s+глазами\\s+видел`, 'iu'),
      new RegExp(`${BS}мой\\s+(?:личный\\s+)?опыт\\s+(?:показывает|говорит|доказывает)`, 'iu'),
      /\bI\s+(?:saw|tried|tested)\s+it\s+(?:myself|with\s+my\s+own)\b/i,
      /\bin\s+my\s+experience\s+(?:it|that|this)\s+(?:doesn['’]?t|didn['’]?t)\s+work\b/i,
      /\bmy\s+(?:personal\s+)?experience\s+(?:proves|shows)\b/i,
    ],
  },
];

function detect(promptText, options = {}) {
  const disabled = new Set(options.disabled_rules || []);
  const triggered = [];
  for (const rule of RULES) {
    if (disabled.has(rule.id)) continue;
    const matches = [];
    for (const pattern of rule.patterns) {
      const m = promptText.match(pattern);
      if (m) matches.push(m[0]);
    }
    if (matches.length > 0) {
      triggered.push({
        id: rule.id,
        label_en: rule.label_en,
        label_ru: rule.label_ru,
        severity: rule.severity,
        description_ru: rule.description_ru,
        compensation_ru: rule.compensation_ru,
        match_count: matches.length,
        matches: matches.slice(0, 5),
      });
    }
  }
  return triggered;
}

module.exports = { RULES, detect };
