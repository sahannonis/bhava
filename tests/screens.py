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
    # the opening plays over the app; a tap skips it
    pg.wait_for_selector('#opening'); pg.locator('#opening').dispatch_event('pointerdown')
    pg.wait_for_selector('#opening', state='detached')
    pg.wait_for_function("document.getElementById('placeState').textContent === ''", timeout=20000)
    pg.screenshot(path=f'{OUT}/birth.png', full_page=True)
    pg.click('button.primary')
    assert pg.inner_text('#err') == 'Enter your date of birth.'
    pg.fill('#date', '1985-03-21'); pg.fill('#time', '06:45')
    pg.fill('#placeQ', 'colombo'); pg.wait_for_selector('#placeList li')
    pg.click('#placeList li >> nth=0')
    pg.click('button.primary'); pg.wait_for_selector('.reading')
    # a new chart opens with its first reading: lagna and Moon, labelled
    first = pg.inner_text('.reading')
    assert 'Your first reading' in first and 'For entertainment and self-reflection.' in first, first
    pg.click('#readBack'); pg.wait_for_selector('.chart')
    assert pg.inner_text('.class-head h1') == 'The Sage', pg.inner_text('.class-head h1')
    assert 'Colombo, Sri Lanka, UTC+05:30' in pg.inner_text('.born')
    sky = pg.inner_text('.sky')
    assert 'Moon 2nd from your birth Moon today, in Aries' in sky, sky
    # Saturn is in Pisces, on this birth Moon: Sade Sati, and Saturn's remedy for the day
    assert 'Sade Sati, the middle' in sky, sky
    assert "Today's remedy, for Saturn" in sky, sky
    pg.click('#remedy summary')
    assert 'Om Shanaye Namah' in pg.inner_text('#remedy')
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
    # today's sky: Saturn crossing the 1st house, a hard place 1st from the birth Moon
    pg.click('#modeSky')
    assert pg.get_attribute('#modeSky', 'aria-pressed') == 'true'
    pg.locator('[data-house="1"] .hit').tap()
    panel = pg.inner_text('.panel')
    assert 'Saturn' in panel and '1st from your birth Moon, a hard place' in panel, panel
    assert pg.locator('.chart .hard-mark').count() >= 1
    pg.screenshot(path=f'{OUT}/sky.png', full_page=True)
    pg.click('#modeBirth')
    assert pg.inner_text('.panel .kind') == 'Boss'

    # the practice fight: play a strike, end the turn, leave
    pg.click('#enter'); pg.wait_for_function("document.querySelector('.fight .card') && !document.getElementById('end').disabled", timeout=10000)
    assert pg.inner_text('.fight-where') == '1st house, Pisces'
    assert 'Healing tide' in pg.inner_text('.ground-line')
    pg.wait_for_timeout(1200)  # let the hand finish being dealt
    assert pg.locator('.coach-box').count() == 1  # the guide opens on the first fight
    pg.click('#coachSkip')
    strike = pg.locator('.card', has_text='Strike').first
    strike.tap(position={'x': 18, 'y': 70})  # cards overlap: tap the visible edge
    pg.locator('.card.picked').tap()
    pg.wait_for_function("document.querySelector('.foe .hp-num').textContent.startsWith('36 /')", timeout=10000)
    pg.wait_for_function("!document.getElementById('end').disabled", timeout=10000)
    pg.click('#end')
    pg.wait_for_function("document.getElementById('turn').textContent === 'Turn 2' && !document.getElementById('end').disabled", timeout=15000)
    pg.screenshot(path=f'{OUT}/fight.png')
    assert pg.evaluate('document.documentElement.scrollWidth') <= 390
    pg.click('#leave'); pg.wait_for_selector('.chart')

    # 2. the birth is kept on the device
    pg.reload(); pg.wait_for_selector('.chart')
    assert pg.inner_text('.class-head h1') == 'The Sage'

    # 3. no time, and a place from map coordinates; old Sri Lankan time (UTC+6)
    pg.click('#edit'); pg.click('#placeChange')
    pg.fill('#date', '1999-06-01'); pg.fill('#time', '')
    pg.click('#coordsOpen'); pg.fill('#coords', '7.05, 79.92'); pg.click('#coordsUse')
    pg.click('button.primary'); pg.wait_for_selector('.reading, .chart'); pg.locator('#readBack').click() if pg.locator('#readBack').count() else None; pg.wait_for_selector('.chart')
    assert 'Read from your Moon in' in pg.inner_text('.class-head .lead')
    assert 'UTC+06:00' in pg.inner_text('.born'), pg.inner_text('.born')

    # 4. forget
    pg.click('#forget'); pg.wait_for_selector('#placeQ')
    pg.reload(); pg.wait_for_selector('#placeQ')

    # 5. Chandrashtama: on 8 Nov 2026 the Moon is in Libra, 8th from a Pisces birth Moon
    ctx2 = b.new_context(viewport={'width': 390, 'height': 844}, timezone_id='Asia/Colombo')
    pg2 = ctx2.new_page()
    pg2.clock.set_fixed_time('2026-11-08T09:00:00+05:30')
    pg2.on('pageerror', lambda e: errs.append(str(e)))
    pg2.goto(URL)
    pg2.wait_for_function("document.getElementById('placeState').textContent === ''", timeout=20000)
    pg2.fill('#date', '1985-03-21'); pg2.fill('#time', '06:45')
    pg2.fill('#placeQ', 'colombo'); pg2.wait_for_selector('#placeList li'); pg2.click('#placeList li >> nth=0')
    pg2.click('button.primary'); pg2.wait_for_selector('.reading, .chart'); pg2.locator('#readBack').click() if pg2.locator('#readBack').count() else None; pg2.wait_for_selector('.chart')
    sky2 = pg2.inner_text('.sky')
    assert 'Chandrashtama: the Moon is 8th' in sky2 and "Today's remedy, for Moon" in sky2, sky2

    assert not errs, errs
    print('screens ok')
    b.close()
