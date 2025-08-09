import * as fs from '@tauri-apps/plugin-fs'
import { path, core } from '@tauri-apps/api'
import zod from 'zod'

import Manifest from './Manifest'
import Dataset from './Dataset'
import { Result } from '../utilities'

import exampleMinifist from './templates/minifest.json?raw'
import exampleDataset from './templates/dataset.json?raw'

// Everything project related.
namespace Project {
  // Initialize a project.
  export async function initialize (folderPath: string): Promise<Result<string, null>> {
    try {
      for (const file of await fs.readDir(folderPath))  {
        if (!file.name.startsWith('.')) {
          return { error: 'Cannot initialize a project beacuse the folder is not empty.', data: null }
        }
      }

      await fs.mkdir(await path.join(folderPath, 'datasets'))
      await fs.mkdir(await path.join(folderPath, 'assets'))
      await fs.mkdir(await path.join(folderPath, 'schemas'))

      await fs.writeTextFile(await path.join(folderPath, 'manifest.json'), exampleMinifist)
      await fs.writeTextFile(await path.join(folderPath, 'schemas', 'manifest.json'), JSON.stringify(zod.toJSONSchema(Manifest.Schema.extend({ $schema: zod.string() }))))

      await fs.writeTextFile(await path.join(folderPath, 'datasets', 'example.json'), exampleDataset)
      await fs.writeTextFile(await path.join(folderPath, 'schemas', 'dataset.json'), JSON.stringify(zod.toJSONSchema(zod.union([
        Dataset.Schema.Simple.extend({ $schema: zod.string() })
      ]))))
    } catch (_) {
      return { error: 'Something went wrong while initializing a project.', data: null }
    }

    return { error: null, data: null }
  }

  // Load a project.
  export async function load (folderPath: string): Promise<Result<string, Project.Data>> {
    const manifestPath = await path.join(folderPath, 'manifest.json')

    if (!await fs.exists(manifestPath)) {
      return { error: 'Manifest not found.', data: null }
    }

    const { error: manifestLoadError, data: manifest } = await Manifest.load(manifestPath)

    if (manifestLoadError !== null) {
      return { error: manifestLoadError, data: null }
    }

    const stages: Manifest.Data['stages'] = []

    for (const stage of manifest.stages) {
      stages.push({
        type: stage.type,
        dataset: await path.resolve(folderPath, stage.dataset)
      })
    }
  
    return {
      error: null,
      data: {
        manifest,
        stages
      }
    }
  }

  // Diagnose a project.
  export async function diagnose (folderPath: string): Promise<Result<string, Project.Diagnostic[]>> {
    const manifestPath = await path.join(folderPath, 'manifest.json')

    if (!await fs.exists(manifestPath)) {
      return { error: null, data: [{ type: 'error', title: 'Manifest not found.', description: 'Please make sure the folder is a valid project.' }] }
    }

    const { error: manifestDiagnoseError, data: manifestDiagnostics } = await Manifest.diagnose(manifestPath)

    if (manifestDiagnoseError !== null) {
      return { error: manifestDiagnoseError, data: null }
    }

    return { error: null, data: manifestDiagnostics }
  }

  // Bundle a project.
  export async function bundle (folderPath: string, outputPath: string): Promise<Result<string, null>> {
    const manifestPath = await path.join(folderPath, 'manifest.json')

    if (!await fs.exists(manifestPath)) {
      return { error: 'Manifest not found.', data: null }
    }

    const bundleMap = new Map<string, Project.FileContent>()

    const { error: manifestBundleError } = await Manifest.bundle(manifestPath, bundleMap)

    if (manifestBundleError !== null) {
      return { error: manifestBundleError, data: null }
    }

    const entries: { file_content: Project.FileContent, bundled_path: string }[] = []
    bundleMap.forEach((fileContent, bundlePath) => entries.push({ file_content: fileContent, bundled_path: bundlePath }))

    try {
      await core.invoke('bundle', { entries, outputFilePath: outputPath })
    } catch (error) {
      return { error: 'Something went wrong while bundling the project.', data: null }
    }

    return { error: null, data: null }
  }
  
  // The data structure of a project.
  export interface Data {
    manifest: Manifest.Data,
    stages: Manifest.Data['stages']
  }

  // The data structure of a diagnostic.
  export interface Diagnostic {
    type: 'warning' | 'error',
    title: string,
    description: string
  }

  // The data structure of a file entry.
  export interface FileEntry {
    file_content: Project.FileContent,
    bundled_path: string
  }

  // The data structure of the content of a file.
  export interface FileContent {
    type: 'Data' | 'Path',
    value: string
  }
}

export default Project
