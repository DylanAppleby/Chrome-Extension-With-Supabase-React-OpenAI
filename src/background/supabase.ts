import supabase from 'utils/supabase'

const GENESIS_CIRCLE_CREATION_FUNC_NAME = 'circles_checkpoint_add_new_with_genesis_post'
const GENERAL_CIRCLE_CREATION_FUNC_NAME = 'circles_checkpoint_add_new_with_tags_return_id'

export const createCircleInAutomatedMode = (
  url: string,
  name: string,
  description: string,
  tags: string[],
  isGenesisPost: boolean,
  sendResponse: (response: any) => void
) => {
  supabase
    .rpc('tags_add_new_return_all_ids', {
      tag_names: tags,
    })
    .then(async (result) => {
      const addedTags = result.data

      const { data, error } = await supabase.rpc(
        `${isGenesisPost ? GENESIS_CIRCLE_CREATION_FUNC_NAME : GENERAL_CIRCLE_CREATION_FUNC_NAME}`,
        {
          p_circle_name: name,
          p_url: url,
          p_circle_description: description,
          circle_tags: addedTags,
        }
      )

      if (!data || error) {
        sendResponse({ error: 'Failed to create circle' })
      }

      sendResponse(data)
    })
}

export const getCircleExistanceStatus = (
  circleName: string,
  sendResponse: (response: any) => void
) => {
  supabase.rpc('check_if_circle_exist', { circle_name: circleName }).then((result) => {
    const circleData = result.data
    sendResponse(circleData)
  })
}

export const getCircleOfUrl = (url: string, sendResponse: (response: any) => void) => {
  supabase.rpc('circles_get_circles_by_url', { p_url: url }).then((result) => {
    console.log('background.js: result of getting circles: ', result)
    sendResponse(result)
  })
}
