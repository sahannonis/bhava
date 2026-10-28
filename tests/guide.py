"""The chart guide on a first visit, and Begin floating at the bottom of the chart.

    npm run build && npx vite preview --port 4173
    python tests/guide.py [folder for screenshots]
"""
import sys
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, timezone_id='Asia/Colombo')
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:4173/')
    pg.wait_for_selector('#opening'); pg.locator('#opening').dispatch_event('pointerdown'); pg.wait_for_selector('#opening', state='detached')
    pg.wait_for_function("document.getElementById('placeState').textContent === ''", timeout=20000)
    pg.fill('#date', '1985-03-21'); pg.fill('#time', '06:45')
    pg.fill('#placeQ', 'colombo'); pg.wait_for_selector('#placeList li'); pg.click('#placeList li >> nth=0')
    pg.click('button.primary'); pg.wait_for_selector('.reading'); pg.click('#readBack')

    # Begin floats at the bottom while the real button is further down
    pg.wait_for_selector('.begin-float:not([hidden])')
    # the guide starts on its own
    pg.wait_for_selector('.tour', timeout=6000)
    assert 'This is you: The Sage' in pg.inner_text('.tour .coach-text')
    pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/guide-1.png')
    pg.click('#tourNext')
    pg.wait_for_timeout(600)
    assert 'Your chart is the map' in pg.inner_text('.tour .coach-text')
    assert pg.is_hidden('#tourNext')  # it waits for a real tap
    pg.screenshot(path=f'{OUT}/guide-2.png')
    pg.locator('[data-house="9"] .hit').tap()
    pg.wait_for_function("document.querySelector('.tour .coach-text').textContent.startsWith('This is what waits')")
    assert pg.inner_text('.panel h2') == '9th house, Scorpio'
    pg.wait_for_timeout(600); pg.screenshot(path=f'{OUT}/guide-3.png')
    for n in range(3):
        pg.click('#tourNext'); pg.wait_for_timeout(500)
    assert pg.inner_text('#tourNext') == 'Done'
    pg.screenshot(path=f'{OUT}/guide-6.png')
    pg.click('#tourNext')
    pg.wait_for_selector('.tour', state='detached')
    assert pg.evaluate("JSON.parse(localStorage.getItem('bhava.settings')).mapGuideDone") is True

    # at the real Begin button the floating one goes away
    pg.locator('#begin').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    assert pg.is_hidden('.begin-float')
    # it does not come back on the next visit, but can be asked for again
    pg.reload(); pg.wait_for_selector('.chart'); pg.wait_for_timeout(3200)
    assert pg.locator('.tour').count() == 0
    pg.click('#mapGuideAgain'); pg.wait_for_selector('.tour')
    pg.click('#tourSkip'); pg.wait_for_selector('.tour', state='detached')

    assert not errs, errs
    print('guide ok')
    b.close()
