import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { selectPage, useSiteStore } from './store/useSiteStore'

beforeEach(() => {
  useSiteStore.getState().resetSite()
})

describe('App', () => {
  it('renders the starter page and adds a block from the palette', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getAllByRole('button', { name: /block$/i }).length).toBeGreaterThan(3)

    const before = selectPage(useSiteStore.getState()).blocks.length
    await user.click(screen.getByRole('button', { name: 'Spacer' }))
    expect(selectPage(useSiteStore.getState()).blocks).toHaveLength(before + 1)
  })

  it('filters the palette and shows an empty state', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('searchbox', { name: /search blocks/i }), 'zzzz')
    expect(screen.getByText(/No blocks match/)).toBeInTheDocument()
  })

  it('supports multi-select and delete by keyboard', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('{Control>}a{/Control}')
    expect(useSiteStore.getState().selectedIds.length).toBeGreaterThan(1)
    await user.keyboard('{Delete}')
    expect(selectPage(useSiteStore.getState()).blocks).toHaveLength(0)
    await user.keyboard('{Control>}z{/Control}')
    expect(selectPage(useSiteStore.getState()).blocks.length).toBeGreaterThan(1)
  })
})

describe('ErrorBoundary', () => {
  it('renders the fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => {
      throw new Error('boom')
    }
    render(
      <ErrorBoundary fallback={({ error }) => <p>failed: {error.message}</p>}>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('failed: boom')).toBeInTheDocument()
  })
})
