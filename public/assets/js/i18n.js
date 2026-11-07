// Interface text. The question bank has its own Spanish data file.
export const STRINGS = {
  en: {
    "skip": "Skip to content", "nav.practice": "Practice", "nav.topics": "Topics",
    "foot.browse": "All topics", "foot.about": "How it works", "foot.privacy": "Privacy", "foot.suggest": "Suggest a question or fix",
    "aria.theme": "Switch theme", "aria.account": "Account and saved progress", "aria.home": "Repaso home",
    "title.home": "Repaso: practice software interview questions", "title.practice": "Practice", "title.topics": "Topics", "title.search": "Search", "title.terms": "Glossary", "title.about": "How it works", "title.privacy": "Privacy", "title.account": "Your progress", "title.suggest": "Suggest a question or fix", "title.quiz": "Practice session", "title.done": "Session finished",
    "home.h1": "Practice for your <mark>software interview</mark>.",
    "home.lead": "Practice what interviewers ask, understand every answer and come back to what you missed. No signup.",
    "home.search": "Search a topic, term or question", "home.more": "More questions", "home.start": "Start {n} questions", "home.custom": "Choose topics", "home.topics": "Topics", "home.glossary": "Browse the glossary ({n} terms)",
    "home.boxes": "Your five boxes", "home.boxes.hint": "A right answer moves a question up one box. A miss sends it back to box 1. Higher boxes come back later.", "home.due": "{n} due today",
    "lv.0": "Foundations", "lv.1": "Basic", "lv.2": "Intermediate", "lv.3": "Advanced",
    "q.new": "New", "q.box": "Box {n}", "q.flash": "Flashcard", "q.of": "Question {i} of {n}", "q.streak": "Streak: {n}", "q.end": "End session",
    "q.dunno": "I don't know", "q.dunno.a": "The answer is {k}.", "st.new": "New", "st.learning": "Reviewing", "st.missed": "Missed", "st.mastered": "Mastered", "st.all.pl": "All", "st.new.pl": "New", "st.missed.pl": "Missed", "st.mastered.pl": "Mastered", "q.show": "Show answer", "q.got": "I knew it", "q.missed": "I missed it", "q.next": "Next question", "q.results": "See results", "q.fix": "Report a problem with this question",
    "q.correct": "Correct", "q.wrong": "Not quite. The answer is {k}.", "q.timeup": "Time is up. The answer is {k}.",
    "q.answer": "Answer", "q.model": "Model answer", "q.why": "Why", "q.remember": "Remember", "q.terms": "Key terms", "q.termqs": "Questions using this term",
    "q.levelup": "Level unlocked in {topic}: {level}.",
    "setup.mode": "Mode", "setup.topics": "Topics", "setup.all": "All", "setup.one": "Choose single topics", "setup.options": "Mode, order and number of questions", "setup.today": "{d} to review and {n} new", "setup.weak": "To reinforce", "setup.missed": "Missed: {n}", "setup.level": "Where to start", "setup.size": "Questions per session", "setup.time": "Seconds per question",
    "setup.interview": "Interview questions", "setup.basics": "From the basics", "setup.interview.hint": "Starts with what interviewers ask. Foundations wait until the end.", "setup.basics.hint": "Each topic starts at Foundations. Get 70% of a level right and the next one unlocks.",
    "mode.smart": "Smart review", "mode.all": "Random", "mode.weak": "My misses", "mode.exam": "Exam",
    "mode.smart.d": "Questions due today first, then new ones.", "mode.all.d": "Random questions from your topics. Foundations stay out unless you start from the basics.", "mode.weak.d": "Only the questions you got wrong last time.", "mode.exam.d": "Timed multiple choice. Running out of time counts as a miss.",
    "setup.go": "Start {n} questions", "err.storage": "This browser is not letting Repaso save your progress. Download it from Your progress to keep it.", "setup.empty.smart": "Nothing due. Come back later or try Random.", "setup.empty.weak": "No misses to review.",
    "setup.mastered": "{m} of {t} mastered", "setup.goal": "{ok} of {need} right to unlock {level}", "setup.top": "All levels unlocked",
    "done.title": "Session finished", "done.correct": "{p}% correct", "done.timeouts": "{n} ran out of time", "done.missed": "Missed this session", "done.clean": "No misses. Clean run.", "done.retry": "Go over {n} again", "done.unknown": "The ones you didn't know", "done.again": "Another session", "done.home": "Home", "done.save": "Save this progress across devices",
    "stat.accuracy": "Accuracy", "stat.answered": "Answered", "stat.streak": "Best streak",
    "study.lead": "Tap a question to read its answer.", "study.expand": "Expand all", "study.collapse": "Collapse all", "study.practice": "Practice this topic", "study.none": "Nothing here yet.",
    "search.empty": "Nothing found for that search. Try one word, like \"index\" or \"thread\".", "search.results": "{n} results", "search.all": "See all {n} results", "search.topic": "Topic", "search.term": "Glossary term", "search.q": "Question",
    "term.none": "No question uses this term yet.", "term.back": "All glossary terms", "q.practice": "Practice this question", "q.missing": "This question does not exist.",
    "acct.lead": "Your progress is saved in this browser without an account. Sign in only if you want it on other devices.",
    "acct.off": "Accounts are not turned on yet on this site. Your progress stays in this browser.",
    "acct.google": "Continue with Google", "acct.github": "Continue with GitHub", "acct.in": "Signed in as {name}", "acct.out": "Sign out", "acct.synced": "Progress saved to your account.", "acct.syncing": "Saving progress", "acct.fail": "Could not reach the account service. Practice keeps working and your progress stays in this browser. It will sync on your next visit.", "acct.signfail": "Sign-in did not finish. Try again, or keep practicing without an account.", "acct.linkneeded": "That e-mail already has an account with another sign-in method. Continue with the one you used before (Google?) and GitHub will be linked to it.", "acct.signedout": "Signed out. Your progress stays in this browser.",
    "acct.data": "Your data", "acct.export": "Download my progress", "acct.import": "Load progress from a file", "acct.imported": "Progress loaded and merged.", "acct.badfile": "That file is not a Repaso progress file.", "acct.reset": "Erase progress in this browser", "acct.reset2": "Tap again to erase", "acct.erased": "Progress erased in this browser.",
    "acct.delete": "Delete my account and cloud data", "acct.delete2": "Tap again to delete for good", "acct.deleted": "Account and cloud data deleted.", "acct.deletefail": "Could not delete the account. Sign in again and retry.",
    "sug.lead": "Found a wrong answer, or want a new question? Tell me what to change.", "sug.kind": "What is this about?", "sug.fix": "Fix a question or translation", "sug.new": "New question or topic", "sug.ref": "Question ID (optional)", "sug.text": "Your suggestion", "sug.github": "Open on GitHub", "sug.send": "Send", "sug.sent": "Sent. Thank you.", "sug.fail": "Could not send it. Use GitHub instead.", "sug.short": "Write at least 10 characters.", "sug.hint": "GitHub needs a free account and your suggestion is public there. Sending from here needs you to be signed in.",
    "err.load": "The questions did not load. Check your connection and try again.", "err.retry": "Try again", "offline.es": "The Spanish version did not load. Showing English.",
    "bar.lang": "Español", "lang.other": "ES",
    "home.badge": "{n} questions · English and Spanish · Free",
    "stat.q": "Questions", "stat.t": "Glossary terms", "stat.c": "Topics", "home.groups": "Categories", "home.allgroups": "All", "stat.l": "Languages", "home.nq": "{n} questions",
    "how.eyebrow": "How it works", "how.h": "A session in three steps",
    "how.1": "Answer", "how.1d": "Multiple choice, code questions and flashcards. The keys 1 to 4 work too.",
    "how.2": "See why", "how.2d": "Every answer comes with a short explanation and the key terms behind it.",
    "how.3": "It comes back", "how.3d": "Miss one and it returns soon. Get it right and it waits longer. Five boxes, no account needed.",
  },
  es: {
    "skip": "Saltar al contenido", "nav.practice": "Practicar", "nav.topics": "Temas",
    "foot.browse": "Todos los temas", "foot.about": "Cómo funciona", "foot.privacy": "Privacidad", "foot.suggest": "Sugerir una pregunta o corrección",
    "aria.theme": "Cambiar tema", "aria.account": "Cuenta y progreso guardado", "aria.home": "Inicio de Repaso",
    "title.home": "Repaso: practica preguntas de entrevista de software", "title.practice": "Practicar", "title.topics": "Temas", "title.search": "Buscar", "title.terms": "Glosario", "title.about": "Cómo funciona", "title.privacy": "Privacidad", "title.account": "Tu progreso", "title.suggest": "Sugerir una pregunta o corrección", "title.quiz": "Sesión de práctica", "title.done": "Sesión terminada",
    "home.h1": "Practica para tu <mark>entrevista de software</mark>.",
    "home.lead": "Practica lo que preguntan en entrevista, entiende cada respuesta y vuelve a lo que fallaste. Sin registro.",
    "home.search": "Busca un tema, término o pregunta", "home.more": "Más preguntas", "home.start": "Empezar {n} preguntas", "home.custom": "Elegir temas", "home.topics": "Temas", "home.glossary": "Ver el glosario ({n} términos)",
    "home.boxes": "Tus cinco cajas", "home.boxes.hint": "Si aciertas, la pregunta sube una caja. Si fallas, vuelve a la caja 1. Las cajas altas se repasan más tarde.", "home.due": "{n} para hoy",
    "lv.0": "Fundamentos", "lv.1": "Básico", "lv.2": "Intermedio", "lv.3": "Avanzado",
    "q.new": "Nueva", "q.box": "Caja {n}", "q.flash": "Flashcard", "q.of": "Pregunta {i} de {n}", "q.streak": "Racha: {n}", "q.end": "Terminar sesión",
    "q.dunno": "No la sé", "q.dunno.a": "La respuesta es la {k}.", "st.new": "Nueva", "st.learning": "En repaso", "st.missed": "Fallada", "st.mastered": "Dominada", "st.all.pl": "Todas", "st.new.pl": "Nuevas", "st.missed.pl": "Falladas", "st.mastered.pl": "Dominadas", "q.show": "Ver respuesta", "q.got": "La sabía", "q.missed": "No la sabía", "q.next": "Siguiente pregunta", "q.results": "Ver resultados", "q.fix": "Avisar de un problema en esta pregunta",
    "q.correct": "Correcto", "q.wrong": "No exactamente. La respuesta es {k}.", "q.timeup": "Se acabó el tiempo. La respuesta es {k}.",
    "q.answer": "Respuesta", "q.model": "Respuesta modelo", "q.why": "Por qué", "q.remember": "Recuerda", "q.terms": "Términos clave", "q.termqs": "Preguntas con este término",
    "q.levelup": "Nivel desbloqueado en {topic}: {level}.",
    "setup.mode": "Modo", "setup.topics": "Temas", "setup.all": "Todos", "setup.one": "Elegir temas sueltos", "setup.options": "Modo, orden y número de preguntas", "setup.today": "{d} para repasar y {n} nuevas", "setup.weak": "Para reforzar", "setup.missed": "Falladas: {n}", "setup.level": "Por dónde empezar", "setup.size": "Preguntas por sesión", "setup.time": "Segundos por pregunta",
    "setup.interview": "Preguntas de entrevista", "setup.basics": "Desde lo básico", "setup.interview.hint": "Empieza por lo que preguntan en entrevista. Los Fundamentos quedan para el final.", "setup.basics.hint": "Cada tema empieza en Fundamentos. Acierta el 70% de un nivel y se desbloquea el siguiente.",
    "mode.smart": "Repaso inteligente", "mode.all": "Al azar", "mode.weak": "Mis fallos", "mode.exam": "Examen",
    "mode.smart.d": "Primero las preguntas que tocan hoy, luego las nuevas.", "mode.all.d": "Preguntas al azar de tus temas. Los Fundamentos quedan fuera salvo que empieces desde lo básico.", "mode.weak.d": "Solo las preguntas que fallaste la última vez.", "mode.exam.d": "Opción múltiple con tiempo. Si se acaba el tiempo, cuenta como fallo.",
    "setup.go": "Empezar {n} preguntas", "err.storage": "Este navegador no deja que Repaso guarde tu progreso. Descárgalo desde Tu progreso para conservarlo.", "setup.empty.smart": "No hay nada para hoy. Vuelve más tarde o prueba Al azar.", "setup.empty.weak": "No tienes fallos que repasar.",
    "setup.mastered": "{m} de {t} dominadas", "setup.goal": "{ok} de {need} aciertos para desbloquear {level}", "setup.top": "Todos los niveles desbloqueados",
    "done.title": "Sesión terminada", "done.correct": "{p}% de aciertos", "done.timeouts": "{n} sin tiempo", "done.missed": "Falladas en esta sesión", "done.clean": "Ningún fallo. Sesión perfecta.", "done.retry": "Repasar {n} otra vez", "done.unknown": "Las que no sabías", "done.again": "Otra sesión", "done.home": "Inicio", "done.save": "Guardar este progreso entre dispositivos",
    "stat.accuracy": "Aciertos", "stat.answered": "Respondidas", "stat.streak": "Mejor racha",
    "study.lead": "Toca una pregunta para leer su respuesta.", "study.expand": "Abrir todas", "study.collapse": "Cerrar todas", "study.practice": "Practicar este tema", "study.none": "Aquí no hay nada todavía.",
    "search.empty": "No hay resultados. Prueba con una palabra, como \"índice\" o \"thread\".", "search.results": "{n} resultados", "search.all": "Ver los {n} resultados", "search.topic": "Tema", "search.term": "Término del glosario", "search.q": "Pregunta",
    "term.none": "Ninguna pregunta usa este término todavía.", "term.back": "Todos los términos del glosario", "q.practice": "Practicar esta pregunta", "q.missing": "Esta pregunta no existe.",
    "acct.lead": "Tu progreso se guarda en este navegador sin cuenta. Inicia sesión solo si lo quieres en otros dispositivos.",
    "acct.off": "Las cuentas aún no están activas en este sitio. Tu progreso se queda en este navegador.",
    "acct.google": "Continuar con Google", "acct.github": "Continuar con GitHub", "acct.in": "Sesión iniciada como {name}", "acct.out": "Cerrar sesión", "acct.synced": "Progreso guardado en tu cuenta.", "acct.syncing": "Guardando progreso", "acct.fail": "No se pudo conectar con el servicio de cuentas. La práctica sigue funcionando y tu progreso se queda en este navegador. Se sincronizará en tu próxima visita.", "acct.signfail": "El inicio de sesión no terminó. Inténtalo de nuevo o sigue practicando sin cuenta.", "acct.linkneeded": "Ese correo ya tiene una cuenta con otro método de acceso. Entra con el que usaste antes (¿Google?) y GitHub se enlazará a ella.", "acct.signedout": "Sesión cerrada. Tu progreso se queda en este navegador.",
    "acct.data": "Tus datos", "acct.export": "Descargar mi progreso", "acct.import": "Cargar progreso desde un archivo", "acct.imported": "Progreso cargado y combinado.", "acct.badfile": "Ese archivo no es un progreso de Repaso.", "acct.reset": "Borrar el progreso de este navegador", "acct.reset2": "Toca otra vez para borrar", "acct.erased": "Progreso borrado de este navegador.",
    "acct.delete": "Eliminar mi cuenta y mis datos en la nube", "acct.delete2": "Toca otra vez para eliminar definitivamente", "acct.deleted": "Cuenta y datos en la nube eliminados.", "acct.deletefail": "No se pudo eliminar la cuenta. Inicia sesión de nuevo y reintenta.",
    "sug.lead": "¿Encontraste una respuesta incorrecta o quieres una pregunta nueva? Dime qué cambiar.", "sug.kind": "¿De qué se trata?", "sug.fix": "Corregir una pregunta o traducción", "sug.new": "Pregunta o tema nuevo", "sug.ref": "ID de la pregunta (opcional)", "sug.text": "Tu sugerencia", "sug.github": "Abrir en GitHub", "sug.send": "Enviar", "sug.sent": "Enviado. Gracias.", "sug.fail": "No se pudo enviar. Usa GitHub.", "sug.short": "Escribe al menos 10 caracteres.", "sug.hint": "GitHub pide una cuenta gratuita y tu sugerencia queda pública allí. Enviar desde aquí requiere haber iniciado sesión.",
    "err.load": "Las preguntas no cargaron. Revisa tu conexión e inténtalo de nuevo.", "err.retry": "Intentar de nuevo", "offline.es": "La versión en español no cargó. Se muestra en inglés.",
    "bar.lang": "English", "lang.other": "EN",
    "home.badge": "{n} preguntas · Español e inglés · Gratis",
    "stat.q": "Preguntas", "stat.t": "Términos del glosario", "stat.c": "Temas", "home.groups": "Categorías", "home.allgroups": "Todas", "stat.l": "Idiomas", "home.nq": "{n} preguntas",
    "how.eyebrow": "Cómo funciona", "how.h": "Una sesión en tres pasos",
    "how.1": "Responde", "how.1d": "Test, preguntas con código y flashcards. Las teclas 1 a 4 también valen.",
    "how.2": "Entiende el porqué", "how.2d": "Cada respuesta trae una explicación corta y los términos clave detrás.",
    "how.3": "Vuelve a salir", "how.3d": "Si fallas, vuelve pronto. Si aciertas, tarda más. Cinco cajas, sin cuenta.",
  },
};

export const PAGES = {
  en: {
    about: `<h1>How it works</h1>
<p>Repaso is a free question bank for software engineering interviews, from junior to mid level. Every question comes with a plain explanation, a one-line takeaway and the key terms behind it.</p>
<h2>The five boxes</h2>
<p>Repaso uses the Leitner system. A right answer moves a question up one box, a miss sends it back to box 1, and higher boxes come back later:</p>
<ul><li>Box 1: right away</li><li>Box 2: tomorrow</li><li>Box 3: in 3 days</li><li>Box 4: in 7 days</li><li>Box 5: in 16 days</li></ul>
<p>A question you get right the first time starts in box 2. Boxes 4 and 5 count as mastered.</p>
<h2>Levels</h2>
<p>Each topic has four levels: Foundations, Basic, Intermediate and Advanced. New questions start with what interviewers ask, and Foundations come last. To build up instead, pick From the basics in Practice: each topic starts at Foundations and 70% right opens the next level.</p>
<h2>Keyboard</h2>
<p>Press 1 to 4 to answer, Enter to continue and / to search.</p>
<p>If you spot a mistake, <a href="#/suggest">let me know</a>.</p>`,
    privacy: `<h1>Privacy</h1>
<p>Short version: you can use all of Repaso without giving any data. There are no ads, no trackers and no analytics.</p>
<h2>Without an account</h2>
<p>Your progress and preferences stay in this browser (local storage, plus an offline copy of the site). Repaso never sends them anywhere. The site is hosted on GitHub Pages, so GitHub receives your IP address and browser details when a page loads, like any website. Repaso loads no fonts, scripts or trackers from any other company.</p>
<h2>With an optional account</h2>
<p>If you sign in with Google or GitHub, Firebase (Google) keeps your email address, your name and profile picture from that account, a user ID, your sign-in dates and your practice progress. Your browser also stores a sign-in token. While you are signed in, your browser contacts Google servers (including to load the sign-in code) each time you open the site, and Google logs standard connection data such as your IP address. The purpose is to give you your progress on other devices. The legal basis is your consent, given when you sign in, and you can withdraw it at any time.</p>
<p>Other people cannot read your progress: security rules tie each record to your account. As the owner of the project I could technically see it in the Firebase console, and I don't look.</p>
<p>If you send a suggestion from the site, it is stored with your user ID. If you choose "Open on GitHub" instead, the text goes to GitHub as a public issue under your GitHub name.</p>
<h2>Your rights</h2>
<p>In <a href="#/account">Your progress</a> you can download your data and delete your account and cloud data at any time. Deleting removes your account, your cloud progress and the suggestions you sent from the site. For any question about your data, open an issue on GitHub. Google keeps its own logs, which I can't control.</p>
<h2>Who runs this</h2>
<p>Adriana Babilonia, as a personal, non-commercial project.</p>`,
  },
  es: {
    about: `<h1>Cómo funciona</h1>
<p>Repaso es un banco gratuito de preguntas para entrevistas de ingeniería de software, de nivel junior a intermedio. Cada pregunta trae una explicación sencilla, una idea para recordar y los términos clave.</p>
<h2>Las cinco cajas</h2>
<p>Repaso usa el sistema Leitner. Si aciertas, la pregunta sube una caja; si fallas, vuelve a la caja 1. Las cajas altas se repasan más tarde:</p>
<ul><li>Caja 1: enseguida</li><li>Caja 2: mañana</li><li>Caja 3: en 3 días</li><li>Caja 4: en 7 días</li><li>Caja 5: en 16 días</li></ul>
<p>Una pregunta que aciertas a la primera empieza en la caja 2. Las cajas 4 y 5 cuentan como dominadas.</p>
<h2>Niveles</h2>
<p>Cada tema tiene cuatro niveles: Fundamentos, Básico, Intermedio y Avanzado. Las preguntas nuevas empiezan por lo que preguntan en entrevista, y los Fundamentos salen al final. Si prefieres ir subiendo, elige Desde lo básico en Practicar: cada tema empieza en Fundamentos y con el 70% de aciertos se abre el siguiente nivel.</p>
<h2>Teclado</h2>
<p>Pulsa 1 a 4 para responder, Enter para continuar y / para buscar.</p>
<p>Si ves algún error, <a href="#/suggest">avísame</a>.</p>`,
    privacy: `<h1>Privacidad</h1>
<p>En resumen: puedes usar todo Repaso sin dar ningún dato. No hay anuncios, ni rastreadores, ni analítica.</p>
<h2>Sin cuenta</h2>
<p>Tu progreso y tus preferencias se quedan en este navegador (almacenamiento local, más una copia del sitio para usarlo sin conexión). Repaso nunca los envía a ningún sitio. El sitio está alojado en GitHub Pages, así que GitHub recibe tu dirección IP y los datos de tu navegador cuando carga una página, como cualquier sitio web. Repaso no carga fuentes, scripts ni rastreadores de ninguna otra empresa.</p>
<h2>Con una cuenta opcional</h2>
<p>Si inicias sesión con Google o GitHub, Firebase (Google) guarda tu correo, tu nombre y tu foto de perfil de esa cuenta, un identificador de usuario, tus fechas de inicio de sesión y tu progreso de práctica. Tu navegador también guarda un token de sesión. Mientras tienes la sesión iniciada, tu navegador contacta con servidores de Google (también para cargar el código de inicio de sesión) cada vez que abres el sitio, y Google registra datos de conexión habituales como tu dirección IP. La finalidad es darte tu progreso en otros dispositivos. La base legal es tu consentimiento, que das al iniciar sesión y puedes retirar cuando quieras.</p>
<p>Otras personas no pueden leer tu progreso: las reglas de seguridad atan cada registro a tu cuenta. Como dueña del proyecto, técnicamente podría verlo en la consola de Firebase, y no lo miro.</p>
<p>Si envías una sugerencia desde el sitio, se guarda con tu identificador de usuario. Si eliges "Abrir en GitHub", el texto va a GitHub como un issue público con tu nombre de GitHub.</p>
<h2>Tus derechos</h2>
<p>En <a href="#/account">Tu progreso</a> puedes descargar tus datos y eliminar tu cuenta y tus datos en la nube cuando quieras. Al eliminar se borran tu cuenta, tu progreso en la nube y las sugerencias que enviaste desde el sitio. Para cualquier duda sobre tus datos, abre un issue en GitHub. Google conserva sus propios registros, que no puedo controlar.</p>
<h2>Quién está detrás</h2>
<p>Adriana Babilonia, como proyecto personal y sin fines comerciales.</p>`,
  },
};
