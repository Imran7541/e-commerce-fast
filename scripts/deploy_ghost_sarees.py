import os
from PIL import Image

MAPPINGS = {
    "1790671329971_92b7da_imgi_9_4.jpg": "/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/ghost_mannequin_saree_31_1793764831615.jpg",
    "1790671331725_12c8cc_imgi_18_3-1.jpg": "/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/ghost_mannequin_saree_32_1793764857504.jpg",
    "1790671332176_5ecd58_imgi_19_4-1.jpg": "/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/ghost_mannequin_saree_33_1793764895323.jpg",
    "1790671330480_d1cbd3_imgi_12_Topper-IT-demo56.jpg": "/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/ghost_mannequin_saree_34_1793764917682.jpg",
    "1790671331317_c34592_imgi_16_14.jpg": "/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/ghost_mannequin_saree_35_1793764939734.jpg",
    "1790671332647_46a6b3_imgi_21_6.jpg": "/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/ghost_mannequin_saree_gallery_1793765070610.jpg"
}

TARGET_SIZE = (400, 500)
DEST_DIRS = [
    "/home/emran/Documents/E-commers rea/src/public/uploads",
    "/home/emran/Documents/E-commers rea/data/uploads"
]

def fit_and_crop(img, target_w, target_h):
    w, h = img.size
    target_aspect = target_w / target_h
    current_aspect = w / h

    if current_aspect > target_aspect:
        # Image is wider: crop sides
        new_w = int(h * target_aspect)
        left = (w - new_w) // 2
        top = 0
        right = left + new_w
        bottom = h
        img_cropped = img.crop((left, top, right, bottom))
    else:
        # Image is taller: crop bottom slightly more than top to preserve neckline/mannequin top
        new_h = int(w / target_aspect)
        top = int((h - new_h) * 0.25) # keep top visible
        left = 0
        right = w
        bottom = top + new_h
        img_cropped = img.crop((left, top, right, bottom))

    return img_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

for filename, src_path in MAPPINGS.items():
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found!")
        continue
    with Image.open(src_path) as im:
        im_rgb = im.convert("RGB")
        resized = fit_and_crop(im_rgb, TARGET_SIZE[0], TARGET_SIZE[1])
        for dest_dir in DEST_DIRS:
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, filename)
            resized.save(dest_path, "JPEG", quality=95, optimize=True)
            print(f"Saved: {dest_path} -> {resized.size} ({os.path.getsize(dest_path)} bytes)")

print("All saree images successfully converted & deployed.")
