import { open, confirm } from '@tauri-apps/plugin-dialog'
import { signal } from '@preact/signals'
import { ComponentChild } from 'preact'
import * as lucid from 'lucide-preact'
import { Link } from 'wouter-preact'

import { resolveUntil } from '../scripts/utilities'
import Library from '../scripts/Library'

const error = signal<null | string>(null)
const progress = signal<null | string>(null)

// The import screen.
export default (): ComponentChild => {
  // Import a challange.
  const importChallange = async (): Promise<void> => {
    progress.value = 'Importing a challange...'

    const filePath = await open({
      multiple: false,
      directory: false,

      filters: [{
        name: 'Bundle Filter',
        extensions: ['waj']
      }]
    })

    if (filePath !== null) {
      const { error: projectAddError } = await Library.add(filePath)

      if (projectAddError !== null) {
        error.value = projectAddError
        progress.value = null

        return
      }
    }

    error.value = null
    progress.value = null

    await refreshLibrary()
  }

  // Refresh the library.
  const refreshLibrary = async (): Promise<void> => {
    progress.value = 'Refreshing the library...'

    const { error: libraryScanError } = await resolveUntil(Library.scan(), 500)

    if (libraryScanError !== null) {
        error.value = libraryScanError
        progress.value = null

        return
    }

    error.value = null
    progress.value = null
  }

  // Remove a challange.
  const removeChallange = async (id: string): Promise<void> => {
    const confirmation = await confirm('Are you sure you want to remove the challange?', {
      title: 'Remove Challange',
      kind: 'warning'
    })

    if (confirmation) {
      await Library.remove(id)
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, margin: 'var(--spacing-medium)', marginTop: '0rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-medium)', backgroundColor: 'var(--color-container-medium)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
        {
          (progress.value === null) ? (
            <div class='box-shadow' style={{ flexShrink: 0, display: 'flex', gap: 'var(--spacing-big)', background: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
              <lucid.FileDown class='icon-button' onClick={importChallange} style={{ color: 'var(--color-foreground)' }}/>

              <div style={{ flex: 1 }}></div>

              <lucid.RotateCw class='icon-button' onClick={refreshLibrary} style={{ color: 'var(--color-foreground)' }}/>
            </div>
          ) : (
            <div class='box-shadow' style={{ flexShrink: 0, display: 'flex', gap: 'var(--spacing-big)', background: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
              <p style={{ flex: 1 }}>{progress.value}</p>
              <lucid.LoaderCircle style={{ color: 'var(--color-foreground)', animation: 'loader 0.5s linear infinite' }}/>
            </div>
          )
        }

        {
          error.value !== null && (
            <div class='box-shadow' style={{ display: 'flex', alignItems: 'center', background: 'var(--color-accent-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)', transition: 'display 1s var(--ease-outQuint)' }}>
              <p style={{ flex: 1 }}>{error.value}</p>
              <lucid.X class='icon-button' onClick={() => error.value = null} style={{ color: 'var(--color-foreground)' }}/>
            </div>
          )
        } 

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-medium)', backgroundColor: 'var(--color-container-dark)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
          {
            Library.errors.value.map((challange) => {
              return (
                <div class='box-shadow' style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-accent-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
                  <div style={{ flex: 1, marginRight: 'var(--spacing-medium)', overflow: 'hidden' }}>
                    <h3 style={{ whiteSpace: 'nowrap' }}>{challange.message}</h3>
                    <p style={{ color: 'var(--color-foreground-fade-primary)', whiteSpace: 'nowrap' }}>{challange.id}</p>
                  </div>

                  <lucid.Trash class='icon-button' onClick={() => removeChallange(challange.id)} style={{ flexShrink: 0, color: 'var(--color-foreground)' }}/>
                </div>
              )
            })
          }

          {
            Library.list.value.map((challange) => {
              return (
                <div class='box-shadow' style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
                  <Link href={`/challange/${challange.id}`} style={{ flex: 1, textDecoration: 'none', marginRight: 'var(--spacing-medium)', overflow: 'hidden', cursor: 'pointer' }}>
                    <h3 style={{ whiteSpace: 'nowrap' }}>{challange.project.manifest.title}</h3>
                    <p style={{ color: 'var(--color-foreground-fade-primary)', whiteSpace: 'nowrap' }}>{challange.project.manifest.descriptionShort}</p>
                  </Link>

                  <lucid.Trash class='icon-button' onClick={() => removeChallange(challange.id)} style={{ flexShrink: 0, color: 'var(--color-foreground)' }}/>
                </div>
              )
            })
          }

          {
            Library.list.value.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-foreground-fade-secondary)' }}>No challange in the library.</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
