import { sampleForecast } from '../../../testing/fakes'
import { inUnits, isToday } from '../forecast'
import { normalizeLongitude, placeFromCoordinates } from '../place'
import { unitsForCountry } from '../units'

describe('a place', () => {
  it('picked off the map has no name', () => {
    expect(placeFromCoordinates(35.6, -82.55)).toEqual({ latitude: 35.6, longitude: -82.55 })
  })

  it('picked off a map dragged round the world has its longitude brought back', () => {
    const place = placeFromCoordinates(35.6, -82.55 + 360)

    expect(place.longitude).toBeCloseTo(-82.55, 9)
  })
})

describe('normalizeLongitude', () => {
  it.each([
    [0, 0],
    [179, 179],
    [180, -180],
    [-180, -180],
    [190, -170],
    [-190, 170],
    [360, 0],
    [725, 5],
    [-725, -5],
  ])('brings %d to %d', (longitude, expected) => {
    expect(normalizeLongitude(longitude)).toBeCloseTo(expected, 9)
  })
})

describe('units', () => {
  it('are imperial in the three countries that use them, and metric elsewhere', () => {
    expect(['US', 'LR', 'MM'].map(unitsForCountry)).toEqual(['imperial', 'imperial', 'imperial'])
    expect(unitsForCountry('GB')).toBe('metric')
    expect(unitsForCountry(null)).toBe('metric')
    expect(unitsForCountry(undefined)).toBe('metric')
  })
})

describe('a forecast', () => {
  it("knows which day is the place's own today", () => {
    const forecast = sampleForecast({ observedAt: '2026-11-21T23:30' })

    expect(forecast.days.map((each) => isToday(forecast, each))).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ])
  })
})

describe('a forecast in other units', () => {
  const metric = sampleForecast({
    days: [
      { date: '2026-11-20', low: 0, high: 10, condition: 'rain', precipitationChance: 47 },
      { date: '2026-11-21', low: -40, high: 37.5, condition: 'clear' },
    ],
  })

  it('is the same forecast in metric', () => {
    expect(inUnits(metric, 'metric')).toBe(metric)
  })

  it('has its temperatures in Fahrenheit and its wind in mph in imperial', () => {
    const imperial = inUnits(
      { ...metric, current: { ...metric.current, windSpeed: 20 } },
      'imperial',
    )

    expect(imperial.current.temperature).toBeCloseTo(35.8 * 1.8 + 32, 9)
    expect(imperial.current.feelsLike).toBeCloseTo(31.3 * 1.8 + 32, 9)
    expect(imperial.current.windSpeed).toBeCloseTo(12.43, 2)
    expect(imperial.days.map((day) => [day.low, day.high])).toEqual([
      [32, 50],
      [-40, 99.5],
    ])
  })

  it('keeps everything that has no units as it was', () => {
    const imperial = inUnits(metric, 'imperial')

    expect({ ...imperial.current, temperature: 0, feelsLike: 0, windSpeed: 0 }).toEqual({
      ...metric.current,
      temperature: 0,
      feelsLike: 0,
      windSpeed: 0,
    })
    expect(imperial.days.map((day) => ({ ...day, low: 0, high: 0 }))).toEqual(
      metric.days.map((day) => ({ ...day, low: 0, high: 0 })),
    )
  })
})
