import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import RoundedButton from 'components/Buttons/RoundedButton'
import LoadingSpinner from 'components/LoadingSpinner'

import { useCircleContext } from 'context/CircleContext'

import { CircleInterface } from 'types/circle'
import { removeItemFromStorage } from 'background/helpers'
import { BJActions } from 'background/actions'
import { circlePageStatus } from 'utils/constants'

type AutoCircleItemProps = {
  circle: CircleInterface
  circleTagList: string[]
  onCircleCreation?: () => void
}

const AutoCircleItem: FC<AutoCircleItemProps> = (props) => {
  const { circle, circleTagList, onCircleCreation } = props

  const [isCreatingCircle, setIsCreatingCircle] = useState(false)

  const { currentUrl, currentTabId, setPageStatus, isGenesisPost } = useCircleContext()

  const handleAddClick = useCallback(() => {
    setIsCreatingCircle(true)

    const circleData = circle
    const { name, description } = circleData

    chrome.runtime.sendMessage(
      {
        action: BJActions.CREATE_AUTO_CIRCLE,
        url: currentUrl,
        name,
        description,
        tags: circleTagList,
        isGenesisPost,
      },
      (response) => {
        if (response.error) {
          console.log(response.error)
          return
        }

        const circleId = response

        removeItemFromStorage(currentTabId.toString())
        setPageStatus(circlePageStatus.CIRCLE_LIST)

        chrome.runtime.sendMessage({
          action: BJActions.GENERATE_CIRCLE_IMAGE_AND_UPLOAD_TO_SUPABASE_STORAGE,
          circleId,
          name,
          description,
        })

        setIsCreatingCircle(false)
      }
    )

    onCircleCreation?.()
  }, [
    circle,
    circleTagList,
    currentTabId,
    currentUrl,
    isGenesisPost,
    onCircleCreation,
    setPageStatus,
  ])

  return (
    <div className="p-4 transition-transform transform border border-stroke hover:bg-gray-100 flex gap-4 items-center rounded-2xl group">
      <img
        src="../duck.jpg"
        alt="circle logo"
        className=" rounded-full min-w-[48px] h-12"
      />
      <div className="w-full flex items-center">
        <div className="relative">
          <div className="flex flex-col justify-between gap-1 group-hover:text-gray-900 w-full">
            <p
              className="text-base font-bold text-primary line-clamp-1"
              title={circle.name}
            >
              {circle.name}
            </p>
            <p
              className="text-ellipsis line-clamp-2 text-sm font-medium text-tertiary"
              title={circle.description}
            >
              {circle.description}
            </p>
          </div>
        </div>
      </div>

      <div
        className={classNames('', {
          'group-hover:block hidden': !isCreatingCircle,
        })}
      >
        {isCreatingCircle ? (
          <LoadingSpinner />
        ) : (
          <RoundedButton onClick={handleAddClick} disabled={isCreatingCircle}>
            Add
          </RoundedButton>
        )}
      </div>
    </div>
  )
}

export default AutoCircleItem
