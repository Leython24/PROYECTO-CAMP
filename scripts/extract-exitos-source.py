"""Extract this supplied ReportLab PDF without dependencies; never synthesizes text/images."""
from pathlib import Path
import re, zlib, base64, struct, json, hashlib

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'input/Simulador_Exitos_150_COMPATIBLE.pdf'
OUT = ROOT / 'public/collections/exitos-simulador-01'
OUT.mkdir(parents=True, exist_ok=True)
raw = PDF.read_bytes()
objects = {int(n): v for n, v in re.findall(rb'(\d+) \d+ obj\s*(.*?)endobj', raw, re.S)}

def stream(obj):
    header, tail = obj.split(b'stream', 1)
    length = int(re.search(rb'/Length (\d+)', header)[1])
    tail = tail[2:] if tail.startswith(b'\r\n') else tail[1:] if tail.startswith(b'\n') else tail
    data = tail[:length]
    if b'ASCII85Decode' in header:
        data = base64.a85decode(data, adobe=True)
    if b'FlateDecode' in header:
        data = zlib.decompress(data)
    return data

fonts = {}
for name, number in re.findall(rb'/(\S+) (\d+) 0 R', objects[6]):
    font = objects[int(number)]
    u = re.search(rb'/ToUnicode (\d+) 0 R', font)
    cmap = {}
    if u:
        data = stream(objects[int(u[1])])
        for group in re.findall(rb'beginbfchar(.*?)endbfchar', data, re.S):
            for a, b in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', group):
                cmap[int(a, 16)] = bytes.fromhex(b.decode()).decode('utf-16-be')
    fonts[name.decode()] = cmap

def unescape(s):
    out = bytearray()
    i = 0
    while i < len(s):
        if s[i] != 92:
            out.append(s[i]); i += 1; continue
        i += 1
        if i >= len(s): break
        if 48 <= s[i] <= 55:
            m = re.match(rb'[0-7]{1,3}', s[i:])
            out.append(int(m[0], 8)); i += len(m[0])
        else:
            out.append({110:10,114:13,116:9,98:8,102:12}.get(s[i],s[i])); i += 1
    return bytes(out)

pages = []
image_map = {}
for number, obj in objects.items():
    if b'/Subtype /Image' not in obj or b'/DeviceRGB' not in obj: continue
    width = int(re.search(rb'/Width (\d+)',obj)[1])
    height = int(re.search(rb'/Height (\d+)',obj)[1])
    pixels = stream(obj)
    assert len(pixels) == width * height * 3
    # Extract original RGB pixels; preserve alpha when the PDF has a soft mask.
    mask = re.search(rb'/SMask (\d+) 0 R',obj)
    alpha = stream(objects[int(mask[1])]) if mask else None
    channels = 4 if alpha else 3
    if alpha:
        pixels = b''.join(pixels[i*3:i*3+3]+alpha[i:i+1] for i in range(width*height))
    def chunk(t,d):
        return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    rows = b''.join(b'\0'+pixels[y*width*channels:(y+1)*width*channels] for y in range(height))
    png = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6 if alpha else 2,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')
    filename = f'diagrama-obj-{number}.png'
    (OUT/filename).write_bytes(png)
    image_map[number] = {'file': filename, 'width':width, 'height':height}

for number, obj in objects.items():
    if b'/Type /Page\n' not in obj: continue
    c = int(re.search(rb'/Contents (\d+) 0 R',obj)[1])
    content = stream(objects[c])
    font = 'F1'; lines = []
    for token in re.finditer(rb'/(\S+)\s+[\d.]+\s+Tf|\(((?:\\.|[^\\()])*)\)\s*Tj', content, re.S):
        if token[1]:
            font = token[1].decode()
        else:
            value = unescape(token[2])
            lines.append(''.join(fonts.get(font,{}).get(v,chr(v)) for v in value))
    image_ids = [int(n) for n in re.findall(rb'/FormXob\.\S+ (\d+) 0 R',obj)]
    pages.append({'page': len(pages)+1,'text':'\n'.join(lines),'images':[image_map[n] for n in image_ids if n in image_map]})

assert len(pages) == 48
extraction = {'pdfSha256':hashlib.sha256(raw).hexdigest(),'pages':pages,'images':image_map}
dest = ROOT/'input/exitos-pdf-extracted.json'
dest.write_text(json.dumps(extraction,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':len(pages),'images':image_map,'questionPages':[(p['page'],re.findall(r'^(\d+)\. ',p['text'],re.M)) for p in pages], 'annexPages':[p['page'] for p in pages if 'Anexo' in p['text'] or 'Pregunta ' in p['text']]},ensure_ascii=True))

