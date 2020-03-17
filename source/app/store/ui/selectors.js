import { view } from 'ramda'
import { lensSelectedTrack, lensHeaderProps } from './data'

import { getTrackById } from '../../store/entities/tracks/selectors'

export const getSelectedTrackId = state => view(lensSelectedTrack, state)
export const getSelectedTrack = state => getTrackById(state, getSelectedTrackId(state))

export const getHeaderProps = state => view(lensHeaderProps, state)
