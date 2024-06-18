import { useCallback, useEffect, useState, useMemo } from 'react'
import classNames from 'classnames'

import LoadingSpinner from 'components/LoadingSpinner'
import LinkCircleItem from 'components/LinkCircleItem'
import LinkCommentBox from 'components/LinkCommentBox'

import { useCircleContext } from 'context/CircleContext'
import { CircleInterface } from 'types/circle'

import { BJActions } from 'background/actions'
import { TLinkSectionItems } from '@utils/constants'

const MyCircles = () => {
  const [userCircles, setUserCircles] = useState<CircleInterface[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [isCheckingIfSentComment, setIsCheckingIfSentComment] = useState<boolean>(false)
  const [isShowingLinkCommentBox, setIsShowingLinkCommentBox] = useState<boolean>(false)

  const { currentUrl, currentPageCircleIds } = useCircleContext()

  const getUserCircles = useCallback(async () => {
    if (!currentUrl) {
      return
    }

    chrome.runtime.sendMessage({ action: BJActions.GET_USER_CIRCLES }, (response) => {
      if (response.error) {
        setUserCircles([])
        setIsLoading(false)

        return
      }

      if (response.data) {
        setUserCircles(response.data)
        setIsLoading(false)
      } else {
        setUserCircles([])
        setIsLoading(false)
      }
    })
  }, [currentUrl])

  useEffect(() => {
    getUserCircles()
  }, [getUserCircles])

  const linkSectionItems = useMemo((): TLinkSectionItems[] => {
    const circleItems = userCircles.filter(
      (userCircle) => !currentPageCircleIds.includes(userCircle.id)
    )
    const circleSectionItem = circleItems.map((item, index) => ({
      item,
      index,
      isLinkCommentBox: false,
    }))

    if (activeIndex >= 0) {
      const insertIndex = activeIndex + (activeIndex % 2 ? 1 : 2)

      const newSectionItems = []

      newSectionItems.push(...circleSectionItem.slice(0, insertIndex))
      newSectionItems.push({
        item: circleItems[activeIndex],
        isLinkCommentBox: true,
      })
      newSectionItems.push(...circleSectionItem.slice(insertIndex))

      return newSectionItems
    } else {
      return circleSectionItem
    }
  }, [activeIndex, currentPageCircleIds, userCircles])

  const resultText = useMemo(() => {
    if (!isLoading && linkSectionItems.length > 0) {
      if (linkSectionItems.length > 0) {
        return 'Link ur Circles to this page'
      } else {
        return ''
      }
    }
  }, [isLoading, linkSectionItems])

  return (
    <div
      className={classNames('w-full flex flex-col justify-between mb-20', {
        hidden: linkSectionItems.length === 0,
      })}
    >
      <div className="w-full">
        {!isLoading && (
          <p className="text-xl font-medium text-primary pb-3">{resultText}</p>
        )}
      </div>
      {isLoading && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 transform self-center border-black py-4 ">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && linkSectionItems.length > 0 && (
        <div className="w-full gap-2 grid grid-cols-2">
          {linkSectionItems.map((item, index) => {
            if (item.isLinkCommentBox && isShowingLinkCommentBox) {
              return (
                <div className="col-start-1 col-span-2">
                  <LinkCommentBox
                    circle={item.item as CircleInterface}
                    isCheckingIfSentComment={isCheckingIfSentComment}
                    setIsCheckingIfSentComment={setIsCheckingIfSentComment}
                    setIsShowingLinkCommentBox={setIsShowingLinkCommentBox}
                    setActiveIndex={setActiveIndex}
                  />
                </div>
              )
            }
            return (
              <div key={index}>
                <LinkCircleItem
                  circle={item.item as CircleInterface}
                  linkCommentBoxIndex={item.index as number}
                  setActiveIndex={setActiveIndex}
                  isCheckingIfSentComment={isCheckingIfSentComment}
                  setIsCheckingIfSentComment={setIsCheckingIfSentComment}
                  setIsShowingLinkCommentBox={setIsShowingLinkCommentBox}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default MyCircles
