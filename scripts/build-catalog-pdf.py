#!/usr/bin/env python3
"""Build the customer PDF from the same internal catalog source as the website."""
import json, math
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
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
}

def p(text,x,top,width,style='body'):
    obj=Paragraph(escape(text).replace('\n','<br/>'),styles[style]); _,height=obj.wrap(width,1000);obj.drawOn(c,x,top-height); return height

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

def illustration(kind,x,y,w,h):
    """Original vector format sketches, not supplier imagery or completed jobs."""
    c.saveState();c.translate(x,y);c.scale(w/280,h/160)
    c.setFillColor(IVORY);c.roundRect(0,0,280,160,6,fill=1,stroke=0)
    c.setStrokeColor(INK);c.setLineWidth(2)
    if kind=='banners':
        c.setFillColor(RED);c.rect(28,32,224,96,fill=1,stroke=0)
        c.setFillColor(WHITE);c.setFont('Display',36);c.drawCentredString(140,83,'MAKE AN');c.drawCentredString(140,46,'ENTRANCE.')
        for xx in [35,245]:
            for yy in [39,121]:c.circle(xx,yy,2.5,fill=1,stroke=0)
    elif kind in ['rigid-signs','specialty-signs']:
        c.setFillColor(WHITE);c.rect(43,55,194,76,fill=1,stroke=1)
        c.setFillColor(INK);c.setFont('Display',26);c.drawCentredString(140,92,'YOUR BUSINESS')
        c.setFillColor(RED);c.rect(61,73,158,6,fill=1,stroke=0)
        if kind=='rigid-signs':c.line(80,55,80,16);c.line(200,55,200,16)
        else:
            for xx in [51,229]:
                for yy in [63,123]:c.circle(xx,yy,2,fill=0,stroke=1)
    elif kind in ['adhesive-graphics','wall-art']:
        c.setFillColor(WHITE);c.rect(35,21,210,118,fill=1,stroke=1);c.line(140,21,140,139)
        c.setFillColor(RED);c.rect(47,67,186,44,fill=1,stroke=0)
        c.setFillColor(WHITE);c.setFont('Display',28);c.drawCentredString(140,78,'WELCOME IN')
        if kind=='wall-art':
            c.setFillColor(INK);c.rect(61,32,73,18,fill=1,stroke=0)
    elif kind=='displays':
        for xx in [42,157]:
            c.setFillColor(INK);c.roundRect(xx,15,80,8,2,fill=1,stroke=0)
            c.setFillColor(WHITE);c.rect(xx+5,23,70,116,fill=1,stroke=1)
            c.setFillColor(RED);c.rect(xx+5,83,70,56,fill=1,stroke=0)
            c.setFillColor(INK);c.setFont('Display',23);c.drawCentredString(xx+40,57,'BE SEEN')
    elif kind=='events':
        path=c.beginPath();path.moveTo(25,106);path.lineTo(140,147);path.lineTo(255,106);path.close()
        c.setFillColor(RED);c.drawPath(path,fill=1,stroke=0);c.setFillColor(INK)
        c.line(36,106,36,18);c.line(244,106,244,18)
        c.setFillColor(WHITE);c.rect(64,25,152,42,fill=1,stroke=1)
        c.setFillColor(RED);c.setFont('Display',23);c.drawCentredString(140,39,'YOUR BRAND')
    elif kind=='apparel-transfers':
        path=c.beginPath()
        for i,(xx,yy) in enumerate([(94,132),(117,143),(163,143),(186,132),(218,105),(190,80),(178,90),(178,20),(102,20),(102,90),(90,80),(62,105)]):
            (path.moveTo if i==0 else path.lineTo)(xx,yy)
        path.close();c.setFillColor(WHITE);c.drawPath(path,fill=1,stroke=1)
        c.setFillColor(RED);c.rect(116,74,48,29,fill=1,stroke=0)
        c.setFillColor(WHITE);c.setFont('Display',17);c.drawCentredString(140,82,'CREW')
    elif kind=='print':
        c.setFillColor(INK);c.rect(42,62,161,80,fill=1,stroke=0)
        c.setFillColor(WHITE);c.rect(76,24,162,83,fill=1,stroke=1)
        c.setFillColor(RED);c.setFont('Display',26);c.drawString(91,67,'GOOD TO MEET YOU')
        c.setStrokeColor(LINE);c.line(91,48,204,48)
    else:
        c.setFillColor(WHITE);c.roundRect(73,19,134,124,3,fill=1,stroke=1)
        c.setFillColor(RED);c.rect(112,134,56,13,fill=1,stroke=0)
        for yy in [108,78,48]:
            c.setStrokeColor(RED);c.line(91,yy,97,yy-6);c.line(97,yy-6,108,yy+7)
            c.setStrokeColor(INK);c.line(121,yy,188,yy)
    c.restoreState()

# A maximum of ten entries per sheet keeps the two-column list readable.
spreads=[]
for cat in DATA['categories']:
    for start in range(0,len(cat['items']),10): spreads.append((cat,cat['items'][start:start+10],start>0))
starts={}
for page,(cat,_,_) in enumerate(spreads,2):starts.setdefault(cat['id'],page)
header('2026 collection')
p('Signs, graphics\nand everything\naround them.',M,682,CW,'title')
p('A product and service guide for your business, storefront, dealership or next event. Work directly with Erik from the brief through the agreed delivery or installation.',M,548,CW,'intro')
# Original illustrative image already used on SolidSite's website.
c.drawImage(ImageReader(str(ROOT/'public/assets/storefront.webp')),M,290,width=CW,height=200,mask='auto',preserveAspectRatio=True,anchor='c')
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
    title_height=p(title,M,688,350,'title')
    intro_top=688-title_height-15
    p(cat['intro'],M,intro_top,342,'intro')
    illustration(cat['id'],414,578,156,90)
    c.setFillColor(MUTED);c.setFont('Barlow',7);c.drawRightString(W-M,568,'Format illustration')
    top=534;col_width=(CW-28)/2;rows=math.ceil(len(items)/2);row_height=min(105,450/max(rows,1))
    for index,item in enumerate(items):
        col=index%2;row=index//2;xx=M+col*(col_width+28);yy=top-row*row_height
        c.setStrokeColor(LINE);c.line(xx,yy+8,xx+col_width,yy+8)
        n=p(item['name'],xx,yy,col_width,'name')
        d=p(item['description'],xx,yy-n-6,col_width,'body')
        o=p(item['options'],xx,yy-n-d-12,col_width,'small') if item.get('options') else 0
        used=n+d+o+12
        if used>row_height-10:raise ValueError(f"Catalog row overflow: {item['name']} uses {used:.1f} of {row_height:.1f}")
        c.linkURL('https://solidsitesigns.com/?service='+__import__('urllib.parse',fromlist=['quote']).quote(item['service'])+'&product='+__import__('urllib.parse',fromlist=['quote']).quote(item['name'])+'#quote',(xx,yy-n,xx+col_width,yy+4),relative=0)
    p('Request a quote at solidsitesigns.com or call (713) 912-2151.',M,70,CW,'small')
    footer(page);c.showPage()

page=len(spreads)+2;header('Let\'s talk signs')
p('Tell us what\nyou have in mind.',M,685,CW,'title')
p('A clear brief helps us recommend the right product and put a useful quote together.',M,577,CW,'intro')
questions=[('The product','Which item caught your eye? Include the quantity and approximate finished size.'),('The placement','Send the city or ZIP, a photo of the space and the surface or display hardware.'),('The artwork','Share your logo, artwork or message. We will review file requirements for the chosen product.'),('The timing','Tell us the date you need it in place and whether you need delivery or installation.')]
y=510
for title,text in questions:
    p(title,M,y,150,'name');p(text,M+164,y,CW-164,'body');c.setStrokeColor(LINE);c.line(M,y-52,W-M,y-52);y-=82
c.setFillColor(INK);c.roundRect(M,118,CW,92,4,fill=1,stroke=0)
c.setFillColor(WHITE);c.setFont('Display',30);c.drawString(M+22,176,'WORK DIRECTLY WITH ERIK.')
c.setFont('BarlowBold',14);c.drawString(M+22,149,'(713) 912-2151  |  erik@gosolidsite.com')
c.linkURL('mailto:erik@gosolidsite.com',(M,118,W-M,166),relative=0)
p('Serving Greater Houston. Production is coordinated through specialist partners. Installation, access, electrical work and permitting needs are reviewed for each project; only the agreed scope is included. Edition: November 2026.',M,98,CW,'small')
footer(page);c.showPage();c.save()
print(f'{OUT}\n{page} pages; {sum(len(cat["items"]) for cat in DATA["categories"])} products/services')
