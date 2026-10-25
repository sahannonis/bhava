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
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, timezone_id='Asia/Colombo')
    pg = ctx.new_page()
    # a fixed day: on 26 Oct 2026 the Moon is in Aries, the 2nd house from a Pisces lagna
    pg.clock.set_fixed_time('2026-10-26T09:00:00+05:30')
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
    assert 'Colombo, Sri Lanka, UTC+05:30' in pg.inner_text('.born')
    assert 'Moon in your 2nd today, in Aries' in pg.inner_text('.sky'), pg.inner_text('.sky')
    # house 1 is chosen to start: Sun, Moon, Mercury and Venus join into one boss
    assert pg.inner_text('.panel h2') == '1st house, Pisces'
    assert pg.inner_text('.panel .kind') == 'Boss'
    assert pg.locator('.foes li').count() == 4
    pg.screenshot(path=f'{OUT}/map.png', full_page=True)
    # tap the 9th house: Saturn alone, a fight
    pg.locator('[data-house="9"] .hit').tap()
    assert pg.inner_text('.panel h2') == '9th house, Scorpio'
    assert pg.inner_text('.panel .kind') == 'Fight'
    assert 'The Grey Warden' in pg.inner_text('.foes')
    # the 3rd house (Taurus) is empty: a rest place whose lord Venus sits in the 1st
    pg.locator('[data-house="3"] .hit').tap()
    assert pg.inner_text('.panel .kind') == 'Rest place'
    assert 'Rest, and also gain 10 prana.' in pg.inner_text('.panel')
    pg.screenshot(path=f'{OUT}/map-rest.png', full_page=False)
    # the 12th is always the final gate
    pg.locator('[data-house="12"] .hit').tap()
    assert pg.inner_text('.panel .kind') == 'Final gate'

    # 2. the birth is kept on the device
    pg.reload(); pg.wait_for_selector('.chart')
    assert pg.inner_text('.class-head h1') == 'The Sage'

    # 3. no time, and a place from map coordinates; old Sri Lankan time (UTC+6)
    pg.click('#edit'); pg.click('#placeChange')
    pg.fill('#date', '1999-06-01'); pg.fill('#time', '')
    pg.click('#coordsOpen'); pg.fill('#coords', '7.05, 79.92'); pg.click('#coordsUse')
    pg.click('button.primary'); pg.wait_for_selector('.chart')
    assert 'Read from your Moon in' in pg.inner_text('.class-head .lead')
    assert 'UTC+06:00' in pg.inner_text('.born'), pg.inner_text('.born')

    # 4. forget
    pg.click('#forget'); pg.wait_for_selector('#placeQ')
    pg.reload(); pg.wait_for_selector('#placeQ')

    assert not errs, errs
    print('screens ok')
    b.close()
