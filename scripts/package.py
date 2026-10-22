from pathlib import Path
import os
import zipfile
import json

project = Path(__file__).resolve().parent.parent
output = project.parent.parent / 'outputs' / 'CAPM_Centro_Estudio_Leython.zip'
output.parent.mkdir(parents=True, exist_ok=True)
excluded = {'node_modules', 'artifacts', '.git', '.openai', '__pycache__'}
files = []
for directory, folders, names in os.walk(project):
    folders[:] = [name for name in folders if name not in excluded]
    for name in names:
        file = Path(directory) / name
        if name.endswith(('.log', '.tsbuildinfo', '.pyc')) or file.is_symlink():
            continue
        if not file.resolve().is_relative_to(project):
            raise RuntimeError('Ruta fuera del proyecto')
        files.append(file)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(files):
        archive.write(file, str(Path('CAPM_Centro_Estudio_Leython') / file.relative_to(project)))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    prefix = 'CAPM_Centro_Estudio_Leython/'
    bank = json.loads(archive.read(prefix + 'src/data/questions.json'))
    sources = json.loads(archive.read(prefix + 'src/data/sources.json'))
    assert len(bank) == 197 and len(sources) == 36
    assert prefix + 'dist/index.html' in archive.namelist()
    assert prefix + 'INICIAR_CAPM.cmd' in archive.namelist()
print(json.dumps({'path':str(output),'files':len(files),'bytes':output.stat().st_size,'questions':len(bank),'sources':len(sources),'integrity':'ok'}))
