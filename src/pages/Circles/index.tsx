import CircleList from 'pages/Circles/CircleList'
import AddCircle from 'pages/Circles/AddCircle'
import EnlightenMe from 'pages/Circles/EnlightenMe'

import EdenLogo from 'components/SVGIcons/EdenLogo'

import { useCircleContext } from 'context/CircleContext'
import { circlePageStatus } from 'utils/constants'

const Circles = () => {
  const { pageStatus, isLoadingCGenerationStatus } = useCircleContext()
  return isLoadingCGenerationStatus ? (
    <div className="w-full h-140 flex flex-col items-center justify-center">
      <EdenLogo />
    </div>
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {pageStatus === circlePageStatus.CIRCLE_LIST && <CircleList />}
      {(pageStatus === circlePageStatus.ADD_AUTOMATICALLY ||
        pageStatus === circlePageStatus.ADD_MANUALLY) && <AddCircle />}
      {pageStatus === circlePageStatus.ENLIGHTEN_ME && <EnlightenMe />}
    </div>
  )
}

export default Circles
