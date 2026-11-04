import os
from PIL import Image

card_templates = [
    'data/backup_original_reviews/1790671799478_9fbdd2_imgi_302_1732017641112-v_o_y_a_g_e-id-24.jpg',
    'data/backup_original_reviews/1790671800708_5c670f_imgi_304_1732017641673-v_o_y_a_g_e-id-24.jpg',
    'data/backup_original_reviews/1790671803472_e6d1ab_imgi_303_1732017641747-v_o_y_a_g_e-id-24.jpg',
    'data/backup_original_reviews/1790671805529_ed4ce6_imgi_306_1732017641401-v_o_y_a_g_e-id-24.jpg'
]

user_photos = [
    '/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/.user_uploaded/media_1793775057444_58f27394.jpg',
    '/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/.user_uploaded/media_1793775057446_52dfd707.jpg',
    '/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/.user_uploaded/media_1793775057449_1c7db818.jpg',
    '/home/emran/.gemini/antigravity/brain/10cbe109-50f9-412b-8af4-ea027d1fb544/.user_uploaded/media_1793775057452_b67e420c.jpg'
]

os.makedirs('src/public/uploads', exist_ok=True)
os.makedirs('data/uploads', exist_ok=True)

for idx, (tmpl_path, photo_path) in enumerate(zip(card_templates, user_photos), 1):
    card = Image.open(tmpl_path).convert('RGB')
    photo = Image.open(photo_path).convert('RGB')
    
    # Trace the exact wave boundary for this template
    wave_map = {}
    for x in range(card.width):
        y_card = None
        for y in range(450, 1100):
            r, g, b = card.getpixel((x, y))
            if r > 235 and g > 235 and b > 235:
                y_card = y
                break
        if y_card is None:
            y_card = 1100
        wave_map[x] = y_card

    # Resize user photo to fit nicely in top 1144x1144 area
    scaled_photo = photo.resize((1144, 1144), Image.Resampling.LANCZOS)
    
    result = card.copy()
    feather = 10
    for x in range(28, 1172):
        y_target = wave_map.get(x, 900)
        for y in range(28, y_target):
            # Respect rounded card corners at top
            if x < 70 and y < 70 and (x - 70)**2 + (y - 70)**2 > 42**2:
                continue
            if x > 1130 and y < 70 and (x - 1130)**2 + (y - 70)**2 > 42**2:
                continue
            
            photo_px = scaled_photo.getpixel((x - 28, y - 28))
            if y < y_target - feather:
                result.putpixel((x, y), photo_px)
            else:
                orig_px = card.getpixel((x, y))
                alpha = (y_target - y) / float(feather)
                blended = tuple(int(photo_px[c] * alpha + orig_px[c] * (1.0 - alpha)) for c in range(3))
                result.putpixel((x, y), blended)

    # Save composited card
    card_name = f'customer_review_{idx}.jpg'
    result.save(f'src/public/uploads/{card_name}', quality=95)
    result.save(f'data/uploads/{card_name}', quality=95)

    # Also save raw avatar
    avatar_name = f'customer_avatar_{idx}.jpg'
    photo.save(f'src/public/uploads/{avatar_name}', quality=95)
    photo.save(f'data/uploads/{avatar_name}', quality=95)

    print(f"Generated card & avatar for Customer {idx}: {card_name}")

print("All customer review cards generated successfully!")
