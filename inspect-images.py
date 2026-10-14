from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
files=sorted(Path('dist/assets').glob('post-*.jpg'),key=lambda p:int(p.stem.split('-')[1]))
w=1000; cellw=200; cellh=230
canvas=Image.new('RGB',(w,((len(files)+4)//5)*cellh),'#f6f3ed')
d=ImageDraw.Draw(canvas)
for i,p in enumerate(files):
 im=Image.open(p); im.thumbnail((190,200)); x=(i%5)*cellw;y=(i//5)*cellh
 canvas.paste(im,(x+(190-im.width)//2,y));d.text((x+8,y+205),f'{p.stem} {Image.open(p).size}',fill='black')
canvas.save('image-contact-sheet.jpg')
