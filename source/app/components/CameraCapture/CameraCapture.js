import React, { useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import Webcam from 'react-webcam'

import css from './CameraCapture.scss'
import Button from '../Button/Button'

const videoConstraints = {
  facingMode: 'environment',
}

function CameraCapture({ onCapture, onCancel }) {
  const webcam = useRef()
  const capture = useCallback(() => {
    const canvas = webcam.current.getCanvas()
    canvas.toBlob(blob => {
      onCapture(blob)
    }, 'image/jpeg')
  }, [onCapture])

  return ReactDOM.createPortal(
    <div className={css.cameraCapture}>
      <Webcam
        ref={webcam}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
      />
      <div>
        <button className={css.button} onClick={capture} />

        <Button className={css.cancel} simple onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>,
    document.body
  )
}

export default CameraCapture
