import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Stats } from '../blocks/extra'
import { parseCounter } from './counter'

describe('parseCounter', () => {
  it('splits number from fixed text', () => {
    expect(parseCounter('10k+')).toEqual({ to: 10, decimals: 0, group: false, prefix: '', suffix: 'k+' })
    expect(parseCounter('$1,200')).toEqual({ to: 1200, decimals: 0, group: true, prefix: '$', suffix: '' })
    expect(parseCounter('4.9')).toMatchObject({ to: 4.9, decimals: 1 })
  })

  it('skips values it cannot animate', () => {
    expect(parseCounter('24/7')).toBeNull()
    expect(parseCounter('Free')).toBeNull()
    expect(parseCounter('1,20')).toBeNull()
  })
})

describe('Stats', () => {
  const items = [{ value: '48h', label: 'Delivery' }, { value: 'Free', label: 'Returns' }]

  it('tags countable values only', () => {
    const html = renderToStaticMarkup(<Stats props={{ items }} />)
    expect(html).toContain('data-count-to="48"')
    expect(html).toContain('data-count-suffix="h"')
    expect(html.match(/data-count-to/g)).toHaveLength(1)
  })

  it('can be turned off', () => {
    expect(renderToStaticMarkup(<Stats props={{ items, countUp: false }} />)).not.toContain('data-count-to')
  })
})
