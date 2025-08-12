import { useRoute } from 'wouter-preact'
import { ComponentChild } from 'preact'

import Project from '../scripts/challenge/Project'
import Library from '../scripts/Library'

// The challange screen.
export default (): ComponentChild => {
  const [_, params] = useRoute("/challange/:id")

  if (params === null) {
    return null
  }

  const { error: challangeGetError, data: challange } = Library.get(params.id)

  if (challangeGetError !== null) {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-medium)', margin: 'var(--spacing-medium)', marginTop: '0rem' }}>
        <div style={{ backgroundColor: 'var(--color-accent-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
          <h3 style={{ whiteSpace: 'nowrap' }}>{challangeGetError}</h3>
          <p style={{ color: 'var(--color-foreground-fade-primary)', whiteSpace: 'nowrap' }}>{params.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-container-medium)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)', margin: 'var(--spacing-medium)', marginTop: '0rem', overflow: 'hidden' }}>
      <div class='box-shadow' style={{ backgroundColor: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
        <h2>{challange!.manifest.title}</h2>
        <p style={{ color: 'var(--color-foreground-fade-primary)' }}>{challange!.manifest.descriptionLong}</p>
      </div>

      <div style={{ backgroundColor: 'var(--color-container-medium)' }}>
      </div>
    </div>
  )
}
