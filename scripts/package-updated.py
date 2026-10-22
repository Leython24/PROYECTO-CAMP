"""Create the complete VS Code project ZIP, excluding dependencies, caches and QA profiles."""
from pathlib import Path
import os, json, zipfile, hashlib

project=Path(__file__).resolve().parent.parent
output=project.parent/'outputs/CAPM_Centro_Estudio_Leython_Actualizado.zip'
output.parent.mkdir(parents=True,exist_ok=True)
excluded={'node_modules','.npm-cache','artifacts','.git','.openai','__pycache__'}
files=[]
for directory,folders,names in os.walk(project):
    folders[:]=[name for name in folders if name not in excluded]
    for name in names:
        file=Path(directory)/name
        if file.is_symlink() or name.endswith(('.log','.tsbuildinfo','.pyc','.zip')): continue
        if not file.resolve().is_relative_to(project): raise RuntimeError('Path outside project')
        files.append(file)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for file in sorted(files):
        archive.write(file,str(Path(project.name)/file.relative_to(project)))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    names=set(archive.namelist())
    prefix=project.name+'/'
    assert not any('/node_modules/' in n or '/.npm-cache/' in n or '/artifacts/' in n for n in names)
    original=json.loads(archive.read(prefix+'src/data/questions.json'))
    pdf=json.loads(archive.read(prefix+'src/data/collections/exitos-simulador-01.json'))
    assert len(original)==197 and len(pdf)==150
    assert [q['originalNumber'] for q in pdf]==list(range(1,151))
    assert len({q['id'] for q in original+pdf})==347
    for name in ['package.json','package-lock.json','vite.config.mjs','tsconfig.json','index.html','src/App.tsx','src/theme.css','dist/index.html','README.md','docs/VERIFICACION_EXITOS.md']:
        assert prefix+name in names,name
    for q in pdf:
        for d in q.get('diagrams',[]):
            assert prefix+'public'+d['src'] in names
            assert prefix+'dist'+d['src'] in names
    for name in ['Simulador_Exitos_150_TEXTO.txt','Simulador_Exitos_150_COMPATIBLE.pdf']:
        assert archive.read(prefix+'input/'+name)==archive.read(prefix+'public/collections/exitos-simulador-01/'+name)
    exported=json.loads(archive.read(prefix+'public/downloads/capm-banco-v1.json'))
    assert len(exported['questions'])==347
report={'zip':str(output),'fileCount':len(files),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'originalQuestions':197,'pdfQuestions':150,'integrity':'ok'}
print(json.dumps(report,ensure_ascii=True))

