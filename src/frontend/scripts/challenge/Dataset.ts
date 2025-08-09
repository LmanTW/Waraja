import * as fs from '@tauri-apps/plugin-fs'
import { path } from '@tauri-apps/api'
import zod from 'zod'

import { Result, hash } from '../utilities'
import Project from './Project'
import Question from './Question'

// Everything dataset related.
namespace Dataset {
  // Load a dataset.
  export async function load (filePath: string): Promise<Result<string, Dataset.Data.Generic>> {
    let rawDataset!: string

    try {
      rawDataset = await fs.readTextFile(filePath)
    } catch (_) {
      return { error: `Failed to read the dataset: ${await path.basename(filePath)}`, data: null }
    }

    let parsedDataset!: unknown

    try {
      parsedDataset = JSON.parse(rawDataset)
    } catch (_) {
      return { error: `Failed to parse the dataset: ${await path.basename(filePath)}`, data: null }
    }

    const result = Dataset.Schema.Generic.safeParse(parsedDataset)

    if (!result.success) {
      return { error: `Invalid dataset: ${await path.basename(filePath)}`, data: null }
    }

    return { error: null, data: result.data }
  }

  // Diagnose a dataset.
  export async function diagnose (filePath: string): Promise<Result<string, Project.Diagnostic[]>> {
    let rawDataset!: string

    try {
      rawDataset = await fs.readTextFile(filePath)
    } catch (_) {
      return { error: `Failed to read the dataset: ${await path.basename(filePath)}`, data: null }
    }

    let parsedDataset!: unknown

    try {
      parsedDataset = JSON.parse(rawDataset)
    } catch (_) {
      return { error: null, data: [{ type: 'error', title: `Failed to parse the dataset: ${await path.basename(filePath)}`, description: 'Please use a code editor to make sure the syntax is correct.' }] }
    }

    const result = Dataset.Schema.Generic.safeParse(parsedDataset)

    if (!result.success) {
      return { error: null, data: [{ type: 'error', title: `Invalid dataset: ${await path.basename(filePath)}`, description: 'Please use a code editor to make sure all the fields are correct.' }] }
    }

    const folderPath = await path.dirname(filePath)
    const diagnostics: Project.Diagnostic[] = []

    if (result.data.groups.length === 0) diagnostics.push({ type: 'warning', title: `No group in the dataset: ${await path.basename(filePath)}`, description: 'The dataset need to have at least one group.' })

    for (let groupIndex = 0; groupIndex < result.data.groups.length; groupIndex++) {
      const group = result.data.groups[groupIndex]

      if (group.title.trim().length === 0) diagnostics.push({ type: 'warning', title: `Empty title for group ${groupIndex + 1} in dataset: ${await path.basename(filePath)}`, description: 'The title of the group cannot be empty.' })
      if (group.description.trim().length === 0) diagnostics.push({ type: 'warning', title: `Empty description for group ${groupIndex + 1} in dataset: ${await path.basename(filePath)}`, description: 'The description of the group cannot be empty.' })
      if (group.sections.length === 0) diagnostics.push({ type: 'warning', title: `No section in group ${groupIndex + 1} in dataset: ${await path.basename(filePath)}`, description: 'The group need to have at least one section.' })

      for (let sectionIndex = 0; sectionIndex < group.sections.length; sectionIndex++) {
        const section = group.sections[sectionIndex]

        if (section.name.trim().length === 0) diagnostics.push({ type: 'warning', title: `Empty name for section ${sectionIndex + 1} (group ${groupIndex + 1}) in dataset: ${await path.basename(filePath)}`, description: 'The title of the section cannot be empty.' })
        if (section.questions.length === 0) diagnostics.push({ type: 'warning', title: `No questions in section ${sectionIndex + 1} (group ${groupIndex + 1}) in dataset: ${await path.basename(filePath)}`, description: 'The section need to have at least three questions.' })
      }
    }

    return { error: null, data: diagnostics }
  }

  // Bundle a dataset.
  export async function bundle (filePath: string, bundleMap: Map<string, Project.FileContent>): Promise<Result<string, string>> {
    const { error: datasetLoadError, data: dataset } = await Dataset.load(filePath)

    if (datasetLoadError !== null) {
      return { error: datasetLoadError, data: null }
    }

    const fileData = JSON.stringify(dataset)
    const fileHash = await hash(fileData)

    bundleMap.set(`datasets/${fileHash}.json`, { type: 'Data', value: fileData })

    return { error: null, data: `datasets/${fileHash}.json` }
  }

  // The schema for the dataset.
  export namespace Schema {
    // The schema for a simple dataset.
    export const Simple = zod.object({
      type: zod.literal('simple'),
      groups: zod.array(zod.object({
        title: zod.string(),
        description: zod.string(),
  
        sections: zod.array(zod.object({
          name: zod.string().trim(),
          questions: zod.array(Question.Schema.Simple)
        }))
      }))
    })

    // The schema for a generic dataset.
    export const Generic = zod.discriminatedUnion('type', [Dataset.Schema.Simple])
  }

  // The data structure of the dataset.
  export namespace Data {
    // The data structure of a simple dataset.
    export type Simple = zod.infer<typeof Dataset.Schema.Simple>

    // The data structure of a generic dataset.
    export type Generic = zod.infer<typeof Dataset.Schema.Generic>
  }
}

export default Dataset
