import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'

import CreateCircleItem from 'components/CreateCircleItem'
import ShareCircleItem from 'components/ShareCircleItem'
import CircleIcon from 'components/SVGIcons/CircleIcon'
import Chevron from 'components/SVGIcons/Chevron'
import Send from 'components/SVGIcons/Send'
import XIcon from 'components/SVGIcons/XIcon'

import { useCircleContext } from 'context/CircleContext'

import { BJActions } from 'background/actions'
import LoadingSpinner from 'components/LoadingSpinner'

const ShareThoughtBox = () => {
  const [comment, setComment] = useState('')
  const [showCircles, setShowCircles] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [oneClickStatusMessage, setOneClickStatusMessage] = useState('')

  const {
    circles,
    currentTabTitle,
    currentUrl,
    isOneClickCommenting,
    getCircles,
    setIsOneClickCommenting,
  } = useCircleContext()

  const commentBoxTitle = useMemo(() => {
    if (showCircles) {
      return 'Choose a circle to share'
    } else {
      return 'Send'
    }
  }, [showCircles])

  const handleCommentChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('')
    setComment(e.target.value)
  }, [])

  const handleDropDownClick = useCallback(() => {
    setErrorMessage('')
    setShowCircles(!showCircles)
  }, [showCircles])

  const handleSendIconClick = useCallback(() => {
    if (comment.length > 0) {
      setIsOneClickCommenting(true)

      const name = currentTabTitle + ' comments'

      setOneClickStatusMessage('Checking if circle exists ...')

      chrome.runtime.sendMessage(
        {
          action: BJActions.CHECK_IF_CIRCLE_EXIST,
          name,
        },
        async (res) => {
          if (res) {
            const circleId = res

            setOneClickStatusMessage('Posting comment in existed circle ...')

            chrome.runtime.sendMessage({
              action: BJActions.CREATE_POST,
              context: comment,
              circleId,
            })

            setOneClickStatusMessage('Post was created in existed circle!')
            setTimeout(() => {
              setOneClickStatusMessage('')
            }, 1500)

            setComment('')

            setIsOneClickCommenting(false)
          } else {
            setOneClickStatusMessage('Creating Circle ...')
            
            chrome.runtime.sendMessage({
                action: BJActions.CREATE_AUTO_CIRCLE,
                url: currentUrl,
                name,
                description: comment,
                tags: '',
                isGenesisPost: true,
              },
              (response) => {
                if (response.error) {
                  setOneClickStatusMessage('');
                  setErrorMessage(response.error)
                  return
                }

                setOneClickStatusMessage('done!');
                setIsOneClickCommenting(false);
                setComment('');
                getCircles();
                setTimeout(() => {
                  setOneClickStatusMessage('')
                }, 1500)

                const circleId = response

                chrome.runtime.sendMessage({
                  action: BJActions.GENERATE_CIRCLE_IMAGE_AND_UPLOAD_TO_SUPABASE_STORAGE,
                  circleId,
                  name,
                  description: comment,
                })
              }
            )
          }
        }
      )
    } else {
      setErrorMessage('Please put your thought.')
    }
  }, [comment, currentTabTitle, currentUrl, getCircles, setIsOneClickCommenting])

  return (
    <div className="w-full rounded-2.5xl bg-branding pb-2">
      <div className="pt-1 px-1">
        <input
          type="text"
          placeholder="Any thoughts?"
          value={comment}
          onChange={handleCommentChange}
          className="p-4 w-full rounded-2xl text-primary placeholder-tertiary text-base font-normal leading-normal"
        />
      </div>
      {errorMessage && (
        <p className="text-alert text-xs leading-5 font-medium px-3">{errorMessage}</p>
      )}
      {oneClickStatusMessage && (
        <p className="text-brand text-xs leading-5 font-medium px-3">{oneClickStatusMessage}</p>
      )}
      <div className="w-full flex flex-col gap-y-4">
        <div className="w-full px-2 pt-2 flex justify-between items-center">
          <div
            className={classNames(
              'flex flex-row gap-2 px-3 items-center py-2 hover:bg-brand/10 hover:rounded-2xl transition-all duration-300',
              {
                'bg-transparent hover:bg-transparent': showCircles,
                'cursor-pointer': !showCircles,
              }
            )}
            onClick={showCircles ? undefined : handleSendIconClick}
          >
            <p className="text-base leading-5 font-semibold text-brand">
              {commentBoxTitle}
            </p>
            {!showCircles && (
              <div className="text-brand">
                {isOneClickCommenting ? <LoadingSpinner size={20} /> : <Send className="w-5 h-5" />}
              </div>
            )}
          </div>
          <div
            className="flex px-3 py-2 rounded-2xl items-center justify-center gap-2 bg-brand/10"
            onClick={handleDropDownClick}
          >
            <div className="cursor-pointer text-brand">
              <CircleIcon width="20" height="20" viewBox="0 0 20 20" color="#134D2E" />
            </div>
            {showCircles ? (
              <div className="cursor-pointer text-brand">
                <XIcon />
              </div>
            ) : (
              <div className="cursor-pointer text-brand">
                <Chevron width="16" height="16" color="#134D2E" viewBox="0 0 16 16" />
              </div>
            )}
          </div>
        </div>
        {showCircles && (
          <div className="px-2">
            <CreateCircleItem />
            <div className="w-full grid grid-cols-2 gap-2 pt-2">
              {circles.map((circle) => (
                <ShareCircleItem
                  circle={circle}
                  key={circle.id}
                  comment={comment}
                  setComment={setComment}
                  setShowCircles={setShowCircles}
                  setErrorMessage={setErrorMessage}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareThoughtBox
