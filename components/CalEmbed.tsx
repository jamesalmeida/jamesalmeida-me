'use client'

import Cal, { getCalApi } from '@calcom/embed-react'
import { useEffect } from 'react'

export default function CalEmbed() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi()
      cal('ui', {
        theme: 'dark',
        styles: { branding: { brandColor: '#10b981' } },
        hideEventTypeDetails: false,
      })
    })()
  }, [])

  return (
    <Cal
      calLink="james-almeida"
      style={{ width: '100%', height: '100%', overflow: 'scroll' }}
      config={{ layout: 'month_view', theme: 'dark' }}
    />
  )
}
