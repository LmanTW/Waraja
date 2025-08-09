import { open, save } from '@tauri-apps/plugin-dialog'
import { openPath } from '@tauri-apps/plugin-opener'
import { signal } from '@preact/signals'
import { ComponentChild } from 'preact'
import { path } from '@tauri-apps/api'
import * as lucid from 'lucide-preact'

import Project from '../scripts/challenge/Project'

const projectFolderPath = signal<null | string>(null)
const projectDiagnostics = signal<Project.Diagnostic[]>([])
const projectData = signal<null | Project.Data>(null)
const error = signal<null | string>(null)
const progress = signal<null | string>(null)

// The create screen.
export default (): ComponentChild => {
  // Initialize a project.
  const initializeProject = async (): Promise<void> => {
    progress.value = 'Initializing a project...'

    const folderPath = await open({
      multiple: false,
      directory: true
    }) 

    if (folderPath !== null) {
      const { error: initializeError } = await Project.initialize(folderPath)

      if (initializeError !== null) {
        error.value = initializeError
        progress.value = null

        return
      }
  
      projectFolderPath.value = folderPath

      await refreshProject()
    }

    error.value = null
    progress.value = null
  } 

  // Load a project.
  const loadProject = async (): Promise<void> => {
    progress.value = 'Loading a project...'

    const folderPath = await open({
      multiple: false,
      directory: true
    })

    if (folderPath !== null) {
      projectFolderPath.value = folderPath
      projectData.value = null

      await refreshProject()
    }

    progress.value = null
  }

  // Bundle the project.
  const bundleProject = async (): Promise<void> => {
    if (projectFolderPath.value === null) {
      error.value = 'Cannot bundle the project because none is loaded.'

      return
    }

    await refreshProject()

    if (projectDiagnostics.value.length > 0) {
      error.value = 'Cannot bundle the project because some problems are found.'

      return
    }

    progress.value = 'Bundling the project...'

    const filePath = await save({
      title: 'Bundle Project',
      defaultPath: await path.downloadDir(),

      filters: [{
        name: 'Bundle Filter',
        extensions: ['waj']
      }]
    })

    if (filePath !== null) {
      const { error: projectBundleError } = await Project.bundle(projectFolderPath.value, filePath)

      if (projectBundleError !== null) {
        error.value = projectBundleError
        progress.value = null

        return
      }

      await openPath(await path.dirname(filePath))
    }

    error.value = null
    progress.value = null
  }

  // Refresh the project.
  const refreshProject = async (): Promise<void> => {
    if (projectFolderPath.value === null) {
      error.value = 'Cannot refresh the project because none is loaded.'

      return
    }

    const { error: projectDiagnoseError, data: diagnostics } = await Project.diagnose(projectFolderPath.value)


    if (projectDiagnoseError !== null) {
      error.value = projectDiagnoseError

      return
    }

    projectDiagnostics.value = diagnostics

    if (!diagnostics.find((diagnostic) => diagnostic.type === 'error')) {
      const { error: projectLoadError, data: project } = await Project.load(projectFolderPath.value)

      if (projectLoadError !== null) {
        error.value = projectLoadError

        return
      }

      projectData.value = project
    }

    error.value = null
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-medium)', backgroundColor: 'var(--color-container-medium)', borderRadius: 'var(--border-radius)', minHeight: 0, padding: 'var(--spacing-medium)', margin: 'var(--spacing-medium)', marginTop: '0rem' }}> 
      {
        (projectFolderPath.value === null) ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-container-dark)', borderRadius: 'var(--border-radius)', minHeight: 0, overflow: 'hidden' }}>
            <h2>Nothing here</h2>
            <p style={{ color: 'var(--color-foreground-fade-secondary)', marginBottom: 'var(--spacing-medium)' }}>Create or load a project to start!</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', gap: 'var(--spacing-medium)', minHeight: 0, }}>
            {
              (projectData.value === null) ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-container-dark)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)', overflow: 'auto' }}>
                  <p style={{ color: 'var(--color-foreground-fade-secondary)' }}>Cannot load the project.</p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-medium)', backgroundColor: 'var(--color-container-dark)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)', overflow: 'auto' }}>
                  <h3>Manifest</h3>
                  <div class='box-shadow' style={{ backgroundColor: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-small)' }}>
                    <h5>{projectData.value.manifest.title}</h5>
                    <p style={{ color: 'var(--color-foreground-fade-primary)' }}>{projectData.value.manifest.description}</p>
                  </div>
                </div>
              )
            }

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-medium)', backgroundColor: 'var(--color-container-dark)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)', overflow: 'auto' }}>
              <h3>Diagnostics ({projectDiagnostics.value.length})</h3>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-medium)' }}>
                {
                  projectDiagnostics.value.map((diagnostic) => (
                    <div class='box-shadow' style={{ display: 'flex', backgroundColor: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                      <div style={{ flexShrink: 0, backgroundColor: (diagnostic.type === 'error') ? 'var(--color-error)' : 'var(--color-warning)', width: 'calc(var(--border-radius) * 0.5)' }}></div>
                      <div style={{ borderRadius: 'calc(var(--border-radius) * 0.5) 0rem 0rem calc(var(--border-radius) * 0.5)', padding: 'var(--spacing-small)', marginLeft: 'var(--spacing-tiny)' }}>
                        <h5>{diagnostic.title}</h5>
                        <p style={{ color: 'var(--color-foreground-fade-primary)' }}>{diagnostic.description}</p> 
                      </div>
                    </div>
                  ))
                }
              </div>
            </div> 
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

      {
        (progress.value === null) ? (
          <div class='box-shadow' style={{ flexShrink: 0, display: 'flex', gap: 'var(--spacing-big)', background: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
            <lucid.FolderPlus class='icon-button' onClick={initializeProject} style={{ color: 'var(--color-foreground)' }}/>
            <lucid.FolderUp class='icon-button' onClick={loadProject} style={{ color: 'var(--color-foreground)' }}/>

            <div style={{ flex: 1 }}></div>

            <lucid.Archive class='icon-button' onClick={bundleProject} style={{ color: 'var(--color-foreground)' }}/>
            <lucid.RotateCw class='icon-button' onClick={refreshProject} style={{ color: 'var(--color-foreground)' }}/>
          </div>
        ) : (
          <div class='box-shadow' style={{ flexShrink: 0, display: 'flex', gap: 'var(--spacing-big)', background: 'var(--color-container-light)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-medium)' }}>
            <p style={{ flex: 1 }}>{progress.value}</p>
            <lucid.LoaderCircle style={{ color: 'var(--color-foreground)', animation: 'loader 0.5s linear infinite' }}/>
          </div>
        )
      }
    </div>
  )
}
