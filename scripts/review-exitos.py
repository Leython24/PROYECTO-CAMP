"""Reviewed answers and transparent adaptations; run after importing the supplied immutable v1."""
from pathlib import Path
import json, copy
from exitos_review_sources import SOURCES
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'src/data/collections'
original=json.loads((BASE/'exitos-simulador-01-v1.json').read_text(encoding='utf-8'))
questions=copy.deepcopy(original)
reviewed=[]
source_map={s['id']:s for s in SOURCES}

def review(n,key,reason,explanations,refs,stem=None,options=None,kind='clarified',change=None):
    q=questions[n-1];before=original[n-1]
    assert not before['correctIds'], n
    assert len(explanations)==len(q['options']) if options is None else len(explanations)==len(options),n
    if isinstance(key,str): key=key.split(',')
    ids=['exitos-review-'+id for id in refs]
    assert all(id in source_map for id in ids)
    if options is not None:
        assert len(options)==len(q['options']),n
        for o,text in zip(q['options'],options):
            if o['text']!=text: o['contentOrigin']='ia'
            o['text']=text
    if stem is not None: q['stem']=stem
    modified=q['stem']!=before['stem'] or [o['text'] for o in q['options']]!=[o['text'] for o in before['options']]
    if modified:
        assert change,n
        q['adaptation']={'kind':kind,'note':change}
        q['sourceNote']='Adaptación de estudio elaborada con IA. El original y su anexo se conservan para consulta.'
        q['contentOrigin']='ia-completed' if kind=='replacement' else 'mixed'
        q['origin']='ia' if kind=='replacement' else 'adaptada'
        if kind=='replacement':
            for o in q['options']:o['contentOrigin']='ia'
            q.pop('diagrams',None)
        q['provenance']['author']='IA · adaptación de estudio basada en el material aportado'
    for o,explanation in zip(q['options'],explanations):
        o.update(explanation=explanation,explanationOrigin='ia',sourceIds=ids)
    q['correctIds']=key
    assert len(set(key))==len(key) and all(any(o['id']==id for o in q['options']) for id in key)
    q['choose']=len(key)
    q.pop('selectionMode',None)
    q.update(revision=2,review='contrastado',humanReviewed=False,explanation=reason,
             explanationOrigin='ia',explanationSource='app-ai',confusion=reason,reviewReasons=[])
    q['grading'].update(status='checked',keyOrigin='ia-authored',reviewedAt='2026-10-22',
         note='Respuesta elaborada por IA y contrastada con las fuentes enlazadas. No se presenta como clave del PDF ni como revisión humana.',
         evidence=[{'sourceId':id,'section':source_map[id]['section'],'support':'Fundamento conceptual y descarte razonado aplicado al caso de la pregunta '+str(n)+'.'} for id in ids])
    q['refs']=[*before['refs'],*[{'sourceId':id,'section':source_map[id]['section']} for id in ids]]
    q['provenance']['note']+=' Revisión de esta aplicación: clave y explicaciones elaboradas por IA con fuentes primarias; el anexo original no se sobrescribe.'
    if modified:q['provenance']['note']+=' '+change
    reviewed.append(n)

review(2,'a','Los dominios se relacionan durante el proyecto: no son fases que deban agotarse una tras otra. Por ejemplo, planificar y gestionar interesados pueden ocurrir al mismo tiempo.',
 ['Verdadero: estas áreas de actividad pueden operar de manera concurrente; su intensidad se adapta al proyecto.','Falso supondría tratarlas como una secuencia exclusiva. El enfoque de sistemas y la planificación continua no apoyan esa lectura.'],
 ['domains','principles'])
review(3,'b','El orden de presentación no establece una escala universal de importancia. La atención necesaria depende del contexto y de las interacciones del sistema.',
 ['Incorrecta: confunde el orden editorial de los dominios con una prioridad obligatoria para todos los proyectos.','Correcta: los dominios interactúan y se adaptan; su posición en el libro no demuestra una jerarquía.'],
 ['domains','principles'])
review(7,'b','El trabajo de las personas debe generar valor para clientes, usuarios y otros interesados; afirmar que no se realiza para personas contradice ese propósito.',
 ['Incorrecta: acepta la negación de los destinatarios del valor y de los resultados.','Correcta: el equipo produce resultados para satisfacer necesidades y generar valor a los interesados.'],
 ['principles','stakeholders'])

cases={
8:('a','Una empresa ajena a la organización ejecutante suministra servidores mediante un contrato. ¿Qué rol describe su participación?',
 ['Proveedor externo','PMO de la organización ejecutante','Usuarios finales del sistema'],
 ['Correcta: suministra bienes mediante un acuerdo y pertenece a otra organización.','Incorrecta: una PMO estandariza o apoya la dirección; no se define por suministrar los servidores.','Incorrecta: los usuarios utilizan el producto; el caso describe a quien lo suministra.'],['stakeholders','vendors']),
9:('b','Un ministerio ajeno a la organización ejecutante debe emitir una autorización legal antes de poner en marcha el proyecto. ¿Cómo debe registrarse?',
 ['Como parte del equipo que construye el entregable','Como interesado externo con autoridad gubernamental','Como patrocinador interno solo por emitir la autorización'],
 ['Incorrecta: autorizar legalmente no significa ejecutar el trabajo del proyecto.','Correcta: su decisión puede condicionar el proyecto, aunque no pertenezca a la organización ejecutante.','Incorrecta: emitir una autorización no demuestra que aporte recursos o patrocine el proyecto.'],['stakeholders','lexicon']),
10:('c','La organización asigna a una persona para liderar al equipo responsable de lograr los objetivos del proyecto. ¿Qué rol se describe?',
 ['Patrocinador','PMO','Director del proyecto'],
 ['Incorrecta: el patrocinador proporciona apoyo y recursos y facilita el éxito; no es necesariamente quien lidera la ejecución diaria.','Incorrecta: la PMO es una estructura de gestión, no el cargo individual descrito.','Correcta: corresponde al responsable asignado para liderar al equipo hacia los objetivos.'],['lexicon']),
11:('a','Una oficina facilita plantillas, metodologías y prácticas comunes para varios proyectos de la organización. ¿Qué estructura realiza esta función?',
 ['Oficina de dirección de proyectos (PMO)','Equipo que ejecuta un único entregable','Cliente que utilizará el producto'],
 ['Correcta: estandarizar prácticas y facilitar herramientas son funciones habituales de una PMO.','Incorrecta: un equipo produce trabajo del proyecto; no se convierte por ello en la oficina que apoya varios proyectos.','Incorrecta: el cliente recibe o solicita resultados, no se define por gobernar metodologías internas.'],['pmo-standard']),
12:('b','Dentro del equipo del proyecto, un subconjunto de personas participa directamente en la planificación, coordinación y control de la dirección del proyecto. ¿Cómo se denomina?',
 ['Grupo de usuarios finales','Equipo de dirección del proyecto','Organismo regulador'],
 ['Incorrecta: usar el producto no implica participar en la dirección del proyecto.','Correcta: es el subconjunto directamente involucrado en actividades de dirección.','Incorrecta: un regulador establece o exige cumplimiento de reglas externas; no describe ese subconjunto.'],['lexicon']),
13:('c','Una organización contrata el desarrollo del sistema y acepta contractualmente sus entregables, aunque otros empleados lo usarán. ¿Qué rol describe a esa organización?',
 ['Organismo regulador por el solo hecho de contratar','Equipo de dirección por el solo hecho de aceptar','Cliente del proyecto'],
 ['Incorrecta: contratar y aceptar no le confiere autoridad regulatoria.','Incorrecta: aceptar el resultado no prueba que ejecute las actividades de dirección.','Correcta: solicita o adquiere el producto y participa en su aceptación; puede ser distinta de sus usuarios.'],['stakeholders']),
14:('a','Los trabajadores registrarán diariamente las operaciones en el sistema entregado, pero no negociaron su adquisición ni dirigen el proyecto. ¿Qué rol se destaca?',
 ['Usuarios finales','PMO','Proveedor del sistema'],
 ['Correcta: son quienes utilizan el producto en su trabajo cotidiano.','Incorrecta: no se les atribuye estandarizar prácticas ni apoyar la dirección de proyectos.','Incorrecta: el caso los sitúa usando el producto, no suministrándolo.'],['stakeholders','lexicon']),
15:('b','El órgano de gobierno del proyecto revisa su alineación estratégica y decide sobre asuntos escalados dentro de la autoridad que se le ha delegado. ¿Qué rol encaja mejor?',
 ['Equipo técnico que construye los entregables','Comité de dirección del proyecto','Grupo de usuarios que prueba una pantalla'],
 ['Incorrecta: construir el producto no equivale a ejercer gobierno estratégico delegado.','Correcta: un comité de dirección puede ejercer supervisión y decisiones de gobierno según el mandato definido.','Incorrecta: probar una pantalla aporta retroalimentación, pero no acredita esa autoridad de gobierno.'],['governance']),
16:('c','Una autoridad externa establece requisitos legales y puede sancionar su incumplimiento en la operación del producto. ¿Qué tipo de interesado representa?',
 ['PMO de apoyo','Proveedor contratado para fabricar el producto','Organismo regulador'],
 ['Incorrecta: la PMO de apoyo ayuda a gestionar proyectos y no recibe por ello potestad sancionadora legal.','Incorrecta: suministrar bienes no confiere autoridad legal regulatoria.','Correcta: ejerce supervisión normativa que puede afectar al proyecto y su resultado.'],['stakeholders']),
17:('a','Analistas, desarrolladores y probadores realizan el trabajo necesario para producir los entregables y alcanzar los objetivos del proyecto. ¿Qué conjunto representan?',
 ['Equipo del proyecto','Organismo regulador','Cliente que contrata el resultado'],
 ['Correcta: el conjunto que realiza el trabajo para lograr los objetivos es el equipo del proyecto.','Incorrecta: el caso describe producción del trabajo, no supervisión normativa.','Incorrecta: contratar o recibir el resultado no es la función descrita para estas personas.'],['lexicon'])
}
for n,(key,stem,options,explanations,refs) in cases.items():
    review(n,key,'El rol se determina por la función expresamente descrita en este caso; no por un círculo cuya leyenda falta.',explanations,refs,stem,options,'replacement',
           'Se sustituye el ejercicio de círculos sin leyenda por un caso equivalente sobre el mismo interesado o rol. No se asignó una clave al diagrama original.')

# Make medium/formality explicit; these are contextual examples, not universal classifications.
texts=[
 'Presentación oral formal ante el comité de dirección.',
 'Conversación espontánea y oral en un pasillo.',
 'Informe de avance escrito y aprobado según el procedimiento.',
 'Nota escrita informal para recordar una tarea a un compañero.',
 'Revisión oral del proyecto, convocada formalmente y con agenda.',
 'Discusión oral ad hoc entre compañeros, sin convocatoria formal.',
 'Documento del proyecto emitido por el procedimiento formal.',
 'Correo escrito que registra una aprobación formal según las reglas del proyecto.',
 'Reunión informativa oral, formalmente convocada.',
 'Caso de negocio escrito y aprobado por el órgano competente.',
 'Mensaje de texto informal entre compañeros.',
 'Demostración del producto en una revisión oral y visual formalmente convocada.',
 'Publicación escrita informal en la red social interna del equipo.',
 'Tormenta de ideas oral improvisada durante una conversación informal.'
]
groups=['formal-oral','informal-oral','formal-escrita','informal-escrita','formal-oral','informal-oral','formal-escrita','formal-escrita','formal-oral','formal-escrita','informal-escrita','formal-oral','informal-escrita','informal-oral']
for n,target in [(27,'formal-oral'),(28,'formal-escrita'),(29,'informal-oral'),(30,'informal-escrita')]:
    q=questions[n-1]
    labels=[o['id'] for o in q['options']]
    keys=[labels[i] for i,g in enumerate(groups) if g==target]
    target_words=target.replace('-',' y ')
    exps=[]
    for i,g in enumerate(groups):
        right=g==target
        exps.append(('Correcta: ' if right else 'Incorrecta para esta categoría: ')+
                    'el ejemplo es '+g.replace('-',' y ')+
                    (' según el uso descrito.' if right else ', mientras que se solicita comunicación '+target_words+'.'))
    review(n,keys,'La clasificación usa dos ejes: medio oral/escrito y tratamiento formal/informal. El uso concreto está indicado en cada ejemplo; un correo o una reunión no tienen una formalidad universal.',
           exps,['communication','feedback'],
           'Según el uso concreto descrito en cada alternativa de este proyecto, selecciona todas las comunicaciones de tipo '+target_words+'.',
           texts,change='Se precisa el contexto de cada alternativa para evitar clasificar un medio de comunicación de forma universal. Se conservan las letras de las alternativas, incluidas o–bb en la pregunta 30.')
review(34,'d','La retroalimentación permite comprobar recepción y comprensión, explorar acuerdo o desacuerdo y aclarar interpretaciones no deseadas. Detectar y aclarar es distinto de rechazar sin escuchar.',
 ['Es una función válida, pero solo cubre recepción y comprensión.','Es una función válida, pero por sí sola no cubre todos los usos de la retroalimentación.','Es una función válida: las interpretaciones deben detectarse y aclararse; no rechazarse automáticamente.','Correcta: reúne las tres funciones complementarias del ciclo de retroalimentación.'],
 ['channels','feedback'],
 stem='¿Qué puede aportar un ciclo de retroalimentación al comunicar información del proyecto?',
 options=['Comprobar hasta qué punto el destinatario recibió y comprendió el mensaje.','Determinar si los interesados están de acuerdo o en desacuerdo con el mensaje.','Detectar y aclarar interpretaciones no intencionadas que haya percibido el destinatario.','Todas las anteriores.'],
 change='Se sustituye «rechazar los mensajes» por «detectar y aclarar interpretaciones» y se completa la pregunta.')
review(41,'b','La facilitación es una actividad que puede distribuirse por acuerdo del equipo. Esto no elimina ni obliga a rotar las responsabilidades formales de cargos como Scrum Master.',
 ['Incorrecta: atribuye rigidez permanente a una actividad que el equipo puede organizar de forma distribuida.','Correcta: facilitar colaboración no exige que una misma persona realice siempre esa actividad.'],
 ['principles','power-skills','scrum'],
 stem='En un equipo con facilitación distribuida, la actividad de facilitar conversaciones debe quedar permanentemente en una sola persona y nunca puede rotar por acuerdo del equipo. La afirmación trata de la actividad, no de sustituir las responsabilidades formales de Scrum Master.',
 change='Se distingue la actividad de facilitar de las responsabilidades formales de un cargo, para evitar inferir una rotación obligatoria de Scrum Master.')
review(48,'c','La secuencia está impuesta por una obligación del contrato. Como ambas actividades pertenecen al proyecto, esa obligación no demuestra una dependencia con trabajo externo.',
 ['Incorrecta: una desviación del alcance es un cambio en el trabajo definido, no el tipo de relación entre actividades.','Incorrecta: «dependencia de las partes interesadas» no clasifica la obligatoriedad de esa secuencia.','Correcta: la secuencia se exige contractualmente, en lugar de ser una preferencia del equipo.','Incorrecta en este caso: se indica expresamente que no interviene una actividad externa al proyecto.'],
 ['dependencies','schedule'],
 stem='El contrato exige terminar la prueba A antes de iniciar la instalación B. Ambas son actividades internas del proyecto y no interviene ningún trabajo externo. Al clasificar la secuencia por su obligatoriedad, ¿qué dependencia describe el caso?',
 change='Se explicita la secuencia contractual y la ausencia de una actividad externa. La clave d del anexo queda archivada; la respuesta c es elaborada por IA.')
review(50,'b','La contingencia se vincula a riesgos identificados y sus respuestas previstas. La reserva de gestión cubre incertidumbre no identificada conforme a la gobernanza aplicable.',
 ['Incorrecta: corresponde a la reserva de gestión y no al riesgo identificado descrito.','Correcta: asigna fondos de contingencia a respuestas para riesgos ya identificados.','Incorrecta: el margen de un proveedor no sustituye la reserva del proyecto.','Incorrecta: reducir requisitos cambia el producto y no crea una reserva para riesgos.'],
 ['reserve'])
review(53,'b','El medio de comunicación debe responder a los destinatarios y al propósito; una conversación o una nota puede ser apropiada sin tecnología avanzada.',
 ['Incorrecta: «necesariamente» convierte una posible ayuda tecnológica en una condición universal.','Correcta: la eficacia depende de la adecuación del medio, la comprensión y la retroalimentación.'],
 ['communication','channels'])
review(60,'b','Planificar no es una tarea aislada al comienzo: se organiza y coordina trabajo a medida que evoluciona la información disponible.',
 ['Incorrecta: la planificación no se limita exclusivamente al inicio.','Correcta: combina preparación inicial y ajustes posteriores al contexto.','Incorrecta: el trabajo y la medición pueden requerir cambios en los planes.','Incorrecta: las decisiones de planificación sí condicionan resultados y valor.'],
 ['domains'])
review(61,'d','Las revisiones de hitos, las comparaciones con el plan y la satisfacción del cliente aportan evidencias complementarias. Ninguna de ellas reemplaza por sí sola la evaluación completa de resultados.',
 ['Es un mecanismo válido para comprobar resultados parciales, pero no el conjunto completo.','Es un mecanismo válido para evaluar satisfacción al final, aunque no sustituye el seguimiento durante el proyecto.','Es un mecanismo válido para comparar desempeño con lo aprobado, pero no mide por sí solo toda la satisfacción.','Correcta: combina las verificaciones complementarias enumeradas.'],
 ['metrics','principles'],
 stem='¿Qué conjunto de verificaciones puede aportar información complementaria para evaluar el avance y los resultados del proyecto frente a sus objetivos?',
 change='Se precisa que se buscan verificaciones complementarias y no un único procedimiento universal atribuido al PMBOK.')
review(62,'c','La descripción combina establecer procesos, gestionar recursos y sostener las operaciones del proyecto. En el resumen oficial de PMBOK 7 corresponde a Trabajo del Proyecto.',
 ['Incorrecta: Enfoque y Ciclo de Vida se centra en desarrollo, cadencia y fases.','Incorrecta para esta descripción: Interesados se centra en su involucramiento, aunque también requiere comunicación.','Correcta: Trabajo del Proyecto abarca procesos, recursos, adquisiciones y comunicaciones operativas.','Incorrecta: Entrega se centra en alcance, calidad y resultados que se producirán.'],
 ['domains'],
 stem='En PMBOK 7, ¿qué dominio incluye establecer los procesos de trabajo, gestionar recursos físicos y adquisiciones y sostener las comunicaciones operativas necesarias para que el proyecto funcione?',
 change='Se incorpora el conjunto de funciones que identifica Trabajo del Proyecto, evitando la superposición de una referencia aislada a comunicación.')
review(68,'b','Cada par de personas define un canal potencial. N(N−1)/2 es una función cuadrática: con 5 personas hay 10 canales y con 6 hay 15.',
 ['Incorrecta: trata de desempeño del trabajo y valor; no cuenta pares de personas.','Correcta: el término N² explica el crecimiento cuadrático de canales potenciales.','Incorrecta: la fórmula no mide cuántos interesados apoyan el proyecto.','Incorrecta: una nueva persona puede añadir un canal con cada una de las N personas anteriores, no siempre uno.'],
 ['channels'])
review(69,'a','La logística de recursos físicos necesita coordinar las necesidades de suministro con la ejecución. La estrategia general no reemplaza especificar qué se requiere y dónde y cuándo estará disponible.',
 ['Correcta: identifica el suministro y su coordinación con el trabajo.','Incorrecta: una estrategia sin necesidades concretas de materiales no resuelve la logística del proyecto.','Incorrecta: la identidad corporativa no especifica suministros ni entregas.','Incorrecta: las reuniones pueden coordinar, pero su calendario no constituye por sí solo el plan de suministro.'],
 ['logistics','domains'],
 stem='Al organizar la logística de recursos físicos del proyecto, ¿qué información concreta debe coordinar el plan de suministro?',
 options=['Qué materiales se necesitan, sus especificaciones y cantidades, y cuándo y dónde deben entregarse.','Solo la estrategia general de la empresa, sin información sobre materiales.','Solo la visión y la imagen corporativa.','Únicamente la misión de la organización y el calendario de reuniones.'],
 kind='replacement',change='Se reemplaza el fragmento de palabras incompletas por un caso equivalente sobre la información necesaria para coordinar recursos físicos.')
review(70,'c','Una relación colaborativa permite cocrear y coordinar necesidades con los proveedores sin eliminar controles, criterios de evaluación ni acuerdos.',
 ['Incorrecta: excluir todo contrato puede impedir obtener capacidades necesarias.','Incorrecta: el costo no es el único criterio de idoneidad del proveedor.','Correcta: la colaboración favorece entendimiento y coordinación de los compromisos.','Incorrecta: disminuir documentación sin atender obligaciones puede elevar el riesgo contractual.'],
 ['vendors'])
review(77,'b','Las lecciones documentadas deben revisarse y ponerse a disposición de quienes puedan reutilizarlas; un repositorio accesible apoya esa difusión.',
 ['Incorrecta: guardar solo decisiones finales elimina contexto y aprendizajes importantes.','Correcta entre las opciones: permite almacenar y recuperar lecciones; también requiere revisión y uso activo.','Incorrecta: compartir solo al final retrasa la mejora y reutilización durante el proyecto.','Incorrecta: consultar únicamente tras problemas excluye aprendizaje preventivo.'],
 ['lessons'])
review(78,'b','La experiencia tácita se comparte principalmente mediante interacción y trabajo conjunto. Escribir ayuda a convertir parte de esa experiencia en conocimiento explícito, pero no la reemplaza completamente.',
 ['Incorrecta como mejor respuesta: documentar procedimientos se concentra en conocimiento explícito.','Correcta: las sesiones interactivas permiten compartir práctica, experiencia y contexto.','Incorrecta: publicar políticas formaliza información, pero no es el mecanismo más directo para el conocimiento tácito.','Incorrecta: limitar la conversación puede impedir transmitir experiencia relevante.'],
 ['tacit'])
review(84,'c','La combinación coherente es I-ii, II-iv, III-iii, IV-i y V-v: calidad, terminado, requisito, descomposición del trabajo y costo de la calidad son conceptos distintos.',
 ['Incorrecta: asigna a calidad una descomposición del trabajo y a DoD una definición general de calidad.','Incorrecta: intercambia las descripciones de calidad y requisito.','Correcta: todas las correspondencias conservan el significado de los cinco términos.','Incorrecta: asigna EDT a DoD y costos de calidad a la EDT, entre otras confusiones.'],
 ['lexicon','scrum','coq'])
review(85,'b','El foco explícito está en las relaciones, expectativas y satisfacción de los interesados. En el resumen de PMBOK 7 esa función se identifica con el dominio de Interesados.',
 ['Incorrecta: Enfoque y Ciclo de Vida determina cómo desarrollar y con qué cadencia, no es el foco de las relaciones descritas.','Correcta: el involucramiento de interesados atiende sus relaciones, expectativas y satisfacción.','Incorrecta como dominio focal: Trabajo del Proyecto coordina procesos y recursos para ejecutar.','Incorrecta como dominio focal: Entrega se centra en alcance, calidad y resultados; no convierte todo el involucramiento en ese dominio.'],
 ['domains','principles'],
 stem='En PMBOK 7, ¿qué dominio tiene como foco gestionar las relaciones y el involucramiento con los interesados, alinear sus expectativas y favorecer su satisfacción con los resultados?',
 change='Se precisa el foco en relaciones e involucramiento. La opción a marcada en el anexo se conserva como referencia histórica y no se reutiliza como clave.')
review(91,'c','La elaboración progresiva refina el detalle conforme se aprende. No autoriza cambiar objetivos o líneas base sin la evaluación y gobernanza necesarias.',
 ['Incorrecta: cambiar objetivos sin evaluación no define una elaboración progresiva del plan.','Incorrecta: eliminar criterios de aceptación reduce la claridad del resultado.','Correcta: el plan gana detalle y precisión con información nueva.','Incorrecta: automatizar no elimina la incertidumbre ni la necesidad de revisar decisiones.'],
 ['lexicon','schedule'],
 stem='¿Qué describe mejor la elaboración progresiva de la planificación cuando aparece nueva información?',
 options=['Cambiar los objetivos sin evaluar ni autorizar sus impactos.','Eliminar los criterios de aceptación para no tener que revisarlos.','Refinar gradualmente el detalle del plan y las estimaciones a medida que se obtiene información más precisa.','Fijar automáticamente y de forma definitiva todos los objetivos al inicio.'],
 kind='replacement',change='Se reemplaza la expresión ambigua «objetivos móviles de finalización» por el concepto definido de elaboración progresiva, manteniendo el objetivo de estudiar planificación evolutiva.')
review(92,'a','En Scrum se inspeccionan necesidades y se refina el Product Backlog. El Product Owner responde por su gestión efectiva y el trabajo sigue cumpliendo la Definición de Terminado.',
 ['Correcta: permite adaptar necesidades con transparencia y ordenación del Product Backlog.','Incorrecta: incorporar trabajo sin visibilidad impide gestionar prioridades y alcance.','Incorrecta: rechazar toda retroalimentación contradice la adaptación del producto.','Incorrecta: declarar terminado lo que no cumple la DoD oculta trabajo incompleto.'],
 ['scrum','agile'],
 stem='En un proyecto con Scrum, la retroalimentación del mercado muestra nuevas necesidades del producto. ¿Qué acción permite gestionarlas de forma transparente?',
 options=['Revisar las necesidades con el Product Owner y refinar y ordenar el Product Backlog.','Añadir trabajo de forma oculta, sin modificar ni ordenar el Product Backlog.','Rechazar siempre cualquier necesidad nueva porque el plan inicial es inmutable.','Declarar terminados los incrementos aunque no cumplan la Definición de Terminado.'],
 kind='replacement',change='Se reemplaza una pregunta con términos solapados sobre cambios de alcance por un caso equivalente de gestión adaptativa de necesidades, respaldado por Scrum Guide.')
review(96,'a','La prevención busca evitar problemas de calidad antes de producirlos. La evaluación comprueba conformidad mediante medición, inspección o auditoría; reparar una falla es otra categoría.',
 ['Correcta: capacitar para evitar defectos es prevención; inspeccionar el entregable es evaluación.','Incorrecta: reparar defectos es costo de falla, y capacitación es prevención, no evaluación.','Incorrecta: una reclamación de cliente es falla externa; planificar calidad es prevención.','Incorrecta: las categorías son diferentes; no toda actividad pertenece simultáneamente a prevención y evaluación.'],
 ['coq'],
 stem='En el costo de la calidad, ¿qué pareja corresponde, respectivamente, a prevención y evaluación?',
 options=['Capacitar al personal para evitar defectos e inspeccionar el entregable contra sus especificaciones.','Reparar defectos encontrados y capacitar al personal.','Pagar una reclamación del cliente y elaborar el plan de calidad.','Todas las actividades anteriores pertenecen simultáneamente a prevención y evaluación.'],
 kind='replacement',change='Se sustituye la clasificación ambigua del original por una comparación explícita entre prevención, evaluación y fallas; la clave d del anexo no se traslada al ejercicio corregido.')
review(98,'d','El gráfico proporciona un supuesto de costo creciente del cambio. Evaluar temprano el valor y los impactos permite decidir mediante el control acordado; sus multiplicadores no son universales.',
 ['Incorrecta: una prohibición absoluta ignora posibles beneficios y necesidades legítimas.','Incorrecta: contradice el supuesto de costo creciente mostrado en la figura.','Incorrecta: esperar a producción puede aumentar retrabajo y costo en el escenario.','Correcta: evalúa beneficios, costo, riesgo e impactos antes de seguir el proceso de decisión.'],
 ['principles','errata6'])
review(115,'a','VAC = BAC − EAC. Un resultado negativo pronostica sobrecosto; uno positivo indica gasto previsto inferior al presupuesto al terminar.',
 ['Correcta: resta el costo final estimado del presupuesto aprobado para la conclusión.','Incorrecta: invierte el signo de la variación a la conclusión.','Incorrecta: EV − AC calcula la variación de costo actual, CV.','Incorrecta: BAC / EAC es una razón sin unidades monetarias, no una variación monetaria.'],
 ['evm'])
review(116,'a','Comparar directamente las fechas reales de inicio y finalización con las fechas aprobadas permite observar desviaciones del cronograma.',
 ['Correcta: compara fechas reales y planificadas de la misma actividad.','Incorrecta para lo solicitado: mide aceptación de características, no una comparación directa de fechas.','Incorrecta para lo solicitado: compara costos y no fechas de inicio y finalización.','Incorrecta: la satisfacción puede aportar información de valor, pero no calcula desviaciones de fechas.'],
 ['metrics','schedule'],
 stem='¿Qué opción compara directamente las fechas de inicio y finalización de una actividad con su línea base de cronograma?',
 options=['Comparar las fechas reales de inicio y finalización con las fechas planificadas.','Seguir las tasas de aceptación de características del producto.','Comparar el costo real con el costo planificado.','Evaluar únicamente la satisfacción de los interesados, sin comparar fechas.'],
 change='Se limita la pregunta a una comparación directa de fechas; en el original varias alternativas eran medidas de desempeño válidas.')
review(118,'a','Una métrica específica define con claridad qué se mide. Esto no sustituye sus demás atributos, como ser medible, pertinente o tener un horizonte temporal.',
 ['Correcta: expresa el atributo de especificidad de la métrica.','Incorrecta: negaría la claridad de objeto que se pretende con «específica».'],
 ['metrics'],
 stem='En una métrica efectiva, «específica» significa que está claramente definido qué se mide.',
 change='Se completa la afirmación truncada para que pueda responderse como verdadera o falsa.')
review(119,'a','En process cycle efficiency, el denominador es el tiempo total de recorrido: incluye tiempo con valor añadido y sin valor añadido. No debe confundirse con una razón que use únicamente el desperdicio.',
 ['Correcta: usa todo el tiempo de recorrido del proceso como denominador.','Incorrecta: dividir el tiempo de valor añadido por sí mismo daría siempre uno.','Incorrecta: «intermedias» no define todo el tiempo transcurrido del proceso.','Incorrecta: la ruta crítica es un concepto de cronograma del proyecto, no el denominador de esta métrica de flujo.'],
 ['efficiency'],
 stem='La eficiencia de ciclo del proceso (process cycle efficiency) se calcula como tiempo de valor añadido dividido entre:',
 options=['El tiempo total de recorrido del proceso, que incluye tiempo con valor y sin valor añadido.','Solo el tiempo de las actividades de valor añadido.','Solo el tiempo de las actividades llamadas intermedias.','Exclusivamente la duración de las actividades de la ruta crítica.'],
 kind='replacement',change='Se especifica la métrica de flujo y su denominador total; no se conserva como fórmula la razón imprecisa del original.')
review(122,'c','Las interacciones de múltiples componentes pueden generar un comportamiento difícil de anticipar: eso describe complejidad, no certeza ni ausencia de interesados.',
 ['Incorrecta: la certeza absoluta es opuesta a la incertidumbre del caso.','Incorrecta: no tener interesados no define el comportamiento de elementos interconectados.','Correcta: la complejidad considera interdependencias y efectos difíciles de predecir.','Incorrecta: la incertidumbre requiere adaptar la planificación, no eliminarla.'],
 ['complexity'])
review(123,'d','La incertidumbre puede tener efectos positivos y negativos. El riesgo de proyecto contempla ambos signos respecto a los objetivos.',
 ['Incorrecta: limita indebidamente la incertidumbre a oportunidades y el riesgo a amenazas.','Incorrecta: los riesgos pueden ser identificados y analizados antes de ocurrir.','Incorrecta: incertidumbre y riesgo están relacionados, no son conceptos aislados.','Correcta: reconoce tanto oportunidades como amenazas derivadas de la incertidumbre.'],
 ['lexicon','risk-positive'])
review(130,'b','Aceptar una oportunidad permite aprovecharla si ocurre, sin realizar una acción proactiva destinada a asegurar o incrementar su ocurrencia.',
 ['Incorrecta: asegurar que ocurra corresponde a explotar.','Correcta: reconoce la posibilidad sin perseguirla activamente.','Incorrecta: aumentar probabilidad o impacto corresponde a mejorar.','Incorrecta: involucrar un tercero para capturar beneficios corresponde a compartir cuando existe ese acuerdo.'],
 ['risk-process'])
review(131,'a','El caso ya confirma viabilidad, autorización y un descuento garantizado mediante la compra anticipada. Actuar para asegurar el beneficio corresponde a explotar la oportunidad.',
 ['Correcta: ejecuta la acción viable y autorizada que asegura el descuento.','Incorrecta en este caso: ya existe autoridad suficiente; escalar no es necesario para capturar el beneficio descrito.','Incorrecta como estrategia de compartir: coordinar con compras no equivale a compartir beneficios y riesgo con un tercero.','Incorrecta como mejor estrategia aquí: comparar ofertas no asegura el descuento ya viable y autorizado y puede perder el plazo.'],
 ['opportunities','risk-positive'],
 stem='Un proveedor garantiza un descuento si se compra el acero antes de fin de trimestre. El equipo ya comprobó que la compra es viable, necesaria y está dentro de la autoridad y del presupuesto aprobados. ¿Qué acción asegura capturar esta oportunidad?',
 change='Se añaden las condiciones de viabilidad y autoridad que faltaban para diferenciar explotar de escalar o seguir analizando.')
review(132,'d','Si el equipo decide no adoptar una respuesta proactiva y registra y vigila la amenaza, está aceptándola. No significa dejar de reconocer ni monitorear el riesgo.',
 ['Incorrecta: evitar cambia el enfoque para eliminar la amenaza o proteger de ella el objetivo.','Incorrecta: transferir asigna a un tercero parte de la responsabilidad sobre sus consecuencias.','Incorrecta: mitigar requiere medidas para reducir probabilidad o impacto.','Correcta: aceptar reconoce y monitorea la amenaza sin medidas proactivas de reducción.'],
 ['risk-process','opportunities'],
 stem='La respuesta proactiva a una amenaza de bajo impacto costaría más que su beneficio esperado. El equipo decide registrarla y vigilarla, sin reducir activamente su probabilidad o impacto. ¿Qué estrategia aplica?',
 options=['Evitar.','Transferir.','Mitigar.','Aceptar.'],
 kind='replacement',change='Se reemplaza la opción que mezclaba aceptar y «todas las anteriores» por un escenario que permite elegir una única estrategia.')
review(135,'a','Los riesgos cambian durante la ejecución. Se revisan con una cadencia adecuada al contexto y ante nueva información, sin imponer una frecuencia universal para todos los proyectos.',
 ['Correcta: combina revisión planificada y reacción a cambios relevantes.','Incorrecta: una frecuencia trimestral rígida puede ignorar cambios urgentes o necesidades del contexto.','Incorrecta: una reunión diaria puede ayudar a detectar riesgos, pero no elimina la necesidad de gestionarlos.','Incorrecta: esperar al final impide responder durante la ejecución.'],
 ['risk-process'],
 stem='¿Qué enfoque permite seguir identificando amenazas y oportunidades durante el desarrollo del proyecto?',
 options=['Revisar periódicamente riesgos y supuestos con el equipo, según la cadencia acordada y ante cambios relevantes.','Revisar riesgos únicamente cada tres meses, aunque aparezca nueva información antes.','Suponer que una reunión diaria elimina por sí sola todos los riesgos.','Esperar al cierre para identificar los riesgos que surgieron durante el proyecto.'],
 kind='replacement',change='Se elimina la suposición de que una frecuencia mensual sea universalmente correcta y se pregunta por una gestión continua ajustada al contexto.')
review(137,'d','La adaptación incorpora nueva información en las prioridades y planes. Planificar de forma predictiva no elimina los riesgos y las reservas no sustituyen el aprendizaje.',
 ['Incorrecta: definir alcance por adelantado no elimina la incertidumbre.','Incorrecta: sustituir aprendizaje por reservas impide adaptar las decisiones sobre requisitos.','Incorrecta: impone una única respuesta, sin considerar enfoque ni contexto.','Correcta: combina revisión de prioridades con herramientas de riesgo que pueden ser pertinentes en distintos enfoques.'],
 ['agile','domains','reserve'])
review(138,'c','Investigar alternativas al principio permite aprender y comparar soluciones antes de comprometer decisiones difíciles de cambiar.',
 ['Incorrecta como primera medida del caso: el detalle económico no sustituye explorar qué soluciones son posibles.','Incorrecta: contratar construcción antes de explorar diseños puede fijar compromisos prematuros.','Correcta: compara alternativas de diseño y aporta información para reducir incertidumbre.','Incorrecta: detallar fechas no resuelve por sí solo la incertidumbre de diseño.'],
 ['lexicon','principles'])
review(139,'a','Más interesados y organizaciones implican más relaciones e interdependencias posibles. Son una dimensión de complejidad, no necesariamente una oportunidad, amenaza o cambio frecuente.',
 ['Correcta: el número de partes y sus interacciones pueden aumentar la complejidad organizacional.','Incorrecta: una oportunidad es un posible efecto favorable sobre objetivos, no una medida del número de relaciones.','Incorrecta: una amenaza es un posible efecto desfavorable, no la condición estructural descrita.','Incorrecta: volatilidad destaca cambios frecuentes o inesperados, no simplemente más organizaciones.'],
 ['complexity'])
review(145,'d','El trabajo próximo puede detallarse con información suficiente; el más lejano se mantiene a mayor nivel y se refina después. No se promete precisión inmutable para todo el proyecto.',
 ['Incorrecta: exigir un alcance total definido antes de estimar impide planificación progresiva.','Incorrecta: mantener todo el detalle invariable desconoce el aprendizaje y la incertidumbre.','Incorrecta: la adaptación no prohíbe estimar con detalle cuando resulta útil.','Correcta: especifica detalle para el corto plazo y refinamiento justo a tiempo.'],
 ['schedule','scrum'],
 stem='Al planificar un proyecto ágil se solicita el mismo nivel de estimación detallada para todo el trabajo futuro. ¿Qué respuesta aplica planificación progresiva?',
 options=[original[144]['options'][0]['text'],'Las estimaciones detalladas de todo el proyecto deben mantenerse invariables una vez aprobadas.',original[144]['options'][2]['text'],original[144]['options'][3]['text']],
 change='Se precisa que se discute el nivel de detalle del trabajo futuro y se elimina el distractor b que también era válido en el original.')
review(146,'a','La taxonomía distingue componentes del plan para la dirección y documentos del proyecto. El plan de gestión de recursos pertenece al primer grupo; los registros de las otras alternativas pertenecen al segundo.',
 ['Correcta: el plan de gestión de recursos es un componente del plan para la dirección.','Incorrecta para lo solicitado: el registro de interesados sí figura como documento del proyecto.','Incorrecta para lo solicitado: el registro de lecciones aprendidas es un documento del proyecto.','Incorrecta para lo solicitado: el registro de cambios es un documento del proyecto.'],
 ['errata6'],
 stem='Según la tabla 1-2 del PMBOK, sexta edición, ¿cuál de estos elementos es un componente del plan para la dirección, en vez de clasificarse como «documento del proyecto»?',
 change='Se precisa la distinción de categorías de la tabla 1-2; no se afirma que un componente del plan sea ajeno a la gestión de comunicaciones.')
review(147,'b','Los responsables de los departamentos que aportan y reciben el software pueden afectar al proyecto y verse afectados por él. Interesados es la categoría común que no exige atribuirles un cargo no indicado.',
 ['Incorrecta: no se establece que ambos proporcionen patrocinio o recursos con responsabilidad de habilitar el éxito.','Correcta: sus funciones los vinculan a decisiones y efectos del proyecto.','Incorrecta: el caso no dice que ambos lideren el proyecto.','Incorrecta como categoría común más segura: el área receptora puede actuar como cliente, pero eso no se acredita para ambos.'],
 ['lexicon','stakeholders'])
review(148,'b','El liderazgo servicial prioriza el desarrollo, la autonomía y el bienestar de las personas para ayudarlas a realizar el trabajo.',
 ['Incorrecta: dejar actuar sin apoyo no describe el acompañamiento al crecimiento que se indica.','Correcta: coincide con el foco en crecimiento y bienestar del liderazgo de servicio.','Incorrecta: «interaccional» no identifica por sí solo el enfoque de servicio descrito.','Incorrecta: lo transaccional se centra en intercambios y recompensas, no en el foco de desarrollo presentado.'],
 ['power-skills'])
review(149,'d','Una PMO de control apoya y exige cumplimiento con control moderado. La gestión directa de proyectos es la característica que la referencia asigna a una PMO directiva.',
 ['Incorrecta como afirmación que se busca descartar: proporcionar apoyo sí puede formar parte de una PMO de control.','Incorrecta como afirmación a descartar: el control moderado corresponde a esta categoría.','Incorrecta como afirmación a descartar: requerir cumplimiento es una función característica.','Correcta como excepción: gestionar directamente proyectos caracteriza la PMO directiva.'],
 ['pmo-standard'])
review(150,'a','La figura 4-10 de la errata oficial sitúa los informes de desempeño del trabajo como resultado de Monitorear y Controlar el Trabajo del Proyecto. Su distribución posterior no cambia el proceso que los produce.',
 ['Correcta: integra información de desempeño y produce los informes consolidados indicados.','Incorrecta: gestiona el intercambio y distribución de comunicaciones, pero no es el proceso señalado por esa figura como productor de esos informes.','Incorrecta: autoriza el proyecto y no consolida su desempeño durante la ejecución.','Incorrecta: planifica recursos; no produce esos informes consolidados de ejecución.'],
 ['errata6'],
 stem='Según la figura 4-10 del PMBOK, sexta edición, ¿qué proceso produce los informes de desempeño del trabajo que después pueden comunicarse a los interesados?',
 options=['Monitorear y Controlar el Trabajo del Proyecto.','Gestionar las Comunicaciones.','Desarrollar el Acta de Constitución del Proyecto.','Planificar la Gestión de los Recursos.'],
 kind='replacement',change='Se sustituye la referencia imprecisa a «informes del proyecto» por un ejercicio equivalente sobre el origen de los informes de desempeño, comprobable en una figura oficial.')

expected={q['originalNumber'] for q in original if not q['correctIds']}
assert set(reviewed)==expected and len(reviewed)==55,sorted(expected-set(reviewed))
assert len(questions)==150 and all(q['correctIds'] for q in questions)
for q,prior in zip(questions,original):
    if q['originalNumber'] not in expected:assert q==prior
for q in questions:
    assert len(q['correctIds'])==q['choose']
    assert all(any(o['id']==id for o in q['options']) for id in q['correctIds'])
(BASE/'exitos-simulador-01.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
source_base=[s for s in json.loads((BASE/'exitos-sources.json').read_text(encoding='utf-8')) if not s['id'].startswith('exitos-review-')]
(BASE/'exitos-review-sources.json').write_text(json.dumps(SOURCES,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
all_sources=json.loads((ROOT/'src/data/sources.json').read_text(encoding='utf-8'))+source_base+SOURCES
all_questions=json.loads((ROOT/'src/data/questions.json').read_text(encoding='utf-8'))+questions
if (BASE/'grupo-procesos-simulador-02.json').exists():
    all_questions += json.loads((BASE/'grupo-procesos-simulador-02.json').read_text(encoding='utf-8'))
    all_sources += json.loads((BASE/'procesos-sources.json').read_text(encoding='utf-8'))
(ROOT/'public/downloads/capm-banco-v1.json').write_text(json.dumps({'formatVersion':1,'questions':all_questions,'sources':all_sources},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
summary={'date':'2026-10-22','reviewed':sorted(reviewed),'count':55,'totalQuestions':150,'gradable':150,
         'aiAuthoredAnswers':55,'materialKeysStillUnverified':95,'primarySources':len(SOURCES),
         'adapted':[q['originalNumber'] for q in questions if q.get('adaptation')],
         'replaced':[q['originalNumber'] for q in questions if q.get('adaptation',{}).get('kind')=='replacement'],
         'originalSource':'src/data/collections/exitos-simulador-01-v1.json',
         'humanReviewed':False,
         'legacyAttempts':'La versión 1 conserva 95 calificables y 55 sin calificación; los nuevos intentos usan versiones registradas por pregunta.'}
(ROOT/'docs/REVISION_55_AUDIT.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=['# Revisión de las 55 preguntas de Éxitos','',
       'Las 55 claves de esta revisión son **respuestas elaboradas por IA**, contrastadas con fuentes primarias. No se presentan como claves oficiales del PDF, aprobación de PMI ni revisión humana. Las 95 preguntas ya corregibles mantienen su clave del material sin una nueva validación conceptual.',
       '',
       'Se conservan numeración e IDs y se archiva el texto íntegro anterior. Los intentos anteriores usan sus preguntas y claves previas; un intento nuevo registra la revisión utilizada.',
       '']
for n in sorted(reviewed):
    q=questions[n-1]
    lines+=['## Pregunta '+str(n),'',q['stem'],'',
            '**Respuesta elaborada por IA:** '+', '.join(id+') '+next(o['text'] for o in q['options'] if o['id']==id) for id in q['correctIds']), '',q['explanation'],'']
    if q.get('adaptation'):lines+=['**Cambio:** '+q['adaptation']['note'],'']
    lines+=['| Alternativa | Evaluación | Explicación |','|---|---|---|']
    for o in q['options']:
        lines.append('| '+o['id']+') '+o['text'].replace('|','/')+' | '+('Correcta' if o['id'] in q['correctIds'] else 'Incorrecta para lo solicitado')+' | '+o['explanation'].replace('|','/')+' |')
    lines+=['','**Fuentes de respaldo:**']
    for e in q['grading']['evidence']:
        s=source_map[e['sourceId']]
        lines+=['- ['+s['title']+']('+s['url']+') — '+e['section']+'.']
    lines+=['','**Anexo original, sin sobrescribir:** '+q['grading']['sourceText'],'']
(ROOT/'docs/REVISION_55_PREGUNTAS.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=True))

