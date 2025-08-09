import zod from 'zod'

// Everything question related.
export namespace Question {
  // The schema for a question.
  export namespace Schema {
    // The schema for a simple question.
    export const Simple = zod.object({
      title: zod.string().min(1),
      description: zod.optional(zod.string().min(1)),

      answersShown: zod.array(zod.string().min(1)),
      answersHidden: zod.array(zod.string().min(1)),

      explanation: zod.string().min(1)
    })
  }
}

export default Question
