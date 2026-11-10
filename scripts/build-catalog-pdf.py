#!/usr/bin/env python3
"""Build the customer PDF from the same internal catalog source as the website."""
import io, json
from PIL import Image
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT/'data/catalog.json').read_text())
OUT = ROOT/'public/downloads/solidsite-signs-catalog.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
for name, file in [('Barlow','Barlow-Regular.ttf'),('BarlowBold','Barlow-SemiBold.ttf'),('Display','BarlowCondensed-Black.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(ROOT/'public/assets/fonts'/file)))
PAPER=HexColor('#f8f5ef'); INK=HexColor('#242522'); RED=HexColor('#b72c22'); MUTED=HexColor('#64645b'); LINE=HexColor('#dedbd2'); WHITE=HexColor('#ffffff'); IVORY=HexColor('#f4ebdd')
W,H=612,792; M=42; CW=W-2*M
c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle('SolidSite Signs | Product & Service Catalog')
c.setAuthor('SolidSite Signs')
c.setSubject('Banners, graphics, signs, displays, event products, apparel and project services in Greater Houston')
styles={
 'body':ParagraphStyle('body',fontName='Barlow',fontSize=10.8,leading=14.5,textColor=INK),
 'small':ParagraphStyle('small',fontName='Barlow',fontSize=9,leading=12,textColor=MUTED),
 'name':ParagraphStyle('name',fontName='BarlowBold',fontSize=13,leading=15,textColor=INK),
 'intro':ParagraphStyle('intro',fontName='Barlow',fontSize=12,leading=16,textColor=MUTED),
 'title':ParagraphStyle('title',fontName='Display',fontSize=40,leading=39,textColor=INK),
 'category':ParagraphStyle('category',fontName='Display',fontSize=32,leading=31,textColor=INK),
}

def p(text,x,top,width,style='body'):
    obj=Paragraph(escape(text).replace('\n','<br/>'),styles[style]); _,height=obj.wrap(width,1000);obj.drawOn(c,x,top-height); return height

def pdf_image(path, size=750):
    # JPEG embeds efficiently in PDF; preserve the full supplier image and ratio.
    with Image.open(path) as source:
        image=source.convert('RGB');image.thumbnail((size,size),Image.Resampling.LANCZOS)
        buffer=io.BytesIO();image.save(buffer,'JPEG',quality=88,optimize=True)
    buffer.seek(0)
    return ImageReader(buffer)

def header(label='Product & service catalog'):
    c.setFillColor(PAPER); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(INK);c.setFont('Display',25);c.drawString(M,H-48,'SolidSite')
    c.setFillColor(RED);c.setFont('Display',21);c.drawString(M+98,H-48,'Signs')
    c.setFillColor(MUTED);c.setFont('Barlow',9);c.drawRightString(W-M,H-45,label)
    c.setStrokeColor(LINE);c.line(M,H-63,W-M,H-63)

def footer(page):
    c.setStrokeColor(LINE);c.line(M,47,W-M,47)
    c.setFillColor(MUTED);c.setFont('Barlow',8.5)
    c.drawString(M,31,'solidsitesigns.com  |  (713) 912-2151')
    c.linkURL('https://solidsitesigns.com/catalog/',(M,23,M+205,43),relative=0)
    c.drawRightString(W-M,31,f'{page:02d}')

# Four image-led entries per sheet make each product example legible.
spreads=[]
for cat in DATA['categories']:
    for start in range(0,len(cat['items']),4): spreads.append((cat,cat['items'][start:start+4],start>0))
starts={}
for page,(cat,_,_) in enumerate(spreads,2):starts.setdefault(cat['id'],page)
header('2026 collection')
p('Signs, graphics\nand everything\naround them.',M,682,CW,'title')
p('A product and service guide for your business, storefront, dealership or next event. Work with SolidSite Signs from the brief through the agreed delivery or installation.',M,548,CW,'intro')
# Original illustrative image already used on SolidSite's website.
c.drawImage(pdf_image(ROOT/'public/assets/storefront.webp',1200),M,290,width=CW,height=200,preserveAspectRatio=True,anchor='c')
p('Illustrative signage concept. Not a completed client project.',M,282,CW,'small')
for idx,cat in enumerate(DATA['categories']):
    col=idx//6;row=idx%6;xx=M+col*(CW/2+12);yy=244-row*29
    c.setFillColor(INK);c.setFont('BarlowBold',10.5);c.drawString(xx,yy,cat['title'])
    c.setFillColor(RED);c.setFont('Barlow',9);c.drawRightString(xx+CW/2-18,yy,str(starts[cat['id']]))
    c.linkRect('',cat['id'],(xx,yy-4,xx+CW/2-18,yy+13),relative=0,thickness=0)
p('Every project is quoted for its size, quantity, material, finishing and location. Product availability and scheduling are confirmed with your quote.',M,87,CW,'small')
footer(1);c.showPage()

for page,(cat,items,continued) in enumerate(spreads,2):
    header();
    if not continued:c.bookmarkPage(cat['id']);c.addOutlineEntry(cat['title'],cat['id'],0,False)
    title=cat['title']+(' / continued' if continued else '')
    title_height=p(title,M,704,CW,'category')
    intro_top=704-title_height-10
    p(cat['intro'],M,intro_top,CW,'body')
    top=584;col_width=(CW-28)/2;row_height=250
    for index,item in enumerate(items):
        col=index%2;row=index//2;xx=M+col*(col_width+28);yy=top-row*row_height
        image_path=ROOT/'public/assets/products'/f'{item["id"]}.webp'
        if not image_path.is_file():raise ValueError(f'Missing product picture: {image_path}')
        c.setFillColor(IVORY);c.rect(xx,yy-145,col_width,145,fill=1,stroke=0)
        c.drawImage(pdf_image(image_path),xx,yy-145,width=col_width,height=145,preserveAspectRatio=True,anchor='c')
        label=item.get('imageLabel','Product example')
        c.setFillColor(MUTED);c.setFont('Barlow',7);c.drawString(xx,yy-154,label)
        text_top=yy-168
        n=p(item['name'],xx,text_top,col_width,'name')
        d=p(item['description'],xx,text_top-n-5,col_width,'body')
        o=p(item['options'],xx,text_top-n-d-10,col_width,'small') if item.get('options') else 0
        used=168+n+d+o+10
        if used>row_height-10:raise ValueError(f"Catalog row overflow: {item['name']} uses {used:.1f} of {row_height:.1f}")
        c.linkURL('https://solidsitesigns.com/?service='+__import__('urllib.parse',fromlist=['quote']).quote(item['service'])+'&product='+__import__('urllib.parse',fromlist=['quote']).quote(item['name'])+'#quote',(xx,text_top-n,xx+col_width,yy),relative=0)
    p('Product examples. Artwork, size, finish and included hardware are confirmed with your quote.',M,70,CW,'small')
    footer(page);c.showPage()

page=len(spreads)+2;header('Let\'s talk signs')
p('Tell us what\nyou have in mind.',M,685,CW,'title')
p('A clear brief helps us recommend the right product and put a useful quote together.',M,577,CW,'intro')
questions=[('The product','Which item caught your eye? Include the quantity and approximate finished size.'),('The placement','Send the city or ZIP, a photo of the space and the surface or display hardware.'),('The artwork','Share your logo, artwork or message. We will review file requirements for the chosen product.'),('The timing','Tell us the date you need it in place and whether you need delivery or installation.')]
y=510
for title,text in questions:
    p(title,M,y,150,'name');p(text,M+164,y,CW-164,'body');c.setStrokeColor(LINE);c.line(M,y-52,W-M,y-52);y-=82
c.setFillColor(INK);c.roundRect(M,118,CW,92,4,fill=1,stroke=0)
c.setFillColor(WHITE);c.setFont('Display',30);c.drawString(M+22,176,'WORK WITH SOLIDSITE SIGNS.')
c.setFont('BarlowBold',14);c.drawString(M+22,149,'(713) 912-2151  |  info@gosolidsite.com')
c.linkURL('mailto:info@gosolidsite.com',(M,118,W-M,166),relative=0)
p('Serving Greater Houston. Production is coordinated through specialist partners. Installation, access, electrical work and permitting needs are reviewed for each project; only the agreed scope is included. Edition: November 2026.',M,98,CW,'small')
footer(page);c.showPage();c.save()
print(f'{OUT}\n{page} pages; {sum(len(cat["items"]) for cat in DATA["categories"])} products/services')
