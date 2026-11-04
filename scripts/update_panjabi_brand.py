import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

font_bold_italic = "/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf"

DEST_DIRS = [
    "/home/emran/Documents/E-commers rea/src/public/uploads",
    "/home/emran/Documents/E-commers rea/data/uploads"
]

def save_to_destinations(im, filename):
    for d in DEST_DIRS:
        os.makedirs(d, exist_ok=True)
        path = os.path.join(d, filename)
        im.save(path, "JPEG", quality=95, optimize=True)
        print(f"Saved: {path} ({im.size})")

def process_green_panjabi():
    filename = "1790641675186_3baf66_WhatsApp_Image_2026-09-23_at_10_04_11_PM.jpg"
    src = os.path.join("data/backup_original_panjabis", filename)
    im = Image.open(src).convert("RGB")
    
    # 1. Seamless fabric patch over chest logo
    patch_w = 145
    patch_h = 60
    fabric = im.crop((640, 360, 640 + patch_w, 360 + patch_h))
    
    mask = Image.new("L", (patch_w, patch_h), 0)
    dmask = ImageDraw.Draw(mask)
    dmask.rectangle([6, 6, patch_w - 7, patch_h - 7], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    
    im.paste(fabric, (640, 298), mask)
    
    # 2. Draw EM-BRAND
    txt_layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(txt_layer)
    font = ImageFont.truetype(font_bold_italic, 24)
    
    text = "EM-BRAND"
    gold = (230, 205, 162, 255)
    shadow = (25, 45, 30, 200)
    
    tx = 650
    ty = 312
    d.text((tx + 1, ty + 1), text, fill=shadow, font=font)
    d.text((tx, ty), text, fill=gold, font=font)
    
    out = Image.alpha_composite(im.convert("RGBA"), txt_layer).convert("RGB")
    save_to_destinations(out, filename)

def process_blue_panjabi():
    filename = "1790641675628_fb6ead_WhatsApp_Image_2026-09-235_at_10_04_11_P.jpg"
    src = os.path.join("data/backup_original_panjabis", filename)
    im = Image.open(src).convert("RGB")
    
    # 1. Seamless fabric patch over chest logo
    patch_w = 150
    patch_h = 65
    fabric = im.crop((640, 365, 640 + patch_w, 365 + patch_h))
    
    mask = Image.new("L", (patch_w, patch_h), 0)
    dmask = ImageDraw.Draw(mask)
    dmask.rectangle([6, 6, patch_w - 7, patch_h - 7], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    im.paste(fabric, (640, 295), mask)
    
    # 2. Draw chest EM-BRAND on garment with elegant gold underline ornament
    txt_layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(txt_layer)
    font = ImageFont.truetype(font_bold_italic, 24)
    
    text = "EM-BRAND"
    gold = (226, 198, 155, 255)
    shadow = (20, 30, 45, 200)
    
    tx = 650
    ty = 308
    d.text((tx + 1, ty + 1), text, fill=shadow, font=font)
    d.text((tx, ty), text, fill=gold, font=font)
    
    # Underline with diamond ornament
    line_y = ty + 30
    d.line([(tx + 4, line_y), (tx + 48, line_y)], fill=gold, width=2)
    d.polygon([(tx + 54, line_y), (tx + 58, line_y - 4), (tx + 62, line_y), (tx + 58, line_y + 4)], fill=gold)
    d.line([(tx + 68, line_y), (tx + 116, line_y)], fill=gold, width=2)
    
    out = Image.alpha_composite(im.convert("RGBA"), txt_layer).convert("RGB")
    save_to_destinations(out, filename)

def process_white_panjabi():
    filename = "1790641675919_40760c_WhatsApp_Image_20265-09-23_at_10_04_11_P.jpg"
    src = os.path.join("data/backup_original_panjabis", filename)
    im = Image.open(src).convert("RGB")
    
    # 1. Seamless fabric patch over chest logo
    patch_w = 145
    patch_h = 60
    fabric = im.crop((645, 360, 645 + patch_w, 360 + patch_h))
    
    mask = Image.new("L", (patch_w, patch_h), 0)
    dmask = ImageDraw.Draw(mask)
    dmask.rectangle([6, 6, patch_w - 7, patch_h - 7], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    im.paste(fabric, (645, 298), mask)
    
    # 2. Draw EM-BRAND in bronze embroidery tone
    txt_layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(txt_layer)
    font = ImageFont.truetype(font_bold_italic, 24)
    
    text = "EM-BRAND"
    bronze = (110, 75, 30, 255)
    highlight = (255, 255, 255, 120)
    
    tx = 650
    ty = 312
    d.text((tx + 1, ty + 1), text, fill=highlight, font=font)
    d.text((tx, ty), text, fill=bronze, font=font)
    
    out = Image.alpha_composite(im.convert("RGBA"), txt_layer).convert("RGB")
    save_to_destinations(out, filename)

if __name__ == "__main__":
    process_green_panjabi()
    process_blue_panjabi()
    process_white_panjabi()
    print("All 3 Panjabi product images successfully updated to EM-BRAND!")
