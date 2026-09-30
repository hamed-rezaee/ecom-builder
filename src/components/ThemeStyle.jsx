import { useEffect, useMemo } from 'react'
import { googleFontsUrl } from '../data/fonts'
import { themeCss, usedGoogleFonts } from '../utils/theme'

const LINK_ID = 'eb-google-fonts'

// Injects the theme CSS, and loads the Google fonts it needs into the editor page.
export default function ThemeStyle({ theme }) {
  const css = useMemo(() => themeCss(theme), [theme])
  const fontsUrl = useMemo(() => {
    const families = usedGoogleFonts(theme)
    return families.length ? googleFontsUrl(families) : ''
  }, [theme])

  useEffect(() => {
    let link = document.getElementById(LINK_ID)
    if (!fontsUrl) {
      link?.remove()
      return
    }
    if (!link) {
      link = document.createElement('link')
      link.id = LINK_ID
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (link.getAttribute('href') !== fontsUrl) link.setAttribute('href', fontsUrl)
  }, [fontsUrl])

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
