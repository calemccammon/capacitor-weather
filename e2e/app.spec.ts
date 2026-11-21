import { expect, test, type Page } from '@playwright/test'

import { WeatherService } from './weatherService'

let service: WeatherService

test.beforeEach(async ({ page }) => {
  service = await WeatherService.standIn(page)
  await page.goto('/')
})

const searchBar = (page: Page) => page.getByRole('searchbox')
const hint = (page: Page) => page.getByText('Search for a place, or press and hold on the map')
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 840

async function chooseAsheville(page: Page): Promise<void> {
  await searchBar(page).click()
  await searchBar(page).pressSequentially('ashev')
  await page.getByText('North Carolina, United States').click()
}

/* Holding still for a time is the gesture under test, so these waits are the test. */
/* eslint-disable playwright/no-wait-for-timeout */

/** A spot on the map nothing covers: right of the side panel, or between the search bar and the sheet. */
function clearSpot(page: Page): [number, number] {
  const { width, height } = page.viewportSize()!
  return isWide(page) ? [width * 0.75, height / 2] : [width / 2, height * 0.4]
}

/** Holds a finger, or the mouse button on a device with no touch screen, on one spot. */
async function pressAndHold(page: Page, x: number, y: number): Promise<void> {
  const heldMs = 700
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) {
    const touch = await page.context().newCDPSession(page)
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await page.waitForTimeout(heldMs)
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.waitForTimeout(heldMs)
    await page.mouse.up()
  }
}

test('starts with a hint and no forecast', async ({ page }) => {
  await expect(hint(page)).toBeVisible()
  await expect(page.getByText('This week')).toBeHidden()
  await expect(page.getByLabel('Selected place')).toHaveCount(0)
})

test.describe('search', () => {
  test('shows the week of a place that was searched for and chosen', async ({ page }) => {
    await chooseAsheville(page)

    await expect(page.getByRole('heading', { name: 'Asheville' })).toBeVisible()
    await expect(page.getByText('36°F')).toBeVisible()
    await expect(page.getByText('Feels like 31°')).toBeVisible()
    await expect(page.getByText('Wind 4 mph')).toBeVisible()
    await expect(page.getByText('This week')).toBeVisible()
    await expect(page.getByText('Today', { exact: true })).toBeVisible()
    await expect(page.getByText('80%')).toBeVisible()
    await expect(page.getByText('Weather data by Open-Meteo.com')).toBeVisible()
    await expect(searchBar(page)).toHaveValue('Asheville')
    await expect(page.getByLabel('Selected place')).toBeVisible()
    // What was searched for last is the whole of what was typed.
    expect(service.searches.at(-1)?.searchParams.get('name')).toBe('ashev')
    expect(service.forecasts.at(-1)?.searchParams.get('latitude')).toBe('35.6')
  })

  test('prompts for something to type when it opens', async ({ page }) => {
    await searchBar(page).click()

    await expect(page.getByText('Type a city, town or postcode')).toBeVisible()
  })

  test('says when nothing matches, where a screen reader will hear it', async ({ page }) => {
    service.searchResults = {}

    await searchBar(page).click()
    await searchBar(page).pressSequentially('zzzz')

    await expect(
      page.locator('[aria-live=polite]', { hasText: 'Nothing found for "zzzz"' }),
    ).toBeVisible()
  })

  test('says what went wrong, and finds the place on another try', async ({ page }) => {
    service.searchStatus = 503

    await searchBar(page).click()
    await searchBar(page).pressSequentially('ashev')
    await expect(
      page.locator('[aria-live=polite]', {
        hasText: 'The weather service is having trouble. Try again in a moment.',
      }),
    ).toBeVisible()

    service.searchStatus = 200
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(page.getByText('North Carolina, United States')).toBeVisible()
  })

  test('puts the place name back when it is closed without choosing', async ({ page }) => {
    await chooseAsheville(page)
    await expect(searchBar(page)).toHaveValue('Asheville')

    await searchBar(page).click()
    await expect(searchBar(page)).toHaveValue('')
    await expect(page.getByText('Type a city, town or postcode')).toBeVisible()
    await searchBar(page).pressSequentially('zz')
    // A press anywhere else closes the results.
    await page.mouse.click(page.viewportSize()!.width - 20, page.viewportSize()!.height / 2)

    await expect(searchBar(page)).toHaveValue('Asheville')
    await expect(page.getByText('Type a city, town or postcode')).toBeHidden()
  })
})

test.describe('forecast', () => {
  test('offers another try after a failure, then shows the week', async ({ page }) => {
    service.forecastStatus = 400

    await chooseAsheville(page)
    await expect(
      page.locator('[aria-live=polite]', { hasText: 'The weather service refused the request.' }),
    ).toBeVisible()
    await expect(page.getByText('This week')).toBeHidden()

    service.forecastStatus = 200
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(page.getByText('This week')).toBeVisible()
  })

  test('brings the hint back when the place is cleared', async ({ page }) => {
    await chooseAsheville(page)
    await expect(page.getByText('This week')).toBeVisible()

    await page.getByRole('button', { name: 'Clear place' }).click()

    await expect(hint(page)).toBeVisible()
    await expect(page.getByText('This week')).toBeHidden()
    await expect(searchBar(page)).toHaveValue('')
    await expect(page.getByLabel('Selected place')).toHaveCount(0)
    // Clearing is not searching: the results stay shut.
    await expect(page.getByText('Type a city, town or postcode')).toBeHidden()
  })

  test('reads each block out as one sentence', async ({ page }) => {
    await chooseAsheville(page)

    await expect(
      page.getByLabel('Now: Clear, 36 degrees Fahrenheit, feels like 31, wind 4 mph'),
    ).toBeVisible()
    await expect(
      page.getByLabel('Sunday: Rain, low 29, high 64 degrees, 80 percent chance of precipitation'),
    ).toBeVisible()
  })

  test('shows the forecast in Celsius when that is chosen, and remembers the choice', async ({
    page,
  }) => {
    await chooseAsheville(page)
    await expect(page.getByText('36°F')).toBeVisible()

    await page.getByRole('button', { name: 'Celsius and km/h' }).click()

    await expect(page.getByText('36°C')).toBeVisible()
    await expect(page.getByText('Wind 4 km/h')).toBeVisible()
    expect(service.forecasts.at(-1)?.searchParams.get('temperature_unit')).toBe('celsius')

    await page.reload()
    await chooseAsheville(page)

    await expect(page.getByText('36°C')).toBeVisible()
  })
})

test.describe('map', () => {
  test('picks the point under a press that is held', async ({ page }) => {
    // The map gives up a press when it moves, as it does while it first settles.
    await page.locator('canvas.maplibregl-canvas').waitFor()
    await page.waitForTimeout(1000)
    await pressAndHold(page, ...clearSpot(page))

    await expect(page.getByText('This week')).toBeVisible()
    await expect(searchBar(page)).toHaveValue(/^\d+\.\d\d°[NS], \d+\.\d\d°[EW]$/)
    await expect(page.getByLabel('Selected place')).toBeVisible()
  })
})

/* eslint-enable playwright/no-wait-for-timeout */

test.describe('layout', () => {
  test(
    'shows the forecast in a side panel, with no sheet, on a wide window',
    { tag: '@wide' },
    async ({ page }) => {
      await chooseAsheville(page)

      await expect(page.locator('.side-panel').getByText('36°F')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Show more of the forecast' })).toHaveCount(0)
    },
  )

  test(
    'shows it in a sheet on a phone, which its handle pulls up and lets down',
    { tag: '@phone' },
    async ({ page }) => {
      await chooseAsheville(page)
      const thursday = page.getByLabel('Thursday: Clear, low 33, high 68 degrees')
      await expect(page.locator('.side-panel')).toHaveCount(0)
      await expect(thursday).not.toBeInViewport()

      await page.getByRole('button', { name: 'Show more of the forecast' }).click()

      await expect(thursday).toBeInViewport()

      await page.getByRole('button', { name: 'Show more of the map' }).click()

      await expect(thursday).not.toBeInViewport()
    },
  )
})
