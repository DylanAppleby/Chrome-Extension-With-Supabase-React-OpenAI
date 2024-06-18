import Circles from 'pages/Circles'
import Login from 'pages/Login'

import EdenLogo from 'components/SVGIcons/EdenLogo'

import { useAuthContext } from 'context/AuthContext'

const Main = () => {
  const { isAuthenticated, isChecking, setShowLogoutBtn } = useAuthContext()

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      onClick={() => {
        setShowLogoutBtn(false)
      }}
    >
      {isChecking ? (
        <div className="w-full h-140 flex flex-col items-center justify-center">
          <EdenLogo />
        </div>
      ) : isAuthenticated ? (
        <Circles />
      ) : (
        <Login />
      )}
    </div>
  )
}

export default Main
