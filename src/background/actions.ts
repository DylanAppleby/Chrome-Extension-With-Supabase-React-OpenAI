export enum BJActions {
  CHECK_LOGGED_IN = 'checkLoggedIn',
  LOGIN_WITH_EMAIL_PASSWORD = 'loginWithEmailPassword',
  LOGIN_WITH_GOOGLE = 'loginWithGoogle',
  LOGOUT = 'logout',
  GET_USER_AVATAR_URL = 'getUserAvatarUrl',
  GET_PAGE_CONTENT = 'getPageContent',
  GET_CIRCLES = 'getCircles',
  GET_USER_CIRCLES = 'getUserCircles',
  GET_SIMILAR_CIRCLES_FROM_TAGS = 'getSimilarCirclesFromTags',
  GET_RECOMMENDED_CIRCLES = 'getRecommendedCircles',
  CREATE_CIRCLE = 'createCircle',
  JOIN_CIRCLE = 'joinCircle',
  CLAIM_CIRCLE = 'claimCircle',
  GENERATE_CIRCLES = 'generatedCircles',
  GENERATE_CIRCLES_WITH_HISTORY = 'generateCirclesWithHistory',
  GET_CIRCLE_GENERATION_STATUS = 'getCircleGenerationStatus',
  GENERATE_CIRCLE_IMAGE = 'generateCircleImage',
  REMOVE_CIRCLES_FROM_STORAGE = 'removeCirclesFromStorage',
  ADD_TAGS = 'addTags',
  CHECK_IF_USER_JOINED_CIRCLE = 'checkIfUserJoinedCircle',
  SHOW_CIRCLE_COUNT = 'showCircleCount',
  GET_UNIQUE_USERS_COUNT_IN_USER_CIRCLES = 'getUniqueUsersCountInUserCircles',
  GET_USER_CIRCLE_COUNT = 'getUserCirclesCount',
  CREATE_POST = 'createPost',
  CHECK_IF_CIRCLE_EXIST = 'checkIfCircleExist'
}

export enum BJMessages {
  GOOGLE_LOGIN_RESULT = 'googleLogInResult',
}
