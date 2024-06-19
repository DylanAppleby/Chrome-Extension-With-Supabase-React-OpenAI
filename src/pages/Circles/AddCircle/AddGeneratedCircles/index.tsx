import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import RecommendedCircles from 'pages/Circles/AddCircle/AddGeneratedCircles/RecommendedCircles'

import AutoCircleItem from 'components/AutoCircleItem'
import CreationHeader from 'components/CreationHeader'
import LoadingSpinner from 'components/LoadingSpinner'

import GenerateButton from 'components/Buttons/GenerateButton'
import Button from 'components/Buttons/Button'

import Refresh from 'components/SVGIcons/Refresh'
import Plus from 'components/SVGIcons/Plus'
import XIcon from 'components/SVGIcons/XIcon'

import { useCircleContext } from 'context/CircleContext'

import { CircleInterface } from 'types/circle'
import { getCircleLoadingMessage } from 'utils/helpers'
import { CircleGenerationStatus, circlePageStatus } from 'utils/constants'

import { BJActions } from 'background/actions'

type AddGeneratedCirclesProps = {
  circles: CircleInterface[]
  setCircles: Dispatch<SetStateAction<CircleInterface[]>>
}

const AddGeneratedCircles: FC<AddGeneratedCirclesProps> = (props) => {
  const { circles, setCircles } = props

  const [isLoading, setIsLoading] = useState(false)
  const [isFailed, setIsFailed] = useState(false)

  const [message, setMessage] = useState('')

  const {
    currentUrl,
    currentTabId,
    setPageStatus,
    circleGenerationStatus,
    setCircleGenerationStatus,
    getCircleGenerationStatus,
    setCircleData,
  } = useCircleContext()

  const tags: string[] = useMemo(() => {
    const allTags = circles.map((circle) => circle.tags).flat()

    return allTags.filter((tag, index, array) => array.indexOf(tag) === index)
  }, [circles])

  useEffect(() => {
    if (
      !circleGenerationStatus ||
      circleGenerationStatus?.status === CircleGenerationStatus.GENERATING ||
      Object.keys(circleGenerationStatus).length === 0
    ) {
      setIsLoading(true)
      return
    }

    if (circleGenerationStatus?.status === CircleGenerationStatus.FAILED) {
      setIsFailed(true)
      setIsLoading(false)
      return
    }

    setIsFailed(false)
    setIsLoading(false)
  }, [
    circleGenerationStatus,
    circleGenerationStatus?.status,
    currentTabId,
    setCircleData,
    setPageStatus,
  ])

  useEffect(() => {
    const updateStatusMessage = () => {
      const statusMessage = getCircleLoadingMessage()
      setMessage(statusMessage)
    }

    updateStatusMessage()
    const intervalId = setInterval(() => {
      updateStatusMessage()
    }, 3000)

    if (!isLoading) {
      clearInterval(intervalId)
    }

    return () => clearInterval(intervalId)
  }, [isLoading])

  const getCircles = useCallback(() => {
    setIsLoading(true)
    setCircles([])
    if (currentTabId) {
      chrome.runtime.sendMessage(
        { action: BJActions.GET_PAGE_CONTENT, tabId: currentTabId },
        (response) => {
          chrome.runtime.sendMessage(
            {
              action: BJActions.GENERATE_CIRCLES,
              pageUrl: currentUrl,
              pageContent: response,
              tabId: currentTabId,
            },
            (res: boolean) => {
              if (res) {
                getCircleGenerationStatus()
              }
            }
          )
        }
      )
    }
  }, [currentTabId, getCircleGenerationStatus, setCircles, currentUrl])

  useEffect(() => {
    if (
      circles.length === 0 &&
      (!circleGenerationStatus || Object.keys(circleGenerationStatus).length === 0)
    ) {
      getCircles()
    }
  }, [circleGenerationStatus, circles.length, getCircles])

  const handlePrevClick = useCallback(() => {
    chrome.runtime.sendMessage(
      {
        action: BJActions.REMOVE_CIRCLES_FROM_STORAGE,
        tabId: currentTabId,
      },
      (res) => {
        if (res) {
          setCircleGenerationStatus(null)
          setPageStatus(circlePageStatus.CIRCLE_LIST)
        }
      }
    )
  }, [currentTabId, setCircleGenerationStatus, setPageStatus])

  const handleManualClick = useCallback(() => {
    chrome.runtime.sendMessage(
      {
        action: BJActions.REMOVE_CIRCLES_FROM_STORAGE,
        tabId: currentTabId,
      },
      () => {
        setPageStatus(circlePageStatus.ADD_MANUALLY)
      }
    )
  }, [currentTabId, setPageStatus])

  return isLoading ? (
    <div className="w-full border-gray-600 flex flex-col gap-y-4">
      <div className="w-full flex items-center justify-between gap-x-5">
        <LoadingSpinner size={20} />
        <p className="text-sm font-bold leading-normal text-center text-primary">
          {message}...
        </p>
        <div onClick={handlePrevClick} className="cursor-pointer">
          <XIcon />
        </div>
      </div>
      <div
        className="flex gap-x-1 px-3 py-2 bg-secondary rounded-full w-fit cursor-pointer"
        onClick={handleManualClick}
      >
        <div className="text-primary">
          <Plus />
        </div>
        <button className="text-xs text-primary font-bold leading-normal">
          Create manually
        </button>
      </div>
    </div>
  ) : (
    <div className="w-full h-140 flex flex-col items-center gap-5 overflow-y-auto overflow-x-hidden scrollbar-none">
      <CreationHeader title="Create Circle" onBack={handlePrevClick} />
      <div className="w-full mb-20">
        <div className="w-full flex flex-col gap-2 justify-between">
          {!isLoading && isFailed && (
            <div className="w-full h-80 flex flex-col items-center justify-center">
              <p className="text-sm font-medium leading-normal text-center text-alert">
                Something went wrong!
              </p>
            </div>
          )}

          {!isLoading && circles.length > 0 && (
            <div className="w-full flex flex-col gap-1">
              {circles.map((circle, index) => (
                <AutoCircleItem
                  key={circle.id + index}
                  circle={circle}
                  circleTagList={tags}
                />
              ))}
            </div>
          )}
          {!isLoading && (
            <div className="w-full flex justify-center">
              <GenerateButton type="button" onClick={getCircles}>
                <Refresh />
                <p>Generate {circles.length > 0 ? 'New' : ''}</p>
              </GenerateButton>
            </div>
          )}
          <RecommendedCircles circles={circles} tags={tags} />
        </div>
      </div>
      <div className="fixed bottom-6 w-fit justify-center flex flex-col gap-5">
        <Button onClick={handleManualClick}>Create manually</Button>
      </div>
    </div>
  )
}

export default AddGeneratedCircles
