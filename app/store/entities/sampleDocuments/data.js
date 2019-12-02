import { lensPath } from 'ramda'

export const lensSampleDocuments = lensPath(['entities', 'sampleDocuments', 'single'])
export const lensSampleCollections = lensPath(['entities', 'sampleDocuments', 'collections'])

export default {
  single: {
    employment: {
      id: 'employmentapp.pdf',
      object: 'public/samples/Research/employmentapp.png',
      title: 'Employment App',
      previewImage: '/static/images/sample-previews/employmentapp.png',
    }
  },

  collections: {

  },
}
