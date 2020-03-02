import { values, view } from 'ramda'

import { lensTrack, lensTracks } from './data'

export const getTracks = state => values(view(lensTracks, state))
export const getTrackById = (state, id) => view(lensTrack(id), state)
