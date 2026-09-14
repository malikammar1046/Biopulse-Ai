from PIL import Image

# Halwa Suji is on page 58: y around 200 to 520, x around 250 to 800
img58 = Image.open('Meal/data/raw/rendered_pages/fct_page_058.png')
# Let's crop the Halwa Suji values column (x around 650 to 800, y around 200 to 500)
halwa_crop = img58.crop((250, 200, 800, 520))
halwa_crop.save('Meal/data/raw/halwa_suji_crop.png')

# Machli is on page 57: y around 600 to 1000, x around 100 to 750
img57 = Image.open('Meal/data/raw/rendered_pages/fct_page_057.png')
machli_crop = img57.crop((150, 600, 750, 1000))
machli_crop.save('Meal/data/raw/machli_crop.png')

print("Saved crops successfully!")
