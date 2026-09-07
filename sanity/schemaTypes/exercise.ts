// schemaTypes/exercise.ts
export default {
  name: 'exercise',
  title: 'Exercise',
  type: 'document',
  fields: [
    {
      name: 'exerciseId',
      title: 'Exercise ID (RapidAPI)',
      type: 'string',
    },
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'bodyPart',
      type: 'string',
    },
    {
      name: 'target',
      title: 'Target Muscle',
      type: 'string',
    },
    {
      name: 'secondaryMuscles',
      title: 'Secondary Muscles',
      type: 'array',
      of: [{type: 'string'}],
    },
    {
      name: 'equipment',
      type: 'string',
    },
    {
      name: 'category',
      type: 'string',
      options: {
        list: [
          'strength',
          'cardio',
          'stretching',
          'plyometrics',
          'powerlifting',
          'strongman',
          'olympic weightlifting',
        ],
      },
    },
    {
      name: 'instructions',
      type: 'array',
      of: [{type: 'string'}],
    },
    {
      name: 'gifUrl',
      type: 'url',
    },
    {
      name: 'difficulty',
      type: 'string',
      options: {
        // 👇 pick one approach and stick to it
        // Option A: store lowercase (matches RapidAPI)
        list: ['beginner', 'intermediate', 'advanced'],
      },
    },
    {
      name: 'tags',
      type: 'array',
      of: [{type: 'string'}],
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'videoUrl',
      type: 'url',
    },
    {
      name: 'isActive',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      target: 'target',
      equipment: 'equipment',
      isActive: 'isActive',
    },
    prepare({title, target, equipment, isActive}: {title?: string; target?: string; equipment?: string; isActive?: boolean}) {
      const subtitleParts = [target, equipment].filter(Boolean)
      const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Exercise'

      return {
        title: title || 'Untitled exercise',
        subtitle: isActive === false ? `${subtitle} • inactive` : subtitle,
      }
    },
  },
}
