"""Extract Unicode text from the supplied Canva PDF using only the Python standard library."""
from pathlib import Path
import re, zlib, json, hashlib, unicodedata
import bisect

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'input/Grupo_de_Procesos_150.pdf'
raw = PDF.read_bytes()
assert hashlib.sha256(raw).hexdigest() == '680f023075b201d6cdc1605434f3d4612d5b80d5081c8747bf6aea1ce067f81f'
objects = {int(n): v for n, v in re.findall(rb'(\d+) \d+ obj\s*(.*?)endobj', raw, re.S)}

def stream(number):
    header, tail = objects[number].split(b'stream', 1)
    length = re.search(rb'/Length (\d+)(?! 0 R)', header)
    assert length, ('Indirect length', number)
    tail = tail[2:] if tail.startswith(b'\r\n') else tail[1:]
    data = tail[:int(length[1])]
    return zlib.decompress(data) if b'/FlateDecode' in header else data

fonts = {}
font_widths = {}
for number, obj in objects.items():
    m = re.search(rb'/ToUnicode (\d+) 0 R', obj)
    if not m:
        continue
    data = stream(int(m[1]))
    cmap = {}
    codespace = re.search(rb"begincodespacerange\s*<([0-9a-fA-F]+)>",data)
    font_widths[number] = len(codespace[1])//2 if codespace else 2
    for group in re.findall(rb'beginbfchar(.*?)endbfchar', data, re.S):
        for a,b in re.findall(rb'<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>', group):
            cmap[int(a,16)] = bytes.fromhex(b.decode()).decode('utf-16-be')
    for group in re.findall(rb'beginbfrange(.*?)endbfrange', data, re.S):
        for m in re.finditer(rb'<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]+)>|\[([^]]*)\])', group):
            first,last = int(m[1],16),int(m[2],16)
            if m[4]:
                base,width = int(m[4],16),len(m[4])//2
                for value in range(first,last+1):
                    cmap[value] = (base+value-first).to_bytes(width,'big').decode('utf-16-be')
            else:
                values = re.findall(rb'<([0-9a-fA-F]+)>',m[5])
                assert len(values) == last-first+1
                for value,dest in zip(range(first,last+1),values):
                    cmap[value] = bytes.fromhex(dest.decode()).decode('utf-16-be')
    fonts[number] = cmap

pages = []
page_ids = [int(n) for n in re.findall(rb'(\d+) 0 R', re.search(rb'/Kids \[(.*?)\]', objects[2], re.S)[1])]
for number in page_ids:
    obj = objects[number]
    f = int(re.search(rb'/Font (\d+) 0 R', obj)[1])
    font_refs = {name.decode():int(n) for name,n in re.findall(rb'/(\S+) (\d+) 0 R',objects[f])}
    mapping = {name:fonts[n] for name,n in font_refs.items()}
    content = stream(int(re.search(rb'/Contents (\d+) 0 R',obj)[1]))
    assert not re.search(rb'\]\s*TJ',content), 'Unsupported TJ array'
    lines = []
    for bt in re.findall(rb'\bBT\b(.*?)\bET\b',content,re.S):
        font = None
        assert len(re.findall(rb'\bTj\b',bt)) == len(re.findall(rb'<[0-9a-fA-F]+>\s*Tj',bt)), ('Unsupported literal text',number)
        line = []
        for token in re.finditer(rb'/(\S+) [-\d.]+ Tf|<([0-9a-fA-F]+)>\s*Tj',bt):
            if token[1]:
                font = token[1].decode()
            else:
                data = bytes.fromhex(token[2].decode())
                width = font_widths[font_refs[font]]
                assert len(data)%width == 0, (number,font,width,data)
                for i in range(0,len(data),width):
                    glyph = int.from_bytes(data[i:i+width],'big')
                    assert glyph in mapping[font], (number,font,glyph)
                    line.append(mapping[font][glyph])
        text = unicodedata.normalize('NFKC',''.join(line)).strip()
        if text:
            lines.append(text)
    pages.append({'page':len(pages)+1,'text':'\n'.join(lines)})

images = [n for n,v in objects.items() if re.search(rb'/Subtype\s*/Image\b',v)]
assert len(pages) == 96
result = {'pdfSha256':hashlib.sha256(raw).hexdigest(),'pages':pages,'imageObjects':images,
          'method':'Embedded Unicode maps and text operators; NFKC normalizes fi/fl ligatures; no OCR or invented text.'}
(ROOT/'input/procesos-pdf-extracted.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'input/Grupo_de_Procesos_150_TEXTO.txt').write_text('\n\n'.join('=== Página '+str(p['page'])+' ===\n'+p['text'] for p in pages)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(pages),'images':images,'characters':sum(len(p['text']) for p in pages),'titles':re.findall(r'Pregunta\s*(\d+)', '\n'.join(p['text'] for p in pages))},ensure_ascii=True))

text = '\n'.join(p['text'] for p in pages)
heads = list(re.finditer(r'Pregunta\s*(\d+)',text))
ends, position = [], 0
for page in pages:
    position += len(page['text'])+1
    ends.append(position)
questions = []
for i, head in enumerate(heads):
    block = ' '.join(text[head.end():heads[i+1].start() if i+1<len(heads) else len(text)].split())
    key = re.search(r'Respuesta correcta:\s*([abcd])\)',block)
    assert key, head[1]
    before = block[:key.start()]
    options = list(re.finditer(r'(?<!\w)([abcd])\)\s*',before))
    assert [o[1] for o in options] == list('abcd'), head[1]
    explanation = re.split(r'Explicación:\s*',block[key.end():],maxsplit=1)
    assert len(explanation)==2 and explanation[1].strip(), head[1]
    questions.append({'number':int(head[1]),'page':bisect.bisect_right(ends,head.start())+1,
        'stem':before[:options[0].start()].strip(),
        'options':{o[1]:before[o.end():options[k+1].start() if k+1<len(options) else len(before)].strip() for k,o in enumerate(options)},
        'key':key[1], 'explanation':explanation[1].strip()})
assert [q['number'] for q in questions] == list(range(1,151))
assert questions[20]['stem'].startswith('Un equipo está planificando un proyecto predictivo')
(ROOT/'input/procesos-questions-extracted.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
