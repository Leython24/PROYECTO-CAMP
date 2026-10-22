from pathlib import Path
import zipfile, hashlib, json
root=Path(__file__).resolve().parent.parent
archive=root.parent.parent/'outputs'/'CAPM_Centro_Estudio_Leython.zip'
files=['src/App.tsx','src/styles.css','src/types.ts','src/data/domains.json','src/data/tasks.json','src/data/topics.json','src/data/questions.json','src/data/sources.json','src/engine/exam.ts','src/engine/practice.ts','src/engine/persistence.ts','src/engine/validation.ts']
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name in files:
        original=z.read('CAPM_Centro_Estudio_Leython/'+name)
        assert original==(root/name).read_bytes(), 'Diferencia: '+name
        print(name+': SHA-256 '+hashlib.sha256(original).hexdigest())
print(json.dumps({'reutilizacion':'12 archivos fuente idénticos al ZIP; adaptación separada en preview/','preguntas':len(json.loads((root/'src/data/questions.json').read_text(encoding='utf8'))),'fuentes':len(json.loads((root/'src/data/sources.json').read_text(encoding='utf8')))},ensure_ascii=False))
