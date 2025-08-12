import * as fs from '@tauri-apps/plugin-fs'
import { path } from '@tauri-apps/api'
import zod from 'zod'

import Project from './Project'
import Dataset from './Dataset'
import { Result } from '../utilities'

// Everything manifest realted.
namespace Manifest {
  // Load a manifest.
  export async function load (filePath: string): Promise<Result<string, Manifest.Data>> {
    let rawManifest!: string

    try {
      rawManifest = await fs.readTextFile(filePath)
    } catch (_) {
      return { error: 'Failed to read the minifest.', data: null }
    }

    let parsedManifest!: unknown

    try {
      parsedManifest = JSON.parse(rawManifest)
    } catch (_) {
      return { error: 'Failed to parse the manifest.', data: null }
    }

    const result = Manifest.Schema.safeParse(parsedManifest)

    if (!result.success) {
      return { error: 'The manifest is invalid.', data: null }
    }

    return { error: null, data: result.data }
  }

  // Diagnose a manifest.
  export async function diagnose (filePath: string): Promise<Result<string, Project.Diagnostic[]>> {
    let rawManifest!: string

    try {
      rawManifest = await fs.readTextFile(filePath)
    } catch (_) { 
      return { error: 'Failed to read the minifest.', data: null }
    }

    let parsedManifest!: unknown

    try {
      parsedManifest = JSON.parse(rawManifest)
    } catch (_) { 
      return { error: null, data: [{ type: 'error', title: 'Failed to parse the manifest.', description: 'Please use a code editor to make sure the syntax is correct.' }] }
    }

    const result = Manifest.Schema.safeParse(parsedManifest)

    if (!result.success) {
      return { error: null, data: [{ type: 'error', title: 'The manifest is invalid.', description: 'Please use a code editor to make sure all the fields are correct.' }] }
    }
 
    const folderPath = await path.dirname(filePath)
    const diagnostics: Project.Diagnostic[] = []

    if (result.data.title.trim().length === 0) diagnostics.push({ type: 'warning', title: 'Empty title for the challenge.', description: 'The title of the challenge cannot be empty.' })
    if (result.data.descriptionShort.trim().length === 0) diagnostics.push({ type: 'warning', title: 'Empty short description for the challenge.', description: 'The short description of the challenge cannot be empty.' })
    if (result.data.descriptionLong.trim().length === 0) diagnostics.push({ type: 'warning', title: 'Empty long description for the challenge.', description: 'The long description of the challenge cannot be empty.' })
    if (result.data.authors.length === 0) diagnostics.push({ type: 'warning', title: 'No author for the challenge.', description: 'The challange need to have at least one author.' })

    for (let i = 0; i < result.data.stages.length; i++) {
      const datasetPath = await path.join(folderPath, result.data.stages[i].dataset)

      if (!await fs.exists(datasetPath)) {
        diagnostics.push({ type: 'warning', title: `Dataset not found for stage ${i + 1}.`, description: 'Please make sure the path to the dataset resolves correctly.' })

        continue
      }

      const { error: datasetLoadError, data: datasetDiagnostics } = await Dataset.diagnose(datasetPath)

      if (datasetLoadError !== null) {
        return { error: datasetLoadError, data: null }
      }

      diagnostics.push(...datasetDiagnostics)
    }

    return { error: null, data: diagnostics }
  }

  // Bundle a manifest.
  export async function bundle (filePath: string, bundleMap: Map<string, Project.FileContent>): Promise<Result<string, string>> {
    const { error: manifestLoadError, data: manifest } = await Manifest.load(filePath)

    if (manifestLoadError !== null) {
      return { error: manifestLoadError, data: null }
    } 

    const folderPath = await path.dirname(filePath)

    for (let i = 0; i < manifest.stages.length; i++) {
      const datasetPath = await path.join(folderPath, manifest.stages[i].dataset)

      if (!await fs.exists(datasetPath)) {
        return { error: `Dataset not found for stage ${i + 1}.`, data: null }
      }

      const { error: datasetBundleError, data: datasetBundlePath } = await Dataset.bundle(datasetPath, bundleMap)

      if (datasetBundleError !== null) {
        return { error: datasetBundleError, data: null }
      }

      manifest.stages[i].dataset = datasetBundlePath
    }

    bundleMap.set('manifest.json', { type: 'Data', value: JSON.stringify(manifest) })

    return { error: null, data: 'manifest.json' }
  }

  // The schema for the manifest.
  export const Schema = zod.object({
    title: zod.string(),
    descriptionShort: zod.string(),
    descriptionLong: zod.string(),
    authors: zod.array(zod.string()),

    stages: zod.array(zod.object({
      type: zod.union([zod.literal('pick'), zod.literal('pick-reversed'), zod.literal('input'), zod.literal('input-combined')]),
      dataset: zod.string()
    }))
  })

  // The data structure of the manifest.
  export type Data = zod.infer<typeof Manifest.Schema>
}

export default Manifest
