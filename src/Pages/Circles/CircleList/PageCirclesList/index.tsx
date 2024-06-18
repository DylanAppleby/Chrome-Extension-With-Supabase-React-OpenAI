import { useEffect } from 'react'

import CircleItem from 'components/CircleItem'

import { useCircleContext } from 'context/CircleContext'
import { BJActions } from 'background/actions'

const PageCircleList = () => {
  const { circles, isLoading, currentUrl } = useCircleContext()

  useEffect(() => {
    if (!currentUrl) {
      return
    }

    chrome.runtime.sendMessage({ action: BJActions.SHOW_CIRCLE_COUNT, currentUrl })
  }, [currentUrl])

  return isLoading ? null : (
    <div className="w-full flex flex-col gap-2 items-center justify-center">
      <p className="text-xl font-medium text-primary pb-1 w-full">
        Existing Circles on this page
      </p>
      <div className="w-full flex flex-col gap-y-2">
        {circles.map((circle, index) => (
          <CircleItem key={index} circle={circle} activeUrl={currentUrl} />
        ))}
      </div>
    </div>
  )
}

export default PageCircleList
