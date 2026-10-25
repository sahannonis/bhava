"""Phone-sized check of the birth and chart screens.

    npm run build && npx vite preview --port 4173
    python tests/screens.py [folder for screenshots]
"""
import sys
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
URL = 'http://localhost:4173/'

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

    # 1. a known birth with a time
    pg.goto(URL)
    pg.wait_for_function("document.getElementById('placeState').textContent === ''", timeout=20000)
    pg.screenshot(path=f'{OUT}/birth.png', full_page=True)
    pg.click('button.primary')
    assert pg.inner_text('#err') == 'Enter your date of birth.'
    pg.fill('#date', '1985-03-21'); pg.fill('#time', '06:45')
    pg.fill('#placeQ', 'colombo'); pg.wait_for_selector('#placeList li')
    pg.click('#placeList li >> nth=0')
    pg.click('button.primary'); pg.wait_for_selector('.chart')
    assert pg.inner_text('.class-head h1') == 'The Sage', pg.inner_text('.class-head h1')
    assert 'Colombo, Sri Lanka, UTC+05:30' in pg.inner_text('figcaption')
    kinds = pg.locator('.house-row .kind').all_inner_texts()
    assert kinds[0] == 'Boss' and kinds[11] == 'Final gate', kinds
    pg.screenshot(path=f'{OUT}/chart.png', full_page=True)

    # 2. the birth is kept on the device
    pg.reload(); pg.wait_for_selector('.chart')
    assert pg.inner_text('.class-head h1') == 'The Sage'

    # 3. no time, and a place from map coordinates; old Sri Lankan time (UTC+6)
    pg.click('#edit'); pg.click('#placeChange')
    pg.fill('#date', '1999-06-01'); pg.fill('#time', '')
    pg.click('#coordsOpen'); pg.fill('#coords', '7.05, 79.92'); pg.click('#coordsUse')
    pg.click('button.primary'); pg.wait_for_selector('.chart')
    assert 'Read from your Moon in' in pg.inner_text('.class-head .lead')
    assert 'UTC+06:00' in pg.inner_text('figcaption'), pg.inner_text('figcaption')

    # 4. forget
    pg.click('#forget'); pg.wait_for_selector('#placeQ')
    pg.reload(); pg.wait_for_selector('#placeQ')

    assert not errs, errs
    print('screens ok')
    b.close()
