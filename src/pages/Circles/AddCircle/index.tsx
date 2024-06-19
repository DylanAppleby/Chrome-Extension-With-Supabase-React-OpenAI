import { useEffect, useState } from 'react'

import AddManualCircle from 'pages/Circles/AddCircle/AddManualCircle'
import AddGeneratedCircles from 'pages/Circles/AddCircle/AddGeneratedCircles'

import { CircleGenerationStatus, circlePageStatus } from 'utils/constants'
import { CircleInterface } from 'types/circle'

import { useCircleContext } from 'context/CircleContext'

const AddCircle = () => {
  const { pageStatus, circleGenerationStatus, setCircleData } = useCircleContext()

  const [generatedCircles, setGeneratedCircles] = useState<CircleInterface[]>([])

  useEffect(() => {
    if (
      circleGenerationStatus?.status === CircleGenerationStatus.SUCCEEDED &&
      circleGenerationStatus.type === 'auto'
    ) {
      setGeneratedCircles(circleGenerationStatus?.result)
    } else if (
      circleGenerationStatus?.status === CircleGenerationStatus.INITIALIZED &&
      circleGenerationStatus?.type === 'manual'
    ) {
      setCircleData(circleGenerationStatus.result[0])
    }
  }, [
    circleGenerationStatus?.result,
    circleGenerationStatus?.status,
    circleGenerationStatus?.type,
    setCircleData,
  ])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-5">
      {pageStatus === circlePageStatus.ADD_AUTOMATICALLY && (
        <AddGeneratedCircles
          circles={generatedCircles}
          setCircles={setGeneratedCircles}
        />
      )}
      {pageStatus === circlePageStatus.ADD_MANUALLY && <AddManualCircle />}
    </div>
  )
}

export default AddCircle
