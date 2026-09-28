from PIL import Image

crops = [
    ('p54_d01_chapati.png', 'Meal/data/raw/rendered_pages/fct_page_054.png', (900, 550, 1500, 1000)),
    ('p55_d04_kalool.png', 'Meal/data/raw/rendered_pages/fct_page_055.png', (800, 100, 1400, 520)),
    ('p55_d05_kofta.png', 'Meal/data/raw/rendered_pages/fct_page_055.png', (800, 580, 1400, 1020)),
    ('p56_d06_pulao.png', 'Meal/data/raw/rendered_pages/fct_page_056.png', (300, 100, 850, 520)),
    ('p56_d07_shami.png', 'Meal/data/raw/rendered_pages/fct_page_056.png', (300, 580, 850, 1020)),
    ('p56_d08_chapal.png', 'Meal/data/raw/rendered_pages/fct_page_056.png', (950, 100, 1550, 520)),
    ('p56_d09_chicken.png', 'Meal/data/raw/rendered_pages/fct_page_056.png', (950, 580, 1550, 1020)),
    ('p57_d10_haleem.png', 'Meal/data/raw/rendered_pages/fct_page_057.png', (150, 100, 700, 520)),
    ('p57_d12_sajji.png', 'Meal/data/raw/rendered_pages/fct_page_057.png', (850, 100, 1400, 520)),
    ('p57_d13_biryani.png', 'Meal/data/raw/rendered_pages/fct_page_057.png', (850, 580, 1400, 1020)),
    ('p58_d15_zarda.png', 'Meal/data/raw/rendered_pages/fct_page_058.png', (300, 560, 850, 1000)),
    ('p58_d16_kheer.png', 'Meal/data/raw/rendered_pages/fct_page_058.png', (950, 100, 1550, 520)),
    ('p58_d17_halwa_gajar.png', 'Meal/data/raw/rendered_pages/fct_page_058.png', (950, 560, 1550, 1000)),
]

for name, src, box in crops:
    img = Image.open(src)
    c = img.crop(box)
    c.save(f'Meal/data/raw/recovery/{name}')

print("All dish crops saved to Meal/data/raw/recovery/ successfully!")
