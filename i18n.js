/* ════════════════════════════════════════════════════════════════════
   PEAR · i18n - automatic Hebrew / English localisation
   ════════════════════════════════════════════════════════════════════

   LOADING: this file is a CLASSIC, RENDER-BLOCKING <script> in <head>,
   deliberately not defer/async. It has to run before the browser paints
   the body, because it sets <html lang> / <html dir> and swaps the
   document title + meta description.
שגשגשג
   STRICT RESOLUTION ORDER (first hit wins):
     1. ?lang=he|en in the URL - what the hreflang alternates point at,
        so a search engine landing on /?lang=en gets English markup with
        no guessing at all. Governs ONLY this page load; it is
        deliberately NOT written to localStorage - see setLanguage()'s
        callers for why a shared link must never permanently pin a
        visitor's language.
     2. localStorage['app_lang'], but ONLY if localStorage['app_lang_explicit']
        is '1' - meaning it was written by an actual click on the navbar
        [data-set-lang] toggle (see setLanguage). This is the ONLY thing
        that ever beats geo-IP: a deliberate choice is respected across
        reloads until the visitor toggles again.
     3. Geo-IP. Anything else - no explicit choice on file, or the flag
        without a usable value - runs a FRESH geo-IP lookup on every
        single boot, no cache, no stale reuse. GEO_SOURCES are tried in
        order (ipapi.co, then ip-api.com, then ipinfo.io - see the block
        below for why three) until one answers; only an exact 'IL' match
        resolves to Hebrew, everything else (US via VPN included)
        resolves to DEFAULT_LANG. This is what makes the boot "strict":
        a stale or pre-existing app_lang value that was never confirmed
        by a real click is never trusted - it is overwritten with
        whatever geo-IP says, live, no reload required.

   NO CLOAK: the page always paints DEFAULT_LANG ('en') immediately for
   case 3, then swaps to Hebrew live if geo-IP confirms 'IL'. There is
   nothing to hide behind a cloak for - Hebrew is only ever reached
   through a confirmed 'IL' match or a real toggle click, so the async
   window can only ever produce a possible EN→HE flip, never the
   HE→EN "wrong language for a VPN visitor" flicker this used to guard
   against with a background-verification cloak. That old machinery
   (shared timing budgets, an "unconfirmed" cache, a fade-out cloak) is
   gone; geo-IP is just run straight, every boot, and the result is
   applied directly.

   SECURITY NOTE: values under the `html:` namespace are injected with
   innerHTML. Everything in DICT below is an author-written literal that
   ships with this file - never route visitor input or an API response
   through a `.html` key.
   ════════════════════════════════════════════════════════════════════ */
(function (window, document) {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────────── */
  var SUPPORTED       = ['he', 'en'];
  var DEFAULT_LANG    = 'en';          // every country that isn't Israel
  var GEO_LANG        = 'he';          // …and the one that is
  var GEO_COUNTRY     = 'IL';
  var RTL_LANGS       = ['he'];

  var STAMP           = 'data-i18n-lang'; // language an element currently carries

  var LANG_KEY          = 'app_lang';          // visitor's active language
  var LANG_EXPLICIT_KEY = 'app_lang_explicit'; // '1' iff LANG_KEY came from an actual toggle click

  /* Three independent IP-geolocation providers, tried in order until one
     answers. Each has its own response shape, hence its own `extract`.
     A provider that 400s, times out, CORS-blocks, or returns a body that
     `extract` can't make sense of is treated as a failure and the next
     one is tried immediately - see fromIpLookup().

     ip-api.com's free-tier JSON endpoint has historically not sent CORS
     headers for direct browser calls, so it may fail every time with an
     opaque network error depending on the visitor's browser. That is
     fine and deliberate: it costs one fast local failure, then falls
     through to ipinfo.io exactly like any other provider outage. It
     stays in the list because when it DOES answer it is one more
     independent source between a visitor and the DEFAULT_LANG
     fallback. */
  var GEO_SOURCES = [
    {
      label: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      /* Rate limiting comes back as HTTP 200 + {"error":true}, so `ok`
         alone is not a strong enough success signal. */
      extract: function (data) {
        if (!data || data.error) throw new Error(data && data.reason || 'error');
        return data.country_code;
      }
    },
    {
      label: 'ip-api.com',
      url: 'https://ip-api.com/json',
      extract: function (data) {
        if (!data || data.status !== 'success') throw new Error(data && data.message || 'error');
        return data.countryCode;
      }
    },
    {
      label: 'ipinfo.io',
      url: 'https://ipinfo.io/json',
      extract: function (data) {
        if (!data || !data.country) throw new Error('no country field');
        return data.country;
      }
    }
  ];

  /* Fixed per-provider timeout, tried one at a time - see fromIpLookup().
     700ms was diagnosed in production as too aggressive: every one of
     the three providers was failing with "signal is aborted without
     reason", the fetches being aborted before a real, working response
     could arrive, not because anything was actually down. 3 seconds is
     generous enough to absorb typical VPN-added latency on top of a
     normal geo-IP round trip, for each provider that actually gets
     tried. */
  var GEO_TIMEOUT_MS  = 3000;

  var SITE_ORIGIN     = 'https://platform.pear-ai.io';
  var OG_LOCALE       = { he: 'he_IL', en: 'en_US' };

  /* ════════════════════════════════════════════════════════════════
     DICTIONARY · one entry per language, flat dotted keys.

     Markup keys live under `html:` and are applied with innerHTML -
     that is what lets a sentence keep its inline <span class="brand-pear">
     or coloured emphasis while still being one translatable unit.
     Plain keys under `text:` are applied with textContent.
     ════════════════════════════════════════════════════════════════ */
  var DICT = {

    /* ──────────────────────────── HEBREW ──────────────────────────── */
    he: {
      /* - head / SEO - */
      /* Hebrew stays Hebrew. Dropping the English strings in here would
         collapse the hreflang set - two "languages" serving identical
         copy - and throw away every Hebrew query the site ranks for, so
         the B2B keyword strategy is carried IN Hebrew rather than
         translated away: הפחתת החזרות = reduce return rates,
         הגדלת המרות = boost conversion, הזמנת כמה מידות = bracketing. */
      'meta.title':              'PEAR Platform | תא מדידה וירטואלי ו-AI Virtual Try-On בזמן אמת (PearVTON)',
      'meta.description':        'PEAR (PearVTON) מביאה מדידה וירטואלית ותא מדידה מבוססי AI בזמן אמת לחנויות אופנה אונליין. ודאות מלאה במידה, יותר המרות, סוף להזמנת כמה מידות, וירידה דרמטית בהחזרות.',
      'meta.keywords':           'pear, pear platform, pear ai, pear vton, pearvton, תא מדידה וירטואלי, מדידה וירטואלית, אינטגרציית מדידה אונליין, הלבשה וירטואלית בינה מלאכותית, מדידת בגדים אונליין, המלצת מידה, הפחתת החזרות, הגדלת המרות, אופנה אונליין, AI virtual try on, virtual fitting room',
      'meta.ogTitle':            'PEAR Platform | תא מדידה וירטואלי מבוסס AI לאיקומרס אופנה',
      'meta.ogDescription':      'שדרגו את חנות האופנה שלכם עם PEAR AI Virtual Try-On. הקונים מודדים ומתלבשים וירטואלית, ליותר המרות ופחות החזרות.',
      'meta.twitterTitle':       'PEAR Platform | מדידה וירטואלית בזמן אמת (PearVTON)',
      'meta.twitterDescription': 'וידג\'ט תא מדידה וירטואלי מבוסס AI למותגי אופנה אונליין. פחות החזרות, אפס ספק במידה.',
      'meta.jsonldDescription':  'PEAR Platform (PearVTON) מספקת טכנולוגיית Virtual Try-On ומדידה וירטואלית מבוססת AI בזמן אמת לקמעונאי אופנה אונליין, להגדלת שיעורי ההמרה ולצמצום עלויות ההחזרות.',
      'meta.orgDescription':     'PEAR מפתחת טכנולוגיית Virtual Try-On ומדידה וירטואלית מבוססת AI בזמן אמת לאיקומרס אופנה.',
      'meta.imageAlt':           'הוידג\'ט PEAR AI Virtual Try-On',

      /* - accessibility labels - */
      'a11y.mainNav':       'ניווט ראשי',
      'a11y.langSwitch':    'בחירת שפה',
      'a11y.viewOverview':  'אודות המיזם והפתרון',
      'a11y.viewDocs':      'מדריך הטמעת הוויג\'ט',
      'a11y.viewContact':   'צור קשר',
      /* heroVideo/vtonPause/vtonPlay labelled the hero phone's silent
         loop and its play toggle; vtonMute/vtonUnmute/vtonVolume
         labelled the mute button and volume slider that later sat on
         the cinematic player. All six are gone with the controls they
         named - the hero film is silent and has no controls at all.
         demoVideo is the one survivor: it labels the <video> itself. */
      'a11y.demoVideo':     'סרטון הדגמה מלא של הוידג\'ט PEAR AI Virtual Try-On',
      'a11y.directMeasure': 'מדידה וירטואלית חד-פעמית, ללא שלב הרשמה, פעם אחת בביקור',
      'a11y.fittingRoom':   'PEAR, מדידה וירטואלית חד-פעמית',
      'a11y.closeModal':    'סגירה',
      'a11y.modelPreviewToggle': 'הצגת התמונה על דוגמן/ית',
      'a11y.angleToggleGroup':   'תצוגת חזית / גב',

      /* - navbar - */
      'nav.about':   'על המיזם',
      'nav.docs':    'מדריך הטמעה',
      'nav.contact': 'דברו איתנו',

      /* - scroll HUD chapters -
         hud.demo went with the onyx demo band; the clip it labelled is
         the hero's now and hud.intro covers it. */
      'hud.intro':      'פתיחה',
      'hud.playground': 'נסו בעצמכם',
      'hud.value':      'השפעה עסקית',
      'hud.cta':        'סיום',

      /* - hero -
         Two sentences replaced five. "הלקוחות שלכם מודדים בלי להגיע
         לחנות" described the mechanism; this states the outcome the
         buyer is actually shopping for and names the cost it removes.
         Every figure on the page is unchanged. */
      /* The LTR product-name kicker that opened this headline was
         REMOVED, here and from the matching inline paint in index.html.
         The two must still mirror each other exactly; see the note at
         that <h1>. The old wording is not quoted here on purpose - this
         file is served to the browser, so a comment repeating it would
         ship the very string the removal was meant to retire. */
      /* hero.title is KEPT as it stands, and that is a decision, not an
         oversight. Two things pin it: .pa-skyline__title is capped at
         max-width 15ch, so a longer line wraps to three rows and starts
         pushing the CTA down a 100svh stage; and the existing pair is
         already the strongest construction available in that width - a
         concrete promise and the differentiator, in parallel fragments.
         Every longer rewrite tried here traded the rhyme and the fit for
         nothing. If it is to change, the CSS measure changes with it. */
      'hero.title':         'מידה מדויקת.\n          <span class="block mt-2 text-pear-600">בלי חדר מדידה.</span>',
      /* Was three clauses ending on the mechanism. Now two, ending on
         the number the buyer is actually here for. */
      'hero.sub':           'הלקוח רואה את הבגד על עצמו ומקבל מידה מדויקת, בזמן אמת. אתם מקבלים יותר המרות ופחות החזרות.',
      'hero.ctaPrimary':    'נסו את הוויג\'ט · 30 שניות',
      /* hero.ctaSecondary ("▶ צפו ב-17 שניות") and hero.scrollHint
         ("גללו כדי להריץ את הסרטון") were removed with the scroll-
         scrubbing hero: one played a clip that scroll was holding
         still, the other told the visitor to scroll to play it. The
         clip plays itself now, so both statements were false. */
      'hero.proof1':        '<span class="font-bold text-slate-700">100% ביטחון בהתאמה</span> ברגע התשלום',
      'hero.proof2':        '<span class="font-bold text-slate-700">אפס Bracketing</span>, סוף להזמנת שלוש מידות',
      'hero.proof3':        '<span class="font-bold text-slate-700">עד כ-25% פחות החזרות</span> ופחות עלויות תפעול',

      /* - live widget playground -
         The old title claimed the widget was "real" and "right here",
         which is two ways of saying the same thing. The new one answers
         the objection a visitor actually arrives with - that this is a
         canned demo - and the sub stops instructing (the button below it
         already says what to do) and just states what they are seeing. */
      'play.eyebrow':      'Live Widget · בלי הרשמה',
      'play.title':        'זה הוויג\'ט. לא הדגמה.',
      'play.sub':          'בדיוק מה שהלקוח רואה בדף מוצר.',
      'play.productAlt':   'הוידג\'ט PEAR AI Virtual Try-On בדף מוצר אופנה, חולצת הלוגו של PEAR, גזרה רפויה/אוברסייז, מידות S-XXL',
      'play.modelAlt':     'חולצת PEAR האוברסייז לבושה על דוגמן/ית',
      'play.modelPreview': 'תצוגה על דוגמן/ית',
      'play.productBackAlt': 'חולצת הלוגו של PEAR, מבט מהגב',
      'play.angleFront':   'חזית',
      'play.angleBack':    'גב',
      'play.productName':  'חולצת הלוגו של <span class="brand-pear">PEAR</span> · Virtual Try-On',
      'play.productMeta':  'בז\' · מידות S-XXL',
      'play.fitTag':       'גזרה רפויה / אוברסייז',
      'play.fitGuidance':  'סילואט אוברסייז: רדו מידה אחת להתאמה סטנדרטית, או בחרו את המידה הרגילה למראה בוקסי מכוון.',
      'play.physicsNote':  'ארבע תוכניות, כולן ניתנות לעריכה: אתם קובעים כמה מדידות מקבל כל משתמש.',
      /* Was a description of the offer ("a quick one-time measurement").
         A button should name the action: play.ctaNote directly beneath
         it already carries the "no signup, once per visit" terms. */
      'play.cta':          'מדדו עכשיו',
      'play.ctaNote':      'בלי הרשמה. שימוש אחד בכל ביקור.',
      'play.ctaUsed':      '✓ המדידה נוצלה לביקור הזה',
      'play.ctaUsedTitle': 'כבר בוצעה מדידה חד-פעמית בביקור הזה',
      'play.ctaLoading':   'טוען…',
      'play.loadError':    'לא הצלחנו לטעון את הוויג׳ט. נסו שוב בעוד רגע.',

      /* demo.eyebrow/title/sub belonged to the onyx band. The clip they
         introduced is the hero's now, under the hero's own headline. */

      /* - business impact · the three pillars -
         *Metric are the labels under the counting numerals. Each one
         names the figure its card animates, and each figure is one the
         page already states: 100% from hero.proof1, 3→0 from proof2,
         ~25% from proof3 and value.card3Body. */
      /* Title and sub used to say the same thing twice - "pillars of
         profitability" over "what changes in the bottom line". The title
         now makes the claim and the sub previews the three cards under
         it, so the pair does two jobs instead of one. "עמודי תווך" also
         went: it is consultancy language, not a promise. */
      'value.eyebrow':       'השפעה עסקית',
      'value.title':         'שלוש דרכים שמידה מדויקת מחזירה כסף',
      'value.sub':           'המרה, מלאי ותפעול - מה משתנה בכל אחד מהם.',
      'value.card1Tag':      'המרה',
      'value.card1Title':    'הגדלת המרות',
      'value.card1Metric':   'ביטחון בהתאמה',
      'value.card1Body':     'ביטחון מלא בהתאמה עוד לפני התשלום.',
      'value.card1Bullet1':  'פחות עגלות נטושות',
      'value.card1Bullet2':  'בלי ניחושים בטבלת מידות',
      'value.card2Tag':      'מלאי',
      'value.card2Title':    'הגנה על המלאי',
      'value.card2Metric':   'מידות מיותרות בעגלה',
      'value.card2Body':     'סוף להזמנת שלוש מידות של אותו פריט למדידה בבית.',
      'value.card2Bullet1':  'הדגמים החמים נשארים למכירה',
      'value.card2Bullet2':  'נתוני ביקוש נקיים יותר',
      'value.card3Tag':      'תפעול',
      'value.card3Title':    'יעילות תפעולית',
      'value.card3Metric':   'פחות החזרות',
      'value.card3Body':     'צמצום שיעור ההחזרות בעד כ-25%.',
      'value.card3Bullet1':  'פחות סחורה נכנסת למיון',
      'value.card3Bullet2':  'מחזור מזומנים קצר יותר',

      /* - final CTA -
         The closing headline was a yes/no question, which invites "not
         today". It states the action instead, and keeps the returns
         number that is the whole reason to take it. */
      'cta.title':     'התחילו להוריד החזרות כבר השבוע',
      'cta.sub':       'חמש דקות מהקוד ועד המדידה הראשונה.',
      /* cta.primary ("נסו את הוויג'ט") was REMOVED with the button it
         labelled: it scrolled back up to #playground, which the visitor
         has already passed by the time they reach the closing section. */
      'cta.docs':      'למדריך ההטמעה ←',
      'cta.contact':   'דברו איתנו',
      'cta.platforms': 'Shopify · WooCommerce · Magento · פיתוח מותאם',

      /* - docs view + access gate - */
      'docs.title':             'מדריך הטמעת הוויג\'ט',
      /* Was two sentences making the same promise twice - "under five
         minutes, no architecture changes" and then "three steps". One
         sentence, both facts, no repetition. */
      'docs.sub':               'הטמעה של <span class="font-semibold text-slate-700">פחות מ-5 דקות</span>, בשלושה שלבים, בלי שינוי בארכיטקטורת האתר.',
      'docs.gateTitle':         'המדריך נעול לקהל הרחב',
      'docs.gateSub':           'גישה למדריך ההטמעה הטכני ניתנת באישור ידני של צוות הפיתוח.',
      'docs.gatePlaceholder':   'קוד גישה',
      'docs.gateSubmit':        'אימות',
      'docs.gateChecking':      'בודק…',
      'docs.gateRequest':       'אין לכם קוד גישה? מלאו את הטופס למטה ונשלח לכם מיידית ←',
      'docs.errWrong':          'קוד שגוי, נסו שוב.',
      'docs.errNoRuntime':      'סביבת פיתוח: אין ריצת שרת. הריצו vercel dev במקום Live Server.',
      'docs.errNoPasscode':     'תקלת הגדרה בשרת: DOCS_PASSCODE אינו מוגדר.',
      'docs.errRateLimit':      'יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.',

      /* - contact - */
      'contact.title':          'בואו נדבר',
      'contact.sub':            'שאלה על הטמעה או דמו למותג שלכם - מלאו את הטופס או פנו אלינו ישירות.',
      'contact.fieldName':      'שם מלא',
      'contact.phName':         'ישראל ישראלי',
      'contact.fieldEmail':     'אימייל',
      'contact.phEmail':        'you@brand.com',
      'contact.fieldPhone':     'טלפון',
      'contact.phPhone':        '050-1234567',
      'contact.fieldCompany':   'שם החברה',
      'contact.phCompany':      'שם המותג / החברה',
      'contact.fieldRole':      'תפקיד',
      'contact.phRole':         'למשל: מנהל/ת דיגיטל',
      'contact.fieldSubject':   'נושא',
      'contact.phSubject':      'למשל: בקשת דמו למותג אופנה',
      'contact.fieldMessage':   'הודעה',
      'contact.phMessage':      'ספרו לנו קצת על הפרויקט...',
      'contact.submit':         'שליחת הודעה',
      'contact.sending':        'שולח…',
      'contact.sent':           'נשלח בהצלחה ✓',
      'contact.toastSuccess':   'הודעתך נשלחה בהצלחה! נחזור אליכם בהקדם',
      'contact.toastError':     'השליחה נכשלה, נסו שוב או כתבו לנו ישירות למייל',
      'contact.defaultSubject': 'פנייה חדשה מאתר PEAR',
      'contact.directTitle':    'פנייה ישירה',
      'contact.directSub':      'מעדיפים לדבר ישירות? אנחנו זמינים באימייל.',
      'contact.teamNote':       'צוות <span class="brand-pear">PEAR</span> זמין לשאלות טכניות, הדגמות למותגים ותמיכה בהטמעה.',

      /* - footer - */
      'footer.rights': '© 2026 <span class="brand-pear">PEAR</span> Platform (pearvton), Virtual Try-On · כל הזכויות שמורות',

      /* - toasts - */
      'toast.copied':     'הקוד הועתק ללוח ✓',
      'toast.copyFailed': 'ההעתקה נכשלה, העתיקו ידנית',

      /* - contact-form prefills (set by tagged CTAs) - */
      'prefill.integration.subject': 'עזרה בהטמעת PEAR באתר',
      'prefill.integration.message': 'היי, אני מנסה להטמיע את PEAR באתר שלי ואשמח לקבל עזרה קלה מהצוות הטכני שלכם.',
      'prefill.docsAccess.subject':  'בקשת גישה למדריך ההטמעה',
      'prefill.docsAccess.message':  'בקשת גישה למדריך ההטמעה\n\nהיי, אשמח לקבל קוד גישה למדריך ההטמעה הטכני של PEAR.\n\n(לאישור: השיבו לכתובת המייל הזו עם קוד הגישה)',
      'prefill.docsAccess.type':     'בקשת גישה למדריך ההטמעה',

      /* - the gated implementation guide (markup lives in api/get-docs.js) - */
      'guide.reqTitle':    'הקדמה ודרישות מערכת',
      'guide.reqBody':     'הוויג\'ט הוא סקריפט JavaScript קל-משקל שנטען אסינכרונית ואינו משפיע על מהירות האתר.\n        אין תלות בפלטפורמה, הוא עובד עם כל פלטפורמות האיקומרס:',
      'guide.reqCustom':   'Custom / פיתוח מותאם',
      'guide.stepsTitle':  'שלבי ההטמעה',
      'guide.step1Title':  'שלב 1 · הוספת סקריפט המערכת (CDN)',
      'guide.step1Body':   'הדביקו את השורה הבאה לפני תג <code dir="ltr">&lt;/body&gt;</code>, פעם אחת בכל עמודי המוצר.',
      'guide.step2Title':  'שלב 2 · מיקום כפתור המדידה בדף המוצר',
      'guide.step2Body':   'הניחו את הקונטיינר בכל מקום בעמוד המוצר, לרוב מתחת לבורר המידות. הוויג\'ט יעצב את עצמו בהתאם למקום.',
      'guide.step3Title':  'שלב 3 · אתחול והגדרות מותאמות אישית',
      'guide.step3Body':   'שליטה מלאה על שפה, ערכת נושא, טקסט הכפתור ו-callbacks, הכל מאובייקט קונפיגורציה אחד.',
      'guide.snipLocale':  '\'he\'',
      'guide.snipButton':  '\'מדוד עכשיו עם AI\'',
      'guide.snipComment': '// נקרא כשהאלגוריתם מסיים לחשב מידה מומלצת',
      'guide.snipLog':     '\'המידה המומלצת:\'',
      'guide.helpTitle':   'צריכים עזרה טכנית בהטמעה?',
      'guide.helpBody':    'צוות הפיתוח של <span class="brand-pear">PEAR</span> זמין לעזור לכם לחבר את הווידג\'ט לחנות שלכם במהירות ובקלות.',
      'guide.helpCta':     'דברו איתנו עכשיו',
      'guide.helpArrow':   '←',
      'guide.note':        'אין לכם עדיין <code dir="ltr">STORE_ID</code>?\n        <a href="mailto:pearytrank@gmail.com">צרו קשר</a>\n        ונקים לכם חשבון תוך יום עסקים.'
    },

    /* ──────────────────────────── ENGLISH ─────────────────────────── */
    en: {
      /* - head / SEO - */
      /* These must stay byte-identical to the literals in index.html's
         <head>: the static tag is what a crawler reads pre-JS, this is
         what it reads post-JS, and the two disagreeing is a needless
         mixed signal. Change one, change both. */
      'meta.title':              'PEAR Platform | Real-Time AI Virtual Try-On & Fit Technology (PearVTON)',
      'meta.description':        'PEAR (PearVTON) delivers real-time AI Virtual Try-On and virtual measurement for fashion e-commerce. Give shoppers 100% fit confidence, boost conversion rates, eliminate bracketing, and drastically reduce return rates.',
      'meta.keywords':           'pear, pear platform, pear ai, pear vton, pearvton, pear virtual try on, pear fitting room, pear ai fashion, AI virtual try on, AI virtual fitting room, real-time virtual try-on, online fitting room for e-commerce, virtual outfit preview, AI garment fitting, virtual fitting room, fashion e-commerce widget, Shopify virtual try-on integration, WooCommerce virtual try-on integration, Magento AI fitting room integration, e-commerce VTON integration, reduce return rates, eliminate bracketing, virtual sizing',
      'meta.ogTitle':            'PEAR Platform | Real-Time AI Virtual Try-On for Fashion E-Commerce',
      'meta.ogDescription':      'Transform your fashion store with PEAR AI Virtual Try-On. Allow shoppers to measure and try on clothes virtually, boosting conversions and slashing return rates.',
      'meta.twitterTitle':       'PEAR Platform | Real-Time AI Virtual Try-On (PearVTON)',
      'meta.twitterDescription': 'AI-powered virtual fitting room widget for online clothing brands. Reduce returns and eliminate sizing doubt.',
      'meta.jsonldDescription':  'PEAR Platform (PearVTON) provides real-time AI Virtual Try-On and measurement technology for fashion e-commerce retailers to increase conversion rates and cut return costs.',
      'meta.orgDescription':     'PEAR builds real-time AI Virtual Try-On and virtual measurement technology for fashion e-commerce.',
      'meta.imageAlt':           'PEAR AI Virtual Try-On Widget',

      /* - accessibility labels - */
      'a11y.mainNav':       'Main navigation',
      'a11y.langSwitch':    'Choose language',
      'a11y.viewOverview':  'About the product and the solution',
      'a11y.viewDocs':      'Widget integration guide',
      'a11y.viewContact':   'Contact us',
      /* heroVideo/vtonPause/vtonPlay labelled the hero phone's silent
         loop and its play toggle; vtonMute/vtonUnmute/vtonVolume
         labelled the mute button and volume slider that later sat on
         the cinematic player. All six are gone with the controls they
         named - the hero film is silent and has no controls at all.
         demoVideo is the one survivor: it labels the <video> itself. */
      'a11y.demoVideo':     'PEAR AI Virtual Try-On Widget, full demo video',
      'a11y.directMeasure': 'One-time virtual try-on, no signup step, once per visit',
      'a11y.fittingRoom':   'PEAR, one-time virtual try-on',
      'a11y.closeModal':    'Close',
      'a11y.modelPreviewToggle': 'Show on-model preview',
      'a11y.angleToggleGroup':   'Front / Back view',

      /* - navbar - */
      'nav.about':   'About',
      'nav.docs':    'Integration guide',
      'nav.contact': 'Talk to us',

      /* - scroll HUD chapters -
         hud.demo went with the onyx demo band; the clip it labelled is
         the hero's now and hud.intro covers it. */
      'hud.intro':      'Intro',
      'hud.playground': 'Try it yourself',
      'hud.value':      'Business impact',
      'hud.cta':        'Wrap-up',

      /* - hero -
         The old sub ran 31 words through four gerunds before reaching a
         benefit. This is the same promise in two sentences, and every
         figure on the page is unchanged. */
      /* The LTR product-name kicker that opened this headline - worded
         differently here than in the Hebrew - was REMOVED to match, so
         the span does not come back on a language switch and reopen the
         gap the removal was meant to close. Wording not quoted, for the
         reason given in the Hebrew dictionary above. */
      /* Kept, for the reasons given against the Hebrew hero.title. */
      'hero.title':         'The right size.\n          <span class="block mt-2 text-pear-600">No fitting room.</span>',
      /* Was three sentences and 22 words. Two now, closing on the
         business outcome rather than on how the product works. */
      'hero.sub':           'Your shopper sees the garment on themselves and gets their exact size, in real time. You get more conversions and fewer returns.',
      'hero.ctaPrimary':    'Try the widget · 30 seconds',
      /* hero.ctaSecondary and hero.scrollHint removed - see the Hebrew
         dictionary above for why. */
      'hero.proof1':        '<span class="font-bold text-slate-700">100% fit confidence</span> at checkout',
      'hero.proof2':        '<span class="font-bold text-slate-700">Zero bracketing</span>, no more 3-size orders',
      'hero.proof3':        '<span class="font-bold text-slate-700">~25% fewer returns</span> and lower OPEX',

      /* - live widget playground -
         Same reasoning as the Hebrew: the title answers the "is this a
         canned demo?" objection instead of asserting realness twice, and
         the sub stops instructing, since the button already does. */
      'play.eyebrow':      'Live Widget · No Signup Required',
      'play.title':        'This is the widget. Not a demo.',
      'play.sub':          'Exactly what customers see on the product page.',
      'play.productAlt':   'PEAR AI Virtual Try-On Widget on a fashion product page, PEAR Signature Logo Tee, cream, relaxed/oversized fit, sizes S-XXL',
      'play.modelAlt':     'The PEAR oversized tee worn on a model',
      'play.modelPreview': 'On Model Preview',
      'play.productBackAlt': 'PEAR Signature Logo Tee, back view',
      'play.angleFront':   'Front',
      'play.angleBack':    'Back',
      'play.productName':  '<span class="brand-pear">PEAR</span> Signature Logo Tee · Virtual Try-On',
      'play.productMeta':  'Beige · sizes S-XXL',
      'play.fitTag':       'Relaxed / Oversized Fit',
      'play.fitGuidance':  'Oversized silhouette: size down for a standard fit, or select true size for an intentional boxy look.',
      'play.physicsNote':  'Four fully customizable plans: you set how many try-ons each user gets.',
      /* Names the action; play.ctaNote under it carries the terms. */
      'play.cta':          'Measure now',
      'play.ctaNote':      'No signup. One use per visit.',
      'play.ctaUsed':      '✓ Fitting already used this visit',
      'play.ctaUsedTitle': 'You have already used your one-time fitting on this visit',
      'play.ctaLoading':   'Loading…',
      'play.loadError':    'We could not load the widget. Please try again in a moment.',

      /* demo.eyebrow/title/sub belonged to the onyx band. The clip they
         introduced is the hero's now, under the hero's own headline. */

      /* - business impact · the three pillars -
         Card bodies own their pillar outright; nothing here restates the
         hero metrics or the problem section. Bullets carry a second-order
         consequence, never a paraphrase of the body above them.

         *Metric are the labels under the counting numerals. Each one
         names the figure its card animates, and each figure is one the
         page already states: 100% from hero.proof1, 3→0 from proof2,
         ~25% from proof3 and value.card3Body. */
      /* Title makes the claim, sub previews the three cards - the old
         pair said the same thing twice, in consultancy language. */
      'value.eyebrow':       'Business impact',
      'value.title':         'Three ways the right size pays you back',
      'value.sub':           'Conversion, inventory, operations - what changes in each.',
      'value.card1Tag':      'Conversion',
      'value.card1Title':    'Conversion Boost',
      'value.card1Metric':   'fit confidence',
      'value.card1Body':     'Full fit confidence before they reach checkout.',
      'value.card1Bullet1':  'Fewer abandoned carts',
      'value.card1Bullet2':  'No size-chart guesswork',
      'value.card2Tag':      'Inventory',
      'value.card2Title':    'Inventory Protection',
      'value.card2Metric':   'spare sizes in the cart',
      'value.card2Body':     'No more 3-size orders bought purely to try at home.',
      'value.card2Bullet1':  'Best-sellers stay sellable',
      'value.card2Bullet2':  'Cleaner demand signals',
      'value.card3Tag':      'Operations',
      'value.card3Title':    'Operational Efficiency',
      'value.card3Metric':   'fewer returns',
      'value.card3Body':     'Cut return rates by up to ~25%.',
      'value.card3Bullet1':  'Less inbound to sort and restock',
      'value.card3Bullet2':  'Shorter cash-conversion cycle',

      /* - final CTA -
         A yes/no question invites "not today"; this states the action
         and keeps the number that justifies taking it. */
      'cta.title':     'Start cutting returns this week',
      'cta.sub':       'Five minutes from paste to first try-on.',
      /* cta.primary removed - see the Hebrew dictionary above. */
      'cta.docs':      'To the integration guide →',
      'cta.contact':   'Talk to us',
      'cta.platforms': 'Shopify · WooCommerce · Magento · custom builds',

      /* - docs view + access gate - */
      'docs.title':             'Widget integration guide',
      'docs.sub':               'Install in <span class="font-semibold text-slate-700">under 5 minutes</span>, in three steps, with no changes to your site architecture.',
      'docs.gateTitle':         'This guide is not public',
      'docs.gateSub':           'Access to the technical integration guide is granted manually by the development team.',
      'docs.gatePlaceholder':   'Access code',
      'docs.gateSubmit':        'Verify',
      'docs.gateChecking':      'Checking…',
      'docs.gateRequest':       'No access code? Fill in the form below and we will send you one right away →',
      'docs.errWrong':          'Wrong code. Please try again.',
      'docs.errNoRuntime':      'Dev environment: no server runtime. Run vercel dev instead of Live Server.',
      'docs.errNoPasscode':     'Server misconfiguration: DOCS_PASSCODE is not set.',
      'docs.errRateLimit':      'Too many attempts. Try again in 15 minutes.',

      /* - contact - */
      'contact.title':          'Let\'s talk',
      'contact.sub':            'A question about integration, or a demo for your brand - fill in the form or reach us directly.',
      'contact.fieldName':      'Full name',
      'contact.phName':         'Jane Doe',
      'contact.fieldEmail':     'Email',
      'contact.phEmail':        'you@brand.com',
      'contact.fieldPhone':     'Phone',
      'contact.phPhone':        '+1 555 123 4567',
      'contact.fieldCompany':   'Company name',
      'contact.phCompany':      'Brand / company name',
      'contact.fieldRole':      'Role',
      'contact.phRole':         'e.g. Head of Digital',
      'contact.fieldSubject':   'Subject',
      'contact.phSubject':      'e.g. Demo request for a fashion brand',
      'contact.fieldMessage':   'Message',
      'contact.phMessage':      'Tell us a little about the project...',
      'contact.submit':         'Send message',
      'contact.sending':        'Sending…',
      'contact.sent':           'Sent ✓',
      'contact.toastSuccess':   'Your message is on its way! We will get back to you shortly',
      'contact.toastError':     'Sending failed. Try again or email us directly',
      'contact.defaultSubject': 'New enquiry from the PEAR site',
      'contact.directTitle':    'Reach us directly',
      'contact.directSub':      'Prefer to talk directly? We are available by email.',
      'contact.teamNote':       'The <span class="brand-pear">PEAR</span> team is here for technical questions, brand demos and integration support.',

      /* - footer - */
      'footer.rights': '© 2026 <span class="brand-pear">PEAR</span> Platform (pearvton), Virtual Try-On · All rights reserved',

      /* - toasts - */
      'toast.copied':     'Code copied to clipboard ✓',
      'toast.copyFailed': 'Copy failed. Please copy manually',

      /* - contact-form prefills (set by tagged CTAs) - */
      'prefill.integration.subject': 'Help integrating PEAR on our site',
      'prefill.integration.message': 'Hi, I am trying to integrate PEAR on my site and would appreciate a hand from your technical team.',
      'prefill.docsAccess.subject':  'Access request for the integration guide',
      'prefill.docsAccess.message':  'Access request for the integration guide\n\nHi, I would like an access code for the PEAR technical integration guide.\n\n(To approve: reply to this email address with the access code)',
      'prefill.docsAccess.type':     'Integration guide access request',

      /* - the gated implementation guide (markup lives in api/get-docs.js) - */
      'guide.reqTitle':    'Overview and requirements',
      'guide.reqBody':     'The widget is a lightweight JavaScript snippet that loads asynchronously and does not affect your site speed.\n        It is platform-agnostic. It works with every e-commerce platform:',
      'guide.reqCustom':   'Custom / in-house build',
      'guide.stepsTitle':  'Integration steps',
      'guide.step1Title':  'Step 1 · Add the SDK script (CDN)',
      'guide.step1Body':   'Paste the line below just before the <code dir="ltr">&lt;/body&gt;</code> tag, once, on every product page.',
      'guide.step2Title':  'Step 2 · Place the try-on button on the product page',
      'guide.step2Body':   'Drop the container anywhere on the product page, usually under the size picker. The widget styles itself to fit its surroundings.',
      'guide.step3Title':  'Step 3 · Initialise and customise',
      'guide.step3Body':   'Full control over language, theme, button copy and callbacks, all from a single configuration object.',
      'guide.snipLocale':  '\'en\'',
      'guide.snipButton':  '\'Try it on with AI\'',
      'guide.snipComment': '// Called once the algorithm has computed a recommended size',
      'guide.snipLog':     '\'Recommended size:\'',
      'guide.helpTitle':   'Need a hand with the integration?',
      'guide.helpBody':    'The <span class="brand-pear">PEAR</span> engineering team is available to help you wire the widget into your store quickly and painlessly.',
      'guide.helpCta':     'Talk to us now',
      'guide.helpArrow':   '→',
      'guide.note':        'Do not have a <code dir="ltr">STORE_ID</code> yet?\n        <a href="mailto:pearytrank@gmail.com">Get in touch</a>\n        and we will set an account up within one business day.'
    }
  };

  /* ════════════════════════════════════════════════════════════════
     ENGINE
     ════════════════════════════════════════════════════════════════ */

  var state = {
    lang: DEFAULT_LANG,
    resolved: false     // false while an async geo-IP lookup is still in flight
  };
  var listeners = [];

  /* localStorage throws in Safari private mode and when cookies are
     blocked entirely - never let a storage failure break the page. */
  function readStore(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* non-fatal */ }
  }

  function isSupported(lang) {
    return SUPPORTED.indexOf(lang) !== -1;
  }
  function normalise(lang) {
    lang = String(lang || '').toLowerCase().slice(0, 2);
    return isSupported(lang) ? lang : null;
  }
  function dirFor(lang) {
    return RTL_LANGS.indexOf(lang) !== -1 ? 'rtl' : 'ltr';
  }

  /* ── Translation lookup ──────────────────────────────────────────
     Missing keys fall back to the other language rather than rendering
     an empty element, and finally to the key itself so a typo is loud
     in the UI instead of silently blanking a headline. */
  function t(key, lang) {
    lang = lang || state.lang;
    var table = DICT[lang] || {};
    if (Object.prototype.hasOwnProperty.call(table, key)) return table[key];
    var fallback = DICT[DEFAULT_LANG] || {};
    if (Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
    return key;
  }

  /* ── Language sources ────────────────────────────────────────── */

  function fromUrl() {
    var match = /[?&]lang=([^&#]+)/i.exec(window.location.search);
    return match ? normalise(decodeURIComponent(match[1])) : null;
  }

  /* Only ever consulted together with isExplicitChoice() - a stored
     value with no explicit-click flag next to it is not trusted, see
     the boot section below. */
  function fromStorage() {
    return normalise(readStore(LANG_KEY));
  }

  /* True only when LANG_KEY was written by an actual toggle click (see
     setLanguage's opts.persist branch). This is the ONLY thing that ever
     skips a fresh geo-IP lookup on boot. */
  function isExplicitChoice() {
    return readStore(LANG_EXPLICIT_KEY) === '1';
  }

  /* One provider, one attempt, given a fixed GEO_TIMEOUT_MS to answer in.
     Resolves to an UPPERCASE country code; rejects on anything that
     isn't a usable answer - bad HTTP status, timeout/abort, network/CORS
     failure, or a body extract() can't read - so the caller can move on
     to the next provider. */
  function fetchCountryCode(source, timeoutMs) {
    if (typeof window.fetch !== 'function') {
      return Promise.reject(new Error('fetch unavailable'));
    }

    var controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
    var timer = window.setTimeout(function () {
      if (controller) controller.abort();
    }, timeoutMs);

    var opts = { headers: { Accept: 'application/json' }, cache: 'no-store' };
    if (controller) opts.signal = controller.signal;

    function settle(fn) {
      return function (arg) { window.clearTimeout(timer); return fn(arg); };
    }

    return window.fetch(source.url, opts)
      .then(settle(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }), settle(function (err) { throw err; }))
      .then(function (data) {
        var cc = String(source.extract(data) || '').toUpperCase();
        if (!cc) throw new Error('no country code in response');
        return cc;
      });
  }

  /* Country lookup. Tries GEO_SOURCES in order, each getting its own
     fixed GEO_TIMEOUT_MS, and resolves to a language from the first one
     that answers with a usable country code - falling through to the
     next source immediately on any failure. Rejects once every source
     has failed, which is the caller's (see boot, below) signal to fall
     back to DEFAULT_LANG.

     STRICT DEFAULTING: whichever source answers, only an exact 'IL' match
     resolves to Hebrew - every other code (US, DE, an unrecognised one,
     anything) resolves to English. There is no path from a successful IP
     lookup to a browser-locale guess: a VPN visitor whose browser locale
     happens to be Hebrew still gets English the moment any provider
     confirms a non-IL exit location. */
  function fromIpLookup() {
    function tryAt(i) {
      if (i >= GEO_SOURCES.length) {
        return Promise.reject(new Error('all geolocation sources failed'));
      }
      var source = GEO_SOURCES[i];
      return fetchCountryCode(source, GEO_TIMEOUT_MS)
        .then(function (cc) {
          var lang = cc === GEO_COUNTRY ? GEO_LANG : DEFAULT_LANG;
          // eslint-disable-next-line no-console
          console.log('Detected Country:', cc, '(via ' + source.label + ') → lang:', lang);
          return { lang: lang, country: cc };
        })
        .catch(function (err) {
          // eslint-disable-next-line no-console
          console.warn('[PearI18n] ' + source.label + ' geo lookup failed:', err && err.message ? err.message : err);
          return tryAt(i + 1);
        });
    }
    return tryAt(0);
  }

  /* ── DOM helpers ─────────────────────────────────────────────── */

  function whenDomReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  /* querySelectorAll misses the root node itself - which matters when
     apply() is handed a freshly injected subtree whose outermost element
     carries the attribute. */
  function collect(root, attr) {
    var out = [];
    if (root.nodeType === 1 && root.hasAttribute(attr)) out.push(root);
    var found = root.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < found.length; i++) out.push(found[i]);
    return out;
  }

  function setMeta(selector, value) {
    var el = document.head && document.head.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }

  /* ── Applying a language ─────────────────────────────────────── */

  /* <head>: everything a crawler reads before it looks at the body. */
  function applyHead(lang, explicit) {
    var root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dirFor(lang));

    document.title = t('meta.title', lang);
    setMeta('meta[name="title"]',                 t('meta.title', lang));
    setMeta('meta[name="description"]',           t('meta.description', lang));
    setMeta('meta[name="keywords"]',              t('meta.keywords', lang));
    setMeta('meta[property="og:title"]',          t('meta.ogTitle', lang));
    setMeta('meta[property="og:description"]',    t('meta.ogDescription', lang));
    setMeta('meta[property="og:locale"]',         OG_LOCALE[lang] || OG_LOCALE[DEFAULT_LANG]);
    setMeta('meta[property="og:image:alt"]',      t('meta.imageAlt', lang));
    setMeta('meta[name="twitter:title"]',         t('meta.twitterTitle', lang));
    setMeta('meta[name="twitter:description"]',   t('meta.twitterDescription', lang));
    setMeta('meta[name="twitter:image:alt"]',     t('meta.imageAlt', lang));

    /* og:locale:alternate is the mirror of whichever locale is active - it
       must never repeat og:locale, or the pair stops describing a
       translated document at all. */
    setMeta('meta[property="og:locale:alternate"]', OG_LOCALE[lang === 'he' ? 'en' : 'he']);

    /* og:url and canonical must agree with the hreflang alternates:
       a language-specific URL is self-canonical, the bare root is the
       x-default. Pointing ?lang=en back at / would make Google drop the
       alternate set entirely. */
    var langUrl = SITE_ORIGIN + '/?lang=' + lang;
    /* Callers that are about to WRITE ?lang= into the address bar say so,
       because reading it back here would still see the old URL and leave
       canonical pointing at the x-default root while the visitor sits on
       a language-specific URL. */
    if (explicit === undefined) explicit = fromUrl() !== null;
    var canonicalHref = explicit ? langUrl : SITE_ORIGIN + '/';
    var canonical = document.head && document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalHref);
    setMeta('meta[property="og:url"]',  canonicalHref);
    setMeta('meta[name="twitter:url"]', canonicalHref);

    /* Structured data: keep the descriptions in the page's language and
       declare which language that is. The block is an @graph, so the nodes
       are walked by @type - assigning to the parsed root instead would
       write two properties that belong to no node at all, localising
       nothing. The [data] fallback keeps this working if the graph is ever
       collapsed back to a single node. */
    var ld = document.getElementById('ld-webapp');
    if (ld) {
      try {
        var data  = JSON.parse(ld.textContent);
        var nodes = data['@graph'] || [data];
        for (var n = 0; n < nodes.length; n++) {
          var type = nodes[n]['@type'];
          if (type === 'SoftwareApplication' || type === 'WebApplication') {
            nodes[n].description = t('meta.jsonldDescription', lang);
            nodes[n].inLanguage  = lang;
          } else if (type === 'Organization') {
            nodes[n].description = t('meta.orgDescription', lang);
          } else if (type === 'WebSite') {
            nodes[n].inLanguage  = lang;
          }
        }
        ld.textContent = JSON.stringify(data, null, 2);
      } catch (e) { /* malformed JSON-LD is not worth breaking boot over */ }
    }
  }

  /* <body>: every element carrying a data-i18n* attribute.
     `root` defaults to the whole document but can be a subtree - that is
     how the passcode-gated guide gets translated after it is injected. */
  function applyDOM(root, lang) {
    root = root || document.body;
    lang = lang || state.lang;
    if (!root) return;

    /* Rewriting text/innerHTML throws away whatever the page has built on
       top of it - most visibly the GSAP word-splitter's per-word spans,
       and the ScrollTrigger instances pointing at them. Each element
       therefore records the language it currently carries, and a pass
       that would rewrite it in that same language is skipped.

       This is what makes the DOM-ready sweep at the bottom of this file
       safe: it re-visits elements the in-body bootstrap already
       translated, and must leave them exactly as it found them. A
       genuine language change stamps a different value, so everything is
       rewritten and listeners re-split the fresh copy as before. */
    collect(root, 'data-i18n').forEach(function (el) {
      if (el.getAttribute(STAMP) === lang) return;
      el.textContent = t(el.getAttribute('data-i18n'), lang);
      el.setAttribute(STAMP, lang);
    });

    /* innerHTML, by design - see the security note at the top of the file. */
    collect(root, 'data-i18n-html').forEach(function (el) {
      if (el.getAttribute(STAMP) === lang) return;
      el.innerHTML = t(el.getAttribute('data-i18n-html'), lang);
      el.setAttribute(STAMP, lang);
    });

    [['data-i18n-placeholder', 'placeholder'],
     ['data-i18n-aria-label',  'aria-label'],
     ['data-i18n-title',       'title'],
     ['data-i18n-alt',         'alt'],
     ['data-i18n-value',       'value']].forEach(function (pair) {
      collect(root, pair[0]).forEach(function (el) {
        el.setAttribute(pair[1], t(el.getAttribute(pair[0]), lang));
      });
    });

    /* Language switch: reflect the active option for both sighted users
       (CSS on [aria-pressed]) and screen readers. */
    collect(root, 'data-set-lang').forEach(function (el) {
      el.setAttribute('aria-pressed', el.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
  }

  function notify(lang) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](lang); } catch (e) { /* one bad listener must not stop the rest */ }
    }
  }

  /* ── Boot ────────────────────────────────────────────────────── */

  /* Makes <head> AND <body> actually reflect `lang`, right now - this is
     the one place that turns a resolved language into a rendered page.

     WHY BOTH AN IMMEDIATE PASS AND A DEFERRED ONE: the old version chose
     ONE of "apply now" or "apply once at DOMContentLoaded" based on
     `document.readyState` at the instant this ran, decided by the
     CALLER via an opt-in `deferDom` flag. That left a real gap for the
     async IP lookup specifically: a fast answer (an already-warm
     connection, a cached response, ipapi.co replying in a handful of
     milliseconds) can resolve its promise while the document is still
     mid-parse - `document.body` already exists (the parser is somewhere
     inside it) but `readyState` is still 'loading'. The either/or logic
     had no case that both applies to what already exists in the DOM
     *and* guarantees a follow-up for what the parser hasn't reached yet;
     depending on exactly which branch fired, a result could apply to a
     body that didn't fully exist yet with nothing left to re-run it.

     The fix is to stop choosing: apply immediately whenever there is a
     body to apply to, AND separately, unconditionally, schedule a
     follow-up whenever the document is still loading. Both is always
     safe - applyDOM's per-element language stamp (see STAMP above) makes
     a repeat call with the same lang a costless no-op, so running commit
     twice never double-translates or re-shreds an already-split
     headline. This is what actually closes the race the old code had,
     not just papers over one branch of it. */
  function applyLanguage(lang, opts) {
    opts = opts || {};
    var changed = lang !== state.lang;
    state.lang = lang;

    applyHead(lang, opts.explicitUrl);
    /* Belt-and-suspenders alongside the setAttribute('dir', …) inside
       applyHead: the IDL property and the content attribute reflect each
       other, so this is a no-op in every real browser - but it means
       anything reading `documentElement.dir` directly (rather than via
       getAttribute) is served just as immediately as the CSS is. */
    document.documentElement.dir = dirFor(lang);

    /* Order is load-bearing: listeners must not fire until the DOM
       actually carries the new copy. index.html's listener re-splits the
       headlines into per-word spans, and re-splitting text that has not
       been replaced yet would shred the OLD language and then have it
       overwritten a moment later. */
    function commit() {
      // eslint-disable-next-line no-console
      console.log('Applying language:', lang);
      applyDOM(document.body, lang);
      if (changed || opts.force) notify(lang);
    }

    if (document.body) commit();
    if (document.readyState === 'loading') whenDomReady(commit);

    return lang;
  }

  /* The persisted/manual-switch entry point: applyLanguage() plus the
     bookkeeping that only a deliberate visitor choice needs - writing
     localStorage and keeping the address bar in step with it. The
     explicit flag is what makes this choice survive future reloads
     without being re-checked against (and possibly overwritten by)
     geo-IP - see isExplicitChoice() and the boot section below. */
  function setLanguage(lang, opts) {
    opts = opts || {};
    lang = normalise(lang) || DEFAULT_LANG;

    if (opts.persist) {
      writeStore(LANG_KEY, lang);
      writeStore(LANG_EXPLICIT_KEY, '1');
      // eslint-disable-next-line no-console
      console.log('Active language source:', 'manual', lang);
    }

    applyLanguage(lang, { force: opts.force, explicitUrl: opts.persist ? true : undefined });

    /* Keep the address bar in step with an explicit choice, so the URL
       stays copy-pasteable and reloads in the same language. History is
       replaced, not pushed: language is not a navigation step. */
    if (opts.persist && window.history && window.history.replaceState) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState(window.history.state, '', url.toString());
      } catch (e) { /* older browsers: the URL just stays as it was */ }
    }

    return lang;
  }

  /* ?lang= is read here to decide THIS load's language only - unlike an
     explicit toggle choice it is deliberately NOT written to LANG_KEY.
     It used to be ("a shared ?lang= link is a choice, also persisted so
     it sticks") - but that meant one visit via an old marketing link, a
     search-engine crawl, or a developer previewing a language during
     testing silently and permanently pinned that browser's language,
     indistinguishable afterward from a real click on the toggle, and
     overriding geo-IP detection on every future visit forever after.
     That is precisely the "IP resolves to US but the page keeps showing
     Hebrew" report this was diagnosed from: a stale, accidental
     app_lang outliving whatever visit actually wrote it. Only an actual
     click on [data-set-lang] (setLanguage's opts.persist path, above)
     counts as an explicit, sticky choice now - and even that is only
     ever read back via isExplicitChoice() below, never a bare
     fromStorage() on its own. */
  var urlLang = fromUrl();

  if (urlLang) {
    state.lang = urlLang;
    state.resolved = true;
    applyHead(urlLang);
    // eslint-disable-next-line no-console
    console.log('Active language source:', 'url', urlLang);
  } else if (isExplicitChoice() && fromStorage()) {
    /* A real toggle click, on a previous load - respected across
       reloads, no geo-IP check at all. This is the only path that
       bypasses geo-IP entirely. */
    var explicitLang = fromStorage();
    state.lang = explicitLang;
    state.resolved = true;
    applyHead(explicitLang);
    // eslint-disable-next-line no-console
    console.log('Active language source:', 'localStorage-explicit', explicitLang);
  } else {
    /* No URL override, no confirmed manual choice: paint DEFAULT_LANG
       immediately (the safe, non-Hebrew default - see the header
       comment for why this needs no cloak), then run a FRESH geo-IP
       lookup right now, every boot, no cache. Whatever it resolves to
       - including DEFAULT_LANG again if every provider fails - is
       written straight to LANG_KEY (without the explicit flag, so the
       next boot still re-checks) and applied live to the DOM. This is
       what strictly resets a non-Israel visitor to English even if some
       older, unconfirmed app_lang value was sitting in their browser. */
    state.lang = DEFAULT_LANG;
    applyHead(state.lang);

    fromIpLookup()
      .catch(function () {
        // eslint-disable-next-line no-console
        console.warn('[PearI18n] all IP geolocation sources failed - defaulting to', DEFAULT_LANG);
        return { lang: DEFAULT_LANG, country: null };   // every GEO_SOURCES provider was blocked, offline, or timed out
      })
      .then(function (resolved) {
        state.resolved = true;
        writeStore(LANG_KEY, resolved.lang);
        // eslint-disable-next-line no-console
        console.log('Active language source:', 'geoIP', resolved.lang);
        applyLanguage(resolved.lang, { force: true });
      });
  }

  /* ── Public API ──────────────────────────────────────────────── */
  window.PearI18n = {
    /** Active language code ('he' | 'en'). */
    getLang: function () { return state.lang; },
    /** Text direction for the active language ('rtl' | 'ltr'). */
    getDir: function () { return dirFor(state.lang); },
    /** Look up a key; falls back to English, then to the key itself. */
    t: t,
    /** Translate a subtree (defaults to <body>). Safe to call repeatedly. */
    apply: function (root) { applyDOM(root || document.body, state.lang); },
    /** Switch language from the UI - persists to localStorage['app_lang']. */
    setLang: function (lang) { return setLanguage(lang, { persist: true }); },
    /** Register a callback fired on every language change. */
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); },
    /** Supported codes, for anything that wants to render a switcher. */
    languages: SUPPORTED.slice()
  };

  /* Safety net: if nothing else called apply() by the time the DOM is
     ready (script order changed, an inline block threw), translate anyway. */
  whenDomReady(function () { applyDOM(document.body, state.lang); });

})(window, document);
