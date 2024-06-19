import {
  Dispatch,
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
import { initialCircleData } from 'context/CircleContext'

import { CircleInterface } from 'types/circle'
import { getCircleLoadingMessage } from 'utils/helpers'
import { CircleGenerationStatus, circlePageStatus } from 'utils/constants'

import { BJActions } from 'background/actions'
import { setToStorage, getFromStorage, removeItemFromStorage } from 'background/helpers'

interface IAddGeneratedCircles {
  generatedCircles: CircleInterface[]
  setGeneratedCircles: Dispatch<SetStateAction<CircleInterface[]>>
}

const AddGeneratedCircles = ({
  generatedCircles: circles,
  setGeneratedCircles: setCircles,
}: IAddGeneratedCircles) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [message, setMessage] = useState(getCircleLoadingMessage());
  const [isCreatingCircle, setIsCreatingCircle] = useState(false)
  const [circleDataInfo, setCircleDataInfo] = useState(initialCircleData)
  const [addedCircleId, setAddedCircleId] = useState('');
  const [intervalId, setIntervalId] = useState<NodeJS.Timer | null>(null);

  const { currentUrl: url, currentTabId, setPageStatus, circleGenerationStatus, setCircleGenerationStatus, getCircleGenerationStatus, setCircleData, isGenesisPost } = useCircleContext()

  const tags: string[] = useMemo(() => {
    const allTags = circles.map((circle) => circle.tags).flat()
    return allTags.filter((tag, index, array) => array.indexOf(tag) === index)
  }, [circles])

  const fetchCircleDataFromStorage = useCallback(async () => {
    const result = await getFromStorage('circleData');
    if (Object.keys(result).length !== 0) {
      setCircleDataInfo(result.circleData);
    }
  }, [])

  const fetchCircleIdFromStorage = useCallback(async () => {
    try {
      const result = await getFromStorage('circleId');
      if (result) {
        if (intervalId) {
          clearInterval(intervalId);
          setIntervalId(null); // Clear the interval state after it is cleared
        }
        setAddedCircleId(result);
      } else {
        setAddedCircleId('');
      }
    } catch (error) {
      console.error('Error parsing storage value:', error);
    }
  }, [intervalId]);

  useEffect(() => {
      fetchCircleDataFromStorage();
  }, [fetchCircleDataFromStorage])

  useEffect(() => {
    if (intervalId === null) { // Only set a new interval if there's none currently
      const intervalIdToGetAddedCircleId: NodeJS.Timer = setInterval(() => {
        fetchCircleIdFromStorage();
      }, 500);
      setIntervalId(intervalIdToGetAddedCircleId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchCircleIdFromStorage, intervalId]);

  useEffect(() => {
    if (
      !circleGenerationStatus ||
      circleGenerationStatus?.status === CircleGenerationStatus.GENERATING ||
      Object.keys(circleGenerationStatus).length === 0
    ) {
      setIsLoading(true)
    } else if (circleGenerationStatus?.status === CircleGenerationStatus.FAILED) {
      setIsFailed(true)
      setIsLoading(false)
    } else {
      if (circleDataInfo !== initialCircleData) {
        if (addedCircleId === '') {
          setIsCreatingCircle(true)
          setCircleData(circleDataInfo)
        } else {
          const circleId = addedCircleId;
          const { name, description } = circleDataInfo;
          removeItemFromStorage('circleData');
          removeItemFromStorage('circleId');
          removeItemFromStorage(currentTabId.toString());
          setIsCreatingCircle(false);
          setPageStatus(circlePageStatus.CIRCLE_LIST);
          chrome.runtime.sendMessage(
            {
              action: BJActions.GENERATE_CIRCLE_IMAGE_AND_UPLOAD_TO_SUPABASE_STORAGE,
              circleId,
              name,
              description
            }
          )
        }
      }
      setIsFailed(false)
      setIsLoading(false)
    }
  }, [addedCircleId, circleDataInfo, circleGenerationStatus, circleGenerationStatus?.status, currentTabId, setCircleData, setPageStatus])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(getCircleLoadingMessage())
    }, 3000) // Change message every 3 seconds
    if (!isLoading) {
      clearInterval(intervalId) // clean up the interval if loading circles finished
    }

    return () => clearInterval(intervalId) // Clean up the interval on component unmount
  }, [isLoading]) // Empty dependency array means this effect runs once on mount

  const getCircles = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
    setIsLoading(true)
    setCircles([])
    if (currentTabId) {
      chrome.runtime.sendMessage(
        { action: BJActions.GET_PAGE_CONTENT, tabId: currentTabId },
        (response) => {
          chrome.runtime.sendMessage(
            {
              action: BJActions.GENERATE_CIRCLES,
              pageUrl: url,
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
  }, [currentTabId, getCircleGenerationStatus, intervalId, setCircles, url])

  useEffect(() => {
    if (
      circles.length === 0 &&
      (!circleGenerationStatus || Object.keys(circleGenerationStatus).length === 0)
    ) {
      getCircles()
    }
  }, [circleGenerationStatus, circles.length, getCircles])

  const handleAddClick = useCallback(
    async (circleData: CircleInterface) => {
      setIsCreatingCircle(true);

      setCircleData({
        ...circleData,
        tags,
      })
      setToStorage('circleData', JSON.stringify({ circleData, ...tags }))
      
      const { name, description } = circleData;

      chrome.runtime.sendMessage(
        {
          action: BJActions.CREATE_AUTO_CIRCLE,
          url,
          name,
          description,
          tags,
          isGenesisPost
        },
        (response) => {
          if (response.error) {
            console.log(response.error)
          } else {
            const circleId = response;
            removeItemFromStorage('circleData');
            removeItemFromStorage('circleId');
            removeItemFromStorage(currentTabId.toString());
            setIsCreatingCircle(false);
            setPageStatus(circlePageStatus.CIRCLE_LIST);
            chrome.runtime.sendMessage(
              {
                action: BJActions.GENERATE_CIRCLE_IMAGE_AND_UPLOAD_TO_SUPABASE_STORAGE,
                circleId,
                name,
                description
              }
            )
          }
        }
      )
      
    },
    [currentTabId, isGenesisPost, setCircleData, setPageStatus, tags, url]
  )

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
    removeItemFromStorage('circleId');
    removeItemFromStorage('circleData');
  }, [currentTabId, setCircleGenerationStatus, setPageStatus])

  const handleManualClick = useCallback(() => {
    chrome.runtime.sendMessage(
      {
        action: BJActions.REMOVE_CIRCLES_FROM_STORAGE,
        tabId: currentTabId,
      },
      (res) => {
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
                  key={index}
                  circle={circle}
                  url={url}
                  onAdd={() => handleAddClick(circle)}
                  isCreatingCircle={isCreatingCircle}
                />
              ))}
            </div>
          )}
          {!isLoading && (
            <div className="w-full flex justify-center">
              <GenerateButton type="button" onClick={getCircles} disabled={isCreatingCircle}>
                <Refresh />
                <p>Generate {circles.length > 0 ? 'New' : ''}</p>
              </GenerateButton>
            </div>
          )}
          <RecommendedCircles circles={circles} tags={tags} />
        </div>
      </div>
      <div className="fixed bottom-6 w-fit justify-center flex flex-col gap-5">
        <Button onClick={handleManualClick} disabled={isCreatingCircle}>Create manually</Button>
      </div>
    </div>
  )
}

export default AddGeneratedCircles
