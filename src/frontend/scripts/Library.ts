import { confirm } from '@tauri-apps/plugin-dialog'
import { path, core } from '@tauri-apps/api'
import * as fs from '@tauri-apps/plugin-fs'
import { signal } from '@preact/signals'

import { Result, ensureComplete, hash } from './utilities'
import Manifest from './challenge/Manifest'
import Project from './challenge/Project'

let challenges: { [key: string]: Project.Data } = {}

// The library.
namespace Library {
  export const list = signal<{ id: string, project: Project.Data }[]>([])
  export const errors = signal<{ id: string, message: string }[]>([])

  // Scan the library.
  export async function scan (): Promise<Result<string, null>> {
    challenges = {}
    errors.value = []

    const { error: ensureCompleteError } = await ensureComplete()

    if (ensureCompleteError !== null) {
      return { error: ensureCompleteError, data: null }
    }

    try {
      for (const entry of await fs.readDir('./Waraja/library', { baseDir: fs.BaseDirectory.Data })) {
        if (entry.isDirectory) {
          const { error: projectLoadError, data: project } = await Project.load(await path.join(await path.dataDir(), 'Waraja', 'library', entry.name))

          if (projectLoadError !== null) {
            Library.errors.value.push({ id: entry.name, message: projectLoadError })

            continue
          } 

          challenges[entry.name] = project
        }
      }
    } catch (_) {
      return { error: 'Something went wrong while scanning the library.', data: null }
    }

    Library.list.value = Object.keys(challenges).map((id) => {
      return {
        id,
        project: challenges[id]
      }
    }).sort((a, b) => a.project.manifest.title.localeCompare(b.project.manifest.title))

    return { error: null, data: null }
  }

  // Get a challange.
  export function get (id: string): Result<string, Project.Data> {
    if (challenges[id] === undefined) {
      for (const error of errors.value) {
        if (error.id === id) {
          return { error: error.message, data: null }
        }
      }

      return { error: 'Challange not found.', data: null }
    }

    return { error: null, data: challenges[id] }
  }

  // Add a challange.
  export async function add (filePath: string): Promise<Result<string, null | string>> {
    const { error: ensureCompleteError } = await ensureComplete()

    if (ensureCompleteError !== null) {
      return { error: ensureCompleteError, data: null }
    }

    let bundleHash!: string

    try {
      bundleHash = await core.invoke('hash_file', { filePath: filePath })
    } catch (_) {
      return { error: 'Something went wrong while hashing the bundle.', data: null }
    }

    const cacheFolderPath = await path.join(await path.dataDir(), 'Waraja', 'cache', bundleHash)

    try {
      await core.invoke('unbundle', { filePath: filePath, outputFolderPath: cacheFolderPath })
    } catch (_) {
      return { error: 'Something went wrong while unbundling the challange.', data: null }
    }

    const { error: projectLoadError, data: project } = await Project.load(cacheFolderPath)

    if (projectLoadError !== null) {
      return { error: projectLoadError, data: null }
    }

    const challangeTitleHash = await hash(project.manifest.title)
    const challangeFolderPath = await path.join(await path.dataDir(), 'Waraja', 'library', challangeTitleHash)

    if (await fs.exists(challangeFolderPath)) {
      const confirmation = await confirm('Are you sure you want to replace an existing challange with the same name?', {
        title: 'Replace Challange',
        kind: 'warning'
      })

      if (confirmation) {
        try {
          await fs.remove(challangeFolderPath, { recursive: true })
        } catch (_) {
          return { error: 'Something went wrong while removing the existing challange.', data: null }
        }
      } else {
        return { error: null, data: null }
      }
    }

    try {
      await fs.rename(cacheFolderPath, challangeFolderPath)
    } catch (_) {
      return { error: 'Something went wrong while importing the challange.', data: null }
    }

    return { error: null, data: challangeTitleHash }
  }

  // Remove a challange.
  export async function remove (id: string): Promise<Result<string, null>> {
    try {
      await fs.remove(await path.join(await path.dataDir(), 'Waraja', 'library', id), { recursive: true })
    } catch (_) {
      return { error: 'Something went wrong while removing the challange.', data: null }
    }

    Library.list.value = Library.list.value.filter((challange) => challange.id !== id) 

    delete challenges[id]

    return { error: null, data: null }
  }
}

export default Library
