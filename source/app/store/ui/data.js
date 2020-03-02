import { lensPath } from 'ramda'

export default {
  selectedTrack: 'search',
  headerProps: {},
}

export const lensSelectedTrack = lensPath(['ui', 'selectedTrack'])
export const lensHeaderProps = lensPath(['ui', 'headerProps'])
