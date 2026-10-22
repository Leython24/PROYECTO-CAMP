"""Import all 150 supplied questions, preserve the PDF and document the AI review."""
from pathlib import Path
import json, re, copy, shutil, collections, hashlib

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT/'src/data/collections'
COLLECTION = 'grupo-procesos-simulador-02'
DATE = '2026-10-22'
raw = json.loads((ROOT/'input/procesos-questions-extracted.json').read_text(encoding='utf-8'))
assert [q['number'] for q in raw] == list(range(1,151))

sources = []
existing = json.loads((DATA/'exitos-review-sources.json').read_text(encoding='utf-8'))
for key in ['domains','lexicon','scrum','agile','power-skills','coq','communication','risk-process','efficiency']:
    s = copy.deepcopy(next(s for s in existing if s['id']=='exitos-review-'+key))
    s['id'] = 'procesos-review-'+key
    s['usage'] = 'Contraste conceptual por IA del Simulador 2; no contiene claves oficiales de examen.'
    sources.append(s)

ROWS = '''
kanban|The Kanban Guide|https://kanbanguides.org/the-kanban-guide/2025.5/|Definition of Kanban; Defining and Visualizing the Workflow; Flow Metrics|Mayo de 2025|Autores de The Kanban Guide
ba-outline|PMI-PBA Examination Content Outline|https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/professional-business-analysis-exam-outline.pdf|Planning; Analysis; Traceability and Monitoring; Evaluation, páginas impresas 5–8|Publicación 2013; impresión 2017, usada por sus conceptos de análisis de negocios|PMI
ba-partnership|Project Management and Business Analysis|https://www.pmi.org/learning/library/partnership-project-managers-business-analysts-9865|Planning; Requirements Elaboration; Control Requirements; Evaluate Solution; Closing|Ponencia publicada en la biblioteca de PMI|Biblioteca de PMI
scope|Scope and stakeholder management|https://www.pmi.org/learning/library/stakeholder-management-pain-points-perils-prosperity-5955|Project Scope versus Product Scope; planificación y gestión del alcance|Ponencia publicada en la biblioteca de PMI|Biblioteca de PMI
benefits|Benefits Realization Management Framework|https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/benefits-realization-management-framework.pdf|Glosario: business case y benefits realization plan; Identify, Execute, Sustain|Marco oficial de realización de beneficios|PMI
closing|Project closing|https://www.pmi.org/learning/library/importance-of-closing-process-group-9949|Aceptación; transición a operaciones; lecciones aprendidas; phase-gate reviews|Ponencia de 2015 publicada en PMI|Biblioteca de PMI
procurement|Contract/Procurement Management|https://www.pmi.org/learning/library/contract-procurement-management-9101|Contract/Procurement Strategy; alcance, selección y contratación|Artículo del autor publicado en PMI|Biblioteca de PMI
elicitation|Collaborative and creative business analysis|https://www.pmi.org/learning/library/collaborative-creative-business-analysis-9397|Elicitación: talleres, entrevistas, observación, prototipos, encuestas; trazabilidad|Ponencia publicada en PMI|Biblioteca de PMI
charter|Financing the project|https://www.pmi.org/learning/library/financing-project-planned-value-6866|Project charter: high-level requirements, summary milestone schedule y summary budget|Ponencia publicada en PMI|Biblioteca de PMI
'''
for row in ROWS.strip().splitlines():
    key,title,url,section,edition,author = row.split('|')
    sources.append({'id':'procesos-review-'+key,'title':title,'url':url,'section':section,'edition':edition,
        'author':author,'accessed':DATE,'status':'consultada',
        'usage':'Contraste conceptual de claves y explicaciones por IA; las aplicaciones a los casos son razonamiento de esta aplicación.',
        'note':'No es una clave oficial de examen ni revisión humana. Las citas y páginas indicadas por el PDF aportado se conservan sin atribuirles verificación literal automática.'})
pdf_source = {'id':'procesos-pdf-02','title':'Simulador 2 · Grupo de Procesos · PDF aportado',
    'author':'Documento aportado por Leython; autoría de las preguntas no verificada',
    'url':'https://chatgpt.com/api/library/files/libfile_cd040363a4e08191bbe74acc9fee5958/download',
    'localUrl':'/collections/'+COLLECTION+'/Grupo_de_Procesos_150.pdf',
    'section':'96 páginas con preguntas 1–150, cuatro alternativas, clave y explicación de cada pregunta',
    'edition':'Grupo de Procesos Guía Práctica, p. 217 (1).pdf','accessed':DATE,'status':'consultada',
    'usage':'Fuente primaria de los enunciados, alternativas, claves y explicaciones importadas; no se atribuye a PMI la autoría del simulacro.',
    'note':'Las referencias a libros y las citas dentro del documento son atribuciones del documento, no una certificación de su exactitud. Las correcciones de esta aplicación se identifican como IA.'}
all_sources = [pdf_source]+sources
source_map = {s['id']:s for s in sources}

# Each group is assigned explicitly. No question is synthesized or silently omitted.
groups = {}
def group(numbers, topic, refs, reason, contrast):
    for n in numbers:
        assert n not in groups, n
        groups[n] = {'topic':topic,'refs':refs.split(), 'reason':reason,'contrast':contrast}

group([1,21], 'D2-T1-componentes', 'procurement',
    'La estrategia de adquisiciones establece el enfoque para obtener bienes o servicios externos y organizar su contratación y entrega.',
    'Un SOW describe el trabajo requerido; los términos de referencia detallan condiciones, y una solicitud de cambio pide una modificación. Ninguno sustituye la estrategia global de adquisición.')
group([2], 'D1-T2-hitos', 'lexicon charter',
    'Un cronograma de hitos resume puntos significativos del proyecto sin detallar cada actividad. Es apropiado para comunicar sus puntos clave al inicio.',
    'Un backlog ordena trabajo; Kanban visualiza flujo, y una retrospectiva evalúa cómo mejorar el trabajo. No son el resumen de hitos solicitado.')
group([3,8,23,35,56,69], 'D2-T1-idoneidad', 'domains lexicon',
    'El enfoque predictivo favorece planificar alcance y trabajo con mayor detalle cuando los requisitos son suficientemente estables y existe necesidad de aprobación y control de una línea base.',
    'La adaptación y la iteración son útiles con incertidumbre y aprendizaje frecuente. La estructura organizacional por sí sola no determina el enfoque; se deben valorar también los entregables y los requisitos.')
group([4,10,11,14,37,41,75], 'D3-T1-adaptacion', 'domains agile scrum',
    'Un enfoque adaptativo incorpora retroalimentación y ajusta prioridades y planes conforme se aprende. Es adecuado cuando evolucionan los requisitos y se necesita entregar y revisar valor con frecuencia.',
    'La planificación rígida de todo el alcance, las líneas base inmutables y la reducción de la participación del cliente no permiten responder al aprendizaje descrito. La adaptación sí requiere planificación y disciplina.')
group([20,26], 'D3-T1-organizacion', 'domains agile',
    'La exigencia de aprobar de antemano un alcance y una planificación detallada entra en tensión con un enfoque principalmente adaptativo, que prevé el refinamiento progresivo.',
    'Esto no significa que los equipos virtuales no puedan ser ágiles ni que la ubicación obligue a usar un enfoque. La respuesta depende de la exigencia de planificación del caso.')
group([5,6,93,112], 'D1-T2-cierre', 'closing benefits',
    'El cierre requiere aceptación y una transición ordenada: responsabilidades, conocimiento y capacidad de operación deben quedar transferidos antes de liberar los recursos que los sostienen.',
    'Entregar el producto y disolver el equipo sin aceptación ni transferencia deja trabajo pendiente. Añadir alcance, prototipos o iteraciones nuevas no sustituye el cierre acordado.')
group([7,34], 'D1-T4-beneficios', 'benefits ba-outline',
    'El caso de negocio evalúa la necesidad, la viabilidad y el valor esperado de la iniciativa. Permite decidir si tiene sentido autorizarla y mantenerla alineada con la estrategia.',
    'Un cronograma, un backlog o un umbral de pruebas no justifican por sí mismos la inversión. El plan de beneficios desarrolla después cómo se materializarán y medirán los beneficios.')
group([9,55], 'D1-T4-iniciacion', 'charter lexicon',
    'El acta de constitución autoriza formalmente el proyecto y resume objetivos, requisitos y recursos financieros de alto nivel; no equivale a un presupuesto detallado ni a un plan completo de beneficios.',
    'Un roadmap resume la evolución o las entregas; un backlog ordena trabajo y un tablero visualiza flujo. Ninguno de ellos reemplaza la autorización formal del acta.')
group([12,38,57], 'D3-T2-iteracion', 'scrum lexicon',
    'Una iteración es un ciclo de desarrollo en el que se planifica, realiza y revisa trabajo. En Scrum el Sprint es un período fijo de un mes o menos; el incremento es el resultado utilizable, no el período de tiempo.',
    'Un hito es un punto significativo, una EDT organiza alcance y un paquete de trabajo es un componente de esa EDT. No son ciclos de iteración.')
group([13,36,39], 'D3-T2-cadencia', 'domains agile scrum',
    'Iterar permite experimentar, obtener retroalimentación y refinar una solución. A cambio se necesita revisar planes y coordinar el aprendizaje; la definición detallada de trabajo futuro puede posponerse.',
    'No garantiza una entrega más tardía, ni exige requisitos estables, ni elimina la planificación. Un resultado utilizable puede entregarse pronto si se combina iteración con incrementos.')
group([15,17,42,44,59,60,63,76,119,122], 'D3-T3-backlogs', 'scrum agile',
    'El Product Backlog es una lista ordenada y emergente del trabajo necesario para mejorar el producto. Se refina y ordena por valor, riesgo, dependencias y aprendizaje; el Product Owner mantiene la responsabilidad de su orden en Scrum.',
    'Fijar todo el alcance de antemano o añadir ideas sin evaluar su valor no responde al cambio. Una EDT o un cronograma no sustituye el orden y refinamiento del backlog en este caso.')
group([16,70], 'D3-T4-kanban-safe', 'kanban',
    'Kanban define y visualiza el flujo, gestiona el trabajo en curso y mejora el sistema. Observar el tablero y las métricas permite detectar bloqueos y cuellos de botella; el tablero aislado no constituye toda la práctica.',
    'Un Sprint es un evento de Scrum. Pair programming es una práctica de ingeniería; una negociación de proveedores o un informe aislado no optimiza por sí mismo el flujo.')
group([71], 'D3-T3-wip', 'efficiency kanban',
    'Analizar las actividades que generan valor frente a esperas y retrabajo ayuda a mejorar el proceso completo. Se estudia el flujo y su tiempo total, no solo la ocupación de una persona.',
    'Una conferencia de oferentes selecciona adquisiciones, el backlog prioriza producto y un informe comunica información. No equivalen al análisis de valor y desperdicio solicitado.')
group([18,25,46,104,131,134,136,145], 'D4-T5-ba-predictivo', 'ba-outline ba-partnership',
    'En un contexto predictivo el analista colabora con los interesados para elicitar, analizar, aclarar y documentar requisitos y criterios verificables. Una línea base aprobada se mantiene mediante el proceso de cambios acordado.',
    'El análisis no se limita al inicio ni termina al aprobar una línea base. Tampoco se reemplaza por logística, pruebas finales aisladas, rechazo de toda aclaración o interpretación unilateral del equipo técnico.')
group([19,96], 'D1-T4-beneficios', 'benefits',
    'La planificación de beneficios define los resultados de negocio esperados, cómo se medirán, cuándo se obtendrán y quién responde por realizarlos y sostenerlos, incluso después de cerrar el proyecto.',
    'Un roadmap o una lista de riesgos puede aportar información, pero no sustituye el plan de realización de beneficios con medidas y responsables. Los entregables por sí solos no garantizan beneficios.')
group([22,47,126,140,149], 'D4-T5-ba-adaptativo', 'ba-outline ba-partnership scrum',
    'El análisis de negocios se adapta a cada componente del enfoque híbrido: requisitos aprobados y cambios controlados donde se necesita estabilidad, y refinamiento y priorización iterativa donde hay aprendizaje.',
    'Imponer un solo enfoque a todos los componentes, ignorar las dependencias o delegar todo el análisis no integra las necesidades de negocio. Los cambios deben coordinarse entre los componentes.')
group([24], 'D2-T1-componentes', 'domains ba-partnership',
    'Un documento de diseño detallado traduce requisitos y decisiones de alto nivel a especificaciones necesarias para construir. Es el artefacto que responde al nivel de detalle pedido.',
    'Un burndown mide trabajo restante, un informe comunica retroalimentación y una lista priorizada ordena trabajo. No sustituyen las especificaciones del diseño.')
group([27], 'D2-T1-procesos', 'closing',
    'Los criterios de salida fijan condiciones de terminación de la fase y apoyan la decisión de una revisión de fase. Se verifica la evidencia antes de autorizar la transición.',
    'Un informe o una lista de tareas no define por sí solo las condiciones de salida. Las revisiones de fase pueden existir con distintos enfoques y no son exclusivas del predictivo.')
group([28,49], 'D1-T1-enfoques', 'domains agile scrum',
    'En un enfoque predictivo se concentra más planificación detallada por adelantado; en uno adaptativo el detalle evoluciona con iteraciones y retroalimentación. Ambos planifican y ambos pueden gestionar cambios.',
    'Intercambiar estas características es incorrecto. El enfoque predictivo no impide toda modificación y el adaptativo no exige definir todo el alcance detallado desde el inicio.')
group([29,50,98,99,115], 'D2-T2-edt', 'lexicon scope',
    'La EDT descompone jerárquicamente el alcance total del trabajo en entregables y componentes manejables. Debe representar todo el alcance acordado; los requisitos ambiguos se aclaran con los interesados, no solo dibujando una EDT.',
    'Una EDT no es un cronograma, una lista de riesgos ni una priorización de backlog. Crear EDT y definir el alcance son actividades relacionadas, pero no el mismo proceso.')
group([30,51], 'D1-T2-componentes', 'domains lexicon',
    'La planificación integra trabajo, plazos, costos y riesgos para coordinar la entrega. Las líneas base aprobadas permiten comparar desempeño real y previsto y analizar desviaciones.',
    'No tiene como propósito eliminar la participación de los interesados ni convertir todo trabajo en historias de usuario. El seguimiento no consiste en cambiar la línea base para ocultar desviaciones.')
group([31,52,90], 'D1-T1-alcance', 'scope lexicon',
    'El alcance del proyecto describe el trabajo necesario para producir el resultado; el alcance del producto describe sus características y funciones. El plan del proyecto integra cómo organizar y controlar ese trabajo.',
    'Invertir producto y proyecto confunde el resultado con el trabajo. La gestión del producto abarca más que una lista de especificaciones: también valor, estrategia y ciclo de vida.')
group([32,53,65,81,91], 'D1-T2-recursos', 'lexicon domains',
    'Se estiman tipo y cantidad de personas, equipos, materiales y suministros a partir del alcance y las actividades. Después se contrasta disponibilidad, capacidades, calendario y costos.',
    'Un presupuesto fijo, una retrospectiva posterior o una asignación unilateral del sponsor no sustituye la estimación de necesidades. Priorizar producto tampoco determina por sí solo cantidades de recursos.')
group([33,61,73,77,79,84,88,109], 'D2-T2-integracion', 'ba-partnership lexicon',
    'Los cambios se evalúan por su valor e impacto en alcance, plazos, costos, calidad y riesgos, siguiendo la autoridad y el proceso acordados. En predictivo se controla la línea base; en adaptativo se refina el backlog sin desproteger los compromisos de la iteración.',
    'Aceptar todo, rechazar todo o modificar sin evaluar son respuestas insuficientes. Registrar un cambio no equivale a aprobarlo. Un cambio predictivo no necesita siempre un comité: importa la autoridad definida.')
group([43], 'D3-T4-scrum', 'scrum kanban',
    'Scrum organiza su trabajo mediante Sprints de duración fija de un mes o menos, un Product Backlog ordenado y un equipo autogestionado. Kanban no exige Sprints para gestionar su flujo.',
    'La combinación backlog más período fijo apunta a Scrum entre estas opciones. El uso de un tablero por sí solo no permite identificar Scrum, SAFe o XP.')
group([45,48,133,135,137,148], 'D4-T5-ba-adaptativo', 'ba-outline ba-partnership scrum',
    'El analista facilita la comprensión continua de las necesidades, el refinamiento de requisitos y la colaboración con los interesados. En un contexto adaptativo usa la retroalimentación para ayudar a ordenar y aclarar el backlog.',
    'Esperar al producto final, fijar todos los requisitos futuros o excluir a los usuarios dificulta el aprendizaje. Refinar requisitos no traslada al analista la responsabilidad del Product Owner por el orden del Product Backlog.')
group([40,58,74], 'D3-T2-entradas', 'ba-outline scope',
    'La necesidad de negocio, los objetivos y los requisitos de los interesados ayudan a delimitar qué resultado se necesita y qué trabajo debe incluirse. Son información de contexto, no una lista exhaustiva de entradas formales de un proceso.',
    'Cronogramas y estimaciones necesitan un alcance suficientemente entendido. Los planes de iteración, adquisiciones o métricas no reemplazan conocer la necesidad y los requisitos.')
group([54,68,95], 'D1-T4-comunicacion', 'communication',
    'Se entrega a los interesados la información acordada, con la frecuencia, canal y contenido definidos en el plan de comunicación, y se verifica si satisface sus necesidades.',
    'La comunicación solo a demanda o al cierre incumple una frecuencia ya acordada. Una retrospectiva puede mejorar el plan, pero no justifica dejar de comunicar mientras está vigente.')
group([62,87], 'D1-T1-supuestos', 'lexicon',
    'Un supuesto es una condición que se acepta como cierta para planificar sin contar aún con confirmación completa. Debe registrarse y validarse; su posible incumplimiento puede generar riesgos.',
    'El riesgo es la incertidumbre sobre un evento y su efecto; el incidente es un problema presente, y la restricción impone un límite. No son sinónimos de una condición asumida.')
group([64,80,89,110], 'D1-T2-componentes', 'domains',
    'Integrar costo, calidad, riesgo y cronograma permite evaluar compensaciones y mantener el proyecto alineado con los objetivos y las expectativas acordadas, sin sacrificar requisitos obligatorios.',
    'Optimizar una sola variable, eliminar controles o reducir la comunicación puede perjudicar el resultado global. Ninguna restricción se ajusta arbitrariamente sin evaluar impactos y autorizaciones.')
group([66,82,92,111], 'D1-T2-registro-riesgos', 'risk-process lexicon',
    'El registro de riesgos documenta eventos inciertos identificados, su análisis y las respuestas y responsables necesarios. Se actualiza antes de que el evento ocurra y durante el seguimiento.',
    'Esperar al daño convierte la gestión en reacción. Transferir una amenaza no elimina la necesidad de documentarla y supervisarla. Los problemas ya ocurridos se gestionan también como incidentes.')
group([67,83,94,113], 'D1-T3-facilitacion', 'power-skills domains',
    'El liderazgo del director incluye escuchar, facilitar acuerdos, negociar y apoyar el desarrollo del equipo. Estas conductas ayudan a resolver preocupaciones y sostener colaboración y objetivos compartidos.',
    'Una auditoría, una adquisición o una lista de tareas no sustituye escuchar y llegar a acuerdos. La satisfacción no significa aceptar cualquier solicitud ni reducir requisitos de calidad.')
group([72,101,117], 'D2-T2-calidad', 'coq ba-partnership',
    'La gestión de la calidad incluye prevención, evaluación y mejora de procesos, además de inspeccionar y probar los resultados. Las auditorías verifican procesos; las pruebas verifican los entregables.',
    'Esperar exclusivamente a defectos o quejas, omitir controles o delegar sin seguimiento no cumple un plan de calidad. Cumplir un plazo no autoriza incumplir estándares.')
group([78,108], 'D1-T1-riesgo-incidente', 'lexicon',
    'El evento descrito ya ocurrió y está afectando el trabajo o sus resultados: se gestiona como un incidente actual, aunque antes pudiera haber sido un riesgo identificado.',
    'Un riesgo sigue siendo incierto antes de ocurrir; un supuesto es una condición aceptada al planificar y una restricción es un límite. La ocurrencia actual distingue este caso.')
group([85,86,107], 'D1-T1-enfoques', 'domains agile scrum',
    'El enfoque predictivo planifica la cadencia de entrega con antelación y puede tener una o varias entregas. El adaptativo favorece incrementos utilizables y ajustes frecuentes a partir de la retroalimentación.',
    'No es correcto afirmar que todos los proyectos predictivos entregan únicamente al final ni que todos los adaptativos entregan valor solo tras una aprobación final. La cadencia se adapta al producto y contexto.')
group([97], 'D4-T3-backlog', 'ba-outline ba-partnership',
    'Gestionar requisitos exige documentarlos con claridad, acordarlos con los interesados y hacerlos verificables. También se mantiene su trazabilidad y se controlan sus cambios.',
    'Una inspección de prototipo, una transferencia a marketing o una modificación del cronograma no reemplaza la definición y gestión de requisitos.')
group([100,116], 'D2-T2-paquetes', 'lexicon',
    'Un paquete de trabajo es el trabajo definido en el nivel más bajo de la EDT para el que se estiman y gestionan costos, esfuerzo, duración y recursos. Puede descomponerse después en actividades del cronograma.',
    'No es simplemente una actividad aislada, un requisito general, un prototipo o una métrica de satisfacción. Sus detalles y criterios se pueden documentar en el diccionario de la EDT.')
group([102,124], 'D4-T3-encuestas', 'elicitation ba-outline',
    'Las encuestas permiten recoger información estructurada de muchas personas sin reunirlas a la vez. Las entrevistas de seguimiento ayudan a profundizar y resolver ambigüedades.',
    'Reunir presencialmente a todos o entrevistar individualmente a una población muy grande puede ser poco viable en este contexto. La documentación previa no sustituye consultar a los usuarios.')
group([103,125,130,139,144], 'D4-T3-trazabilidad', 'ba-outline ba-partnership',
    'La trazabilidad enlaza la necesidad de negocio y los requisitos con sus fuentes, entregables y pruebas. Permite encontrar brechas y comprobar que el resultado responde a requisitos aprobados, incluidos los no funcionales.',
    'Una lista de tareas o de cambios sin relaciones no ofrece trazabilidad suficiente. Un Product Backlog puede conservar vínculos, pero no sustituye automáticamente a una matriz de trazabilidad.')
group([105,127,132,141,146], 'D4-T6-aceptacion', 'ba-outline ba-partnership',
    'Los criterios de aceptación se acuerdan con los interesados y se expresan de forma verificable. Ante cambios se analiza el impacto, se actualizan los vínculos y se obtiene la aprobación exigida por la gobernanza.',
    'Imponer criterios técnicos sin colaboración, rechazar todo cambio o actualizar solo la matriz no asegura aceptación. La adaptación no elimina requisitos legales ni criterios de calidad.')
group([106,128,142,147], 'D4-T6-preparacion', 'ba-outline ba-partnership scrum',
    'La trazabilidad y las evidencias de prueba ayudan a demostrar que los requisitos de la entrega cumplen sus criterios acordados. La aceptación y la preparación operativa completan la decisión de entrega.',
    'Contar tareas o vaciar el backlog no demuestra que el producto sea aceptable. La matriz no es por sí sola una certificación de entrega, y cumplir Definition of Done no equivale automáticamente a aprobación comercial.')
group([114,129,138,143], 'D4-T3-tecnicas', 'elicitation ba-outline',
    'La técnica de elicitación se selecciona según la información necesaria y el acceso a los interesados. Entrevistas profundizan en conocimiento experto; prototipos aclaran expectativas; talleres coordinan perspectivas y encuestas amplían la cobertura.',
    'Depender de una única fuente o ignorar a los usuarios y las lecciones previas deja brechas. Las combinaciones deben responder a las restricciones concretas de disponibilidad y comprensión.')
group([118,121], 'D3-T2-iteracion', 'scrum lexicon',
    'La iteración es un período de trabajo; el incremento es un resultado utilizable y un ítem del backlog es trabajo por realizar. Pueden completarse varios ítems y producirse varios incrementos dentro de una iteración.',
    'Período, trabajo pendiente y resultado no son sinónimos. El término genérico «unidad lógica» no basta para distinguirlos sin indicar a cuál se refiere el ejercicio.')
group([120,123], 'D3-T4-kanban-safe', 'scrum kanban',
    'Scrum utiliza Sprints y Product Backlog; Kanban optimiza el flujo mediante visualización, gestión del trabajo en curso y mejora del sistema, sin imponer una cadencia de Sprint.',
    'No son procesos predictivos ni dependen universalmente de comités para cada cambio. Scrum también puede usar tableros y Kanban puede coexistir con Scrum, por lo que no son categorías excluyentes.')
group([150], 'D4-T6-validacion', 'ba-outline ba-partnership',
    'El analista compara necesidades, requisitos trazados y evidencias de uso para identificar la brecha de usabilidad y sus causas. En predictivo propone correcciones o cambios mediante la autoridad acordada, sin quedar limitado a comprobar una lista aprobada.',
    'Una línea base permite controlar cambios; no prohíbe analizar necesidades ni corregir una solución inadecuada. Tampoco autoriza introducir cambios sin evaluar su impacto.')
assert set(groups) == set(range(1,151)), sorted(set(range(1,151))-set(groups))

adaptations = {}
def adapt(n,note,stem=None,options=None):
    adaptations[n] = {'note':note,'stem':stem,'options':options or {}}

adapt(9,'La hoja de ruta no autoriza recursos ni sustituye al acta. Se precisa la finalidad y se corrige la alternativa b manteniendo el original consultable.',
    'Durante la iniciación de un proyecto predictivo para construir un hospital, se necesita autorizar formalmente el proyecto y resumir sus objetivos y financiamiento de alto nivel. ¿Qué documento cumple esa función?',
    {'b':'Acta de constitución del proyecto'})
adapt(19,'Se corrige la confusión entre hoja de ruta y plan de realización de beneficios; la alternativa a revisada concreta el documento apropiado.',
    options={'a':'Plan de realización de beneficios, con métricas, responsables y plazos'})
adapt(20,'La ubicación virtual no determina el enfoque. Se explicita que la incompatibilidad proviene de la exigencia contractual de planificación detallada inicial.',
    'Un equipo distribuido globalmente debe desarrollar un software cuyos requisitos son estables. El contrato exige aprobar al inicio una línea base detallada del alcance y del cronograma. ¿Qué enfoque es menos compatible con esa exigencia si se usa como enfoque principal sin adaptación?')
adapt(23,'La matriz fuerte no significa subordinación del proyecto a varios supervisores funcionales ni obliga a un enfoque. Se precisa la autoridad y la estabilidad de los requisitos.',
    'Una organización matricial fuerte, donde el director de proyecto tiene considerable autoridad, implementará un sistema de inventarios con requisitos estables y una exigencia de planificación detallada inicial. ¿Qué enfoque se ajusta mejor a esas condiciones?')
adapt(29,'Los requisitos se aclaran con los interesados antes de elaborar la EDT; la descomposición por sí sola no elimina su ambigüedad.',
    'Durante la planificación predictiva de un producto, el equipo ya aclaró y acordó los requisitos con los interesados. ¿Qué acción permite descomponer jerárquicamente el alcance en entregables y componentes manejables?')
for n in [31,52,90]:
    adapt(n,'El PDF confunde el alcance del producto con toda la gestión del producto. Se usa la distinción estándar entre alcance del proyecto y alcance del producto.',
        raw[n-1]['stem'].split('¿')[0]+'¿Cuál es la diferencia entre el alcance del proyecto y el alcance del producto?',
        {'a':'El alcance del proyecto define las funciones del producto y el del producto define el cronograma.',
         'b':'El alcance del proyecto es el trabajo para entregar el resultado; el del producto son sus características y funciones.',
         'c':'El alcance del proyecto es únicamente el backlog y el del producto es únicamente el presupuesto.',
         'd':'Ambos describen exclusivamente las actividades de ejecución.'})
adapt(34,'El caso de negocio justifica la inversión; el detalle de la realización y medición de beneficios corresponde a su plan específico.',
    options={'b':'Justificar la viabilidad y el valor esperado del proyecto en relación con la necesidad de negocio'})
adapt(50,'Se diferencia aclarar requisitos de descomponer el alcance ya acordado mediante una EDT.',
    'Durante la planificación predictiva de infraestructura, el equipo ya aclaró los requisitos inicialmente vagos con los interesados. ¿Qué debería hacer para descomponer el alcance acordado en componentes manejables?')
adapt(55,'Se aclara que el acta autoriza y resume resultados de alto nivel; no reemplaza al plan detallado de realización de beneficios.',
    'Un equipo inicia un proyecto de energía renovable. ¿Qué documento formaliza su autorización y resume los resultados de alto nivel que se espera alcanzar?')
for n,k in [(85,'c'),(86,'b'),(107,'b')]:
    adapt(n,'Un enfoque predictivo puede tener varias entregas planificadas; se elimina la regla falsa de que siempre entrega todo al final.',
        options={k:'El predictivo sigue una cadencia de entregas planificada; el adaptativo favorece incrementos y ajustes frecuentes según retroalimentación'})
adapt(98,'La descomposición es propia de Crear la EDT; no se atribuye a Definir el Alcance como si fueran el mismo proceso.',
    'En un proyecto de embotellado de agua mineral se necesita organizar jerárquicamente el alcance acordado en entregables y componentes manejables. ¿Qué actividad realiza esa descomposición?')
adapt(100,'Un paquete de trabajo no es simplemente una tarea del cronograma; se corrige su definición.',
    options={'b':'El trabajo definido en el nivel más bajo de la EDT, para el que se estiman y gestionan costos, esfuerzo, duración y recursos'})
adapt(103,'Un backlog y una matriz no son sinónimos ni ofrecen automáticamente la misma trazabilidad; se precisa la herramienta preguntada.',
    'Un equipo desarrolla una aplicación de citas médicas y quiere verificar la relación de los requisitos con los objetivos y los resultados. ¿Cuál es el propósito de una matriz de trazabilidad de requisitos?')
adapt(118,'Se reemplaza el término ambiguo «unidades lógicas» por incrementos utilizables y se contrasta resultado con período de trabajo.',
    'Un equipo utiliza un enfoque iterativo e incremental para un sistema de gestión de agua mineral. ¿Cómo se distinguen un incremento utilizable y una iteración?',
    {'a':'El incremento es un período fijo y la iteración es un módulo funcional.',
     'b':'El incremento es un resultado utilizable; la iteración es un período de desarrollo y revisión.',
     'c':'El incremento es un plan de riesgos y la iteración es un presupuesto.',
     'd':'Ambos son fases predictivas con cronogramas rígidos.'})
adapt(121,'Se explicita que se comparan ítems del backlog con iteraciones, sin asignar otra definición incompatible a «unidad lógica».',
    'Un equipo adaptativo desarrolla una aplicación de sostenibilidad. ¿Cómo se diferencian los ítems del Product Backlog de las iteraciones?',
    {'a':'Los ítems son períodos fijos y las iteraciones son características del producto.',
     'b':'Los ítems describen trabajo por realizar; las iteraciones son períodos de trabajo y revisión.',
     'c':'Los ítems son presupuestos y las iteraciones son estimaciones de recursos.',
     'd':'Ambos son cronogramas fijos basados en una EDT.'})
adapt(123,'La comparación se respalda en las guías originales de Scrum y Kanban, no se atribuye esa definición de ambos marcos a un dominio de PMBOK.',
    'Un equipo adaptativo desarrolla una plataforma de gestión de residuos y compara Scrum y Kanban. Según las guías de estos enfoques, ¿qué describe mejor sus componentes?')
adapt(150,'Se corrige la idea de que el enfoque predictivo limita al analista a verificar una línea base y solo le permite investigar retrospectivamente. El analista evalúa la solución y gestiona las brechas con los interesados.',
    options={'a':'Analizar con los usuarios las brechas de usabilidad y su trazabilidad a necesidades y requisitos, y gestionar las correcciones o cambios mediante el proceso aprobado.'})

notes = {
3:'Gestionar riesgos es necesario en cualquier enfoque; elegir predictivo no garantiza eliminar todos los riesgos.',
8:'La jerarquía y la cultura influyen, pero no bastan por sí solas para escoger el ciclo de vida.',
13:'El retraso es un riesgo posible de la replanificación, no una consecuencia obligatoria de iterar.',
35:'La compatibilidad cultural no convierte a la jerarquía en una regla universal de selección.',
36:'Posponer detalle puede ser una decisión útil; solo es inconveniente si se necesita ese detalle antes.',
37:'La colaboración y la coubicación ayudan; un equipo virtual también puede trabajar de forma adaptativa.',
40:'Se evalúan insumos para entender alcance, no una lista exhaustiva de entradas formales de Definir el Alcance.',
58:'Las expectativas se elicitan y convierten en requisitos verificables; no se asume que una expectativa vaga basta.',
56:'La matriz fuerte se refiere a la autoridad del director del proyecto; no determina por sí misma el enfoque.',
69:'La empresa minera también podría usar componentes adaptativos si lo requieren los entregables.',
85:'Cadencia de entrega y enfoque de desarrollo son decisiones relacionadas, pero distintas.',
86:'Es posible realizar entregas parciales planificadas en un enfoque predictivo.',
94:'Escuchar no obliga a aceptar cualquier petición: las necesidades deben contrastarse con objetivos, restricciones y seguridad.',
106:'La matriz aporta evidencia; aún deben comprobarse los criterios de calidad, aceptación y preparación operativa.',
107:'La planificación predictiva puede contemplar más de una entrega.',
112:'Ventas puede recibir responsabilidades según el contexto; deben quedar claras la aceptación y la responsabilidad operativa.',
116:'Los criterios y detalles del paquete se documentan en el diccionario de la EDT; después se desarrollan sus actividades.',
123:'Scrum puede incorporar prácticas Kanban; el tablero no es exclusivo de un marco.',
132:'El cambio normativo se analiza y sigue el proceso de aprobación antes de modificar una línea base.',
135:'En la retrospectiva se mejora la forma de trabajar; el refinamiento concreto del backlog se coordina después con sus responsables.',
142:'Definition of Done expresa calidad del incremento; la aceptación del cliente y la decisión de liberación siguen su propia gobernanza.',
147:'Se consideran también requisitos no funcionales y defectos pendientes, no solo funcionalidades implementadas.',
150:'Un requisito aprobado no demuestra automáticamente que la solución satisface la necesidad real.'
}

def wrong_reason(text, info):
    t = text.casefold()
    if re.search(r'ignora|sin consultar|sin involucr|sin seguimiento|omiti|exclusivamente|únicamente|solo al final',t):
        return 'Excluye información, colaboración o controles necesarios para resolver el caso. '+info['contrast']
    if re.search(r'reduce.*participación|elimina.*necesidad|garantiza.*(completo|completamente|fijo)',t):
        return 'Atribuye una garantía o una eliminación de responsabilidades que el enfoque no proporciona. '+info['contrast']
    if re.search(r'cronograma fijo|alcance fijo|baseline fijo|línea base fija|requisitos fijos|todos los requisitos.*inicio',t) and info['topic'].startswith('D3'):
        return 'Congelar de antemano todo el detalle impide el refinamiento y la adaptación que necesita este caso. '+info['contrast']
    if re.search(r'retrospectiva',t):
        return 'La retrospectiva mejora cómo trabaja el equipo; no sustituye la decisión, la evidencia o el artefacto que pide el enunciado. '+info['contrast']
    if re.search(r'(backlog|trabajo pendiente|historias de usuario|iteraci)',t) and not info['topic'].startswith('D3'):
        return 'Propone priorización o ciclos de trabajo, que no resuelven por sí solos la necesidad concreta descrita. '+info['contrast']
    if re.search(r'(cronograma|presupuesto|costos)',t):
        return 'Se centra en plazos o presupuesto sin cubrir el criterio principal que se evalúa en esta pregunta. '+info['contrast']
    if re.search(r'(prototipo|mínimo viable)',t):
        return 'Un prototipo o MVP puede facilitar aprendizaje, pero no reemplaza la actividad o condición específica requerida en este caso. '+info['contrast']
    return info['contrast']

originals, reviewed = [], []
topics = {t['id']:t for t in json.loads((ROOT/'src/data/topics.json').read_text(encoding='utf-8'))}
for item in raw:
    n, info = item['number'], groups[item['number']]
    topic = info['topic']; assert topic in topics
    refs = ['procesos-review-'+s for s in info['refs']]
    assert all(r in source_map for r in refs)
    q = {'id':COLLECTION+'-q'+str(n).zfill(3),'collectionId':COLLECTION,'originalNumber':n,'revision':1,
        'domain':int(topic[1]),'taskId':'-'.join(topic.split('-')[:2]),'topicId':topic,
        'tags':['Grupo de Procesos','PDF aportado',topics[topic]['title']], 'type':'situacional' if item['stem'].startswith(('Un ','Una ','Durante ','En ','El ','Al ','Saliendo ','Tras ')) else 'conceptual',
        'difficulty':'avanzada' if n>=133 else 'intermedia','origin':'externa','contentOrigin':'original-pdf',
        'review':'pendiente','humanReviewed':False,'stem':item['stem'],'sourcePage':item['page'],
        'options':[{'id':k,'label':k,'text':v,'explanation':'El PDF no ofrece una explicación separada de esta alternativa; su explicación general se conserva completa.',
                    'explanationOrigin':'none','contentOrigin':'original'} for k,v in item['options'].items()],
        'correctIds':[item['key']],'choose':1,'practiceAvailable':True,
        'explanation':item['explanation'],'explanationOrigin':'original','explanationSource':'pdf-body',
        'concept':topics[topic]['title'],'confusion':info['contrast'],'refs':[{'sourceId':pdf_source['id'],'section':'Pregunta '+str(n)+', página PDF '+str(item['page'])}],
        'consultedAt':DATE,'terms':[],
        'provenance':{'author':'Documento aportado por el usuario; no se atribuye la autoría de las preguntas a PMI',
            'resource':'Grupo de Procesos Guía Práctica, p. 217 (1).pdf',
            'license':'Material aportado para estudio personal; no se atribuye una licencia de redistribución.',
            'note':'Enunciado, cuatro alternativas, clave y explicación extraídos del documento aportado. Su importación no confirma la autoría ni las citas que contiene.'},
        'grading':{'status':'material-key','keyOrigin':'material','referenceIds':[item['key']],
            'sourcePage':item['page'],'sourceText':item['key']+') '+item['options'][item['key']],
            'note':'Clave original del documento antes del contraste de esta aplicación.'},'reviewReasons':[]}
    originals.append(copy.deepcopy(q))
    q['revision'] = 2
    q['review'] = 'contrastado'
    q['documentExplanation'] = item['explanation']
    q['explanation'] = info['reason'] + (' '+notes[n] if n in notes else '')
    q['explanationOrigin'] = 'ia'
    q['explanationSource'] = 'app-ai'
    q['refs'] += [{'sourceId':r,'section':source_map[r]['section']} for r in refs]
    q['grading'].update({'status':'checked','reviewedAt':DATE,
        'note':'Clave del PDF revisada por IA con las fuentes enlazadas. No implica revisión humana ni aprobación de PMI.',
        'evidence':[{'sourceId':r,'section':source_map[r]['section'],'support':'Contraste conceptual aplicado a la pregunta '+str(n)+'.'} for r in refs]})
    if n in adaptations:
        a = adaptations[n]
        if a['stem']: q['stem'] = a['stem']
        for o in q['options']:
            if o['id'] in a['options']:
                o['text'] = a['options'][o['id']]
                o['contentOrigin'] = 'mixed'
        q['adaptation'] = {'kind':'clarified','note':a['note']}
        q['origin'] = 'adaptada'; q['contentOrigin'] = 'mixed'
        q['explanation'] += ' Revisión: '+a['note']
        if item['key'] in a['options']:
            q['grading']['keyOrigin'] = 'ia-authored'
            q['grading']['note'] = 'Respuesta elaborada por IA para la formulación corregida. La letra coincide con la del material, pero la alternativa fue corregida; el original se conserva para comparar.'
    for o in q['options']:
        o['explanationOrigin'] = 'ia'; o['sourceIds'] = refs
        o['explanation'] = ('Correcta: '+q['explanation']) if o['id']==item['key'] else 'Incorrecta: '+wrong_reason(o['text'],info)
    q['provenance']['note'] += ' Clave y razonamiento revisados por IA con fuentes primarias; no son una revisión humana. Las explicaciones de las alternativas fueron añadidas por IA.'
    reviewed.append(q)

def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
write(DATA/(COLLECTION+'-v1.json'),originals)
write(DATA/(COLLECTION+'.json'),reviewed)
write(DATA/'procesos-sources.json',all_sources)
out = ROOT/'public/collections'/COLLECTION
out.mkdir(parents=True,exist_ok=True)
shutil.copyfile(ROOT/'input/Grupo_de_Procesos_150.pdf',out/'Grupo_de_Procesos_150.pdf')
shutil.copyfile(ROOT/'input/Grupo_de_Procesos_150_TEXTO.txt',out/'Grupo_de_Procesos_150_TEXTO.txt')
original_bank = json.loads((ROOT/'src/data/questions.json').read_text(encoding='utf-8'))
exitos = json.loads((DATA/'exitos-simulador-01.json').read_text(encoding='utf-8'))
bank_sources = json.loads((ROOT/'src/data/sources.json').read_text(encoding='utf-8'))
exitos_sources = json.loads((DATA/'exitos-sources.json').read_text(encoding='utf-8'))+existing
write(ROOT/'public/downloads/capm-banco-v1.json',{'formatVersion':1,'questions':original_bank+exitos+reviewed,'sources':bank_sources+exitos_sources+all_sources})
audit = {'date':DATE,'collectionId':COLLECTION,'questions':150,'numbers':list(range(1,151)),'optionsPerQuestion':4,
    'pagesRead':96,'imageObjects':0,'pdfSha256':hashlib.sha256((ROOT/'input/Grupo_de_Procesos_150.pdf').read_bytes()).hexdigest(),
    'gradable':150,'reviewedByAI':150,'humanReviewed':False,'primarySources':len(sources),
    'adaptedQuestions':sorted(adaptations),'aiAuthoredCorrectedAnswers':[q['originalNumber'] for q in reviewed if q['grading']['keyOrigin']=='ia-authored'],
    'answerLetterChanges':[],'note':'Se corrigen formulaciones y alternativas, conservando sus letras y los originales. No se inventan cambios de letra para aparentar revisión.',
    'domains':dict(collections.Counter(q['domain'] for q in reviewed)), 'totalQuestions':len(original_bank+exitos+reviewed)}
write(ROOT/'docs/GRUPO_PROCESOS_AUDIT.json',audit)
doc = ['# Simulador 2 · Grupo de Procesos — revisión de las 150 preguntas','',
    'Fuente: PDF aportado de 96 páginas. Se conservan las preguntas 1–150, las cuatro alternativas, la clave y la explicación originales. La 21 se extrae aunque su título esté pegado al enunciado. No se añaden preguntas del anexo ni se aplican cuotas CAPM.','',
    'Las 150 claves se contrastaron por IA. Las formulaciones dudosas se precisan y se conservan los originales para comparación. Ninguna revisión se atribuye a un humano ni se presenta como una clave oficial de PMI. Las letras se conservan: las correcciones afectan la definición o el contexto de las alternativas, no se inventan cambios de letra.','',
    'La explicación original del documento se conserva completa en cada registro y se revela tras responder o finalizar. Sus citas bibliográficas no se dan por comprobadas literalmente. El razonamiento de estudio y las explicaciones de alternativas son añadidos de IA.','',
    '## Fuentes consultadas','']
for s in sources: doc.append('- ['+s['title']+']('+s['url']+') — '+s['section']+'.')
for q,old in zip(reviewed,originals):
    doc += ['', '## Pregunta '+str(q['originalNumber'])+' · página PDF '+str(q['sourcePage']),'',q['stem'],'',
        '**Clave actual: '+q['correctIds'][0]+') '+next(o['text'] for o in q['options'] if o['id'] in q['correctIds'])+'**. '+q['grading']['note'],'']
    if q.get('adaptation'): doc += ['**Ajuste:** '+q['adaptation']['note'],'','**Enunciado original:** '+old['stem'],'']
    for o in q['options']:
        doc += ['- **'+o['id']+') '+o['text']+'** — '+o['explanation']]
    doc += ['', '**Clave original conservada:** '+q['grading']['sourceText'], '',
        '**Respaldo:** '+' · '.join('['+source_map[r['sourceId']]['title']+']('+source_map[r['sourceId']]['url']+')' for r in q['refs'] if r['sourceId'] in source_map),
        '', '<details><summary>Explicación importada del PDF; citas por comprobar</summary>','',q['documentExplanation'],'','</details>']
(ROOT/'docs/REVISION_GRUPO_PROCESOS.md').write_text('\n'.join(doc)+'\n',encoding='utf-8')
print(json.dumps(audit,ensure_ascii=True))
