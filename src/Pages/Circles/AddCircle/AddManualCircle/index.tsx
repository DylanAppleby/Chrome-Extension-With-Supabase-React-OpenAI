import { ChangeEvent, Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import FormLine from '../../../../components/FormLine'
import { useCircleContext } from '../../../../context/CircleContext'
import CreationHeader from '../../../../components/CreationHeader'
import Button from '../../../../components/Buttons/Button'
import GenerateButton from '../../../../components/Buttons/GenerateButton'
import Refresh from '../../../../components/SVGIcons/Refresh'
import Loading from '../../../../components/Loading'

import {
  resizeAndConvertImageToBuffer,
  uploadImageToSupabase,
} from '../../../../utils/helpers'
import { circlePageStatus } from '../../../../utils/constants'
import { generateCircleImage, generateTags } from '../../../../utils/edgeFunctions'

import { CircleInterface } from '../../../../types/circle'
import { initialCircleData } from '..'
import UploadIcon from '../../../../components/SVGIcons/UploadIcon'
import classNames from 'classnames'
import { BJActions } from '../../../../background/actions'

interface CircleFormData {
  name: string
  description: string
}

interface IAddManualCIrcle {
  circleData: CircleInterface
  setCircleData: Dispatch<SetStateAction<CircleInterface>>
}

export const AddManualCircle = ({ circleData, setCircleData }: IAddManualCIrcle) => {
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [circleImageUrl, setCircleImageUrl] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const { currentUrl: url, currentTabId, setPageStatus, getCircles, setCircleGenerationStatus } = useCircleContext()
  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors },
  } = useForm<CircleFormData>({
    defaultValues: circleData,
  })

  const { tags } = circleData

  const handleCreateCircle = useCallback(
    async (data: CircleFormData) => {
      if (circleImageUrl) {
        setIsSaving(true)
        const { name, description } = data
        let availableTags = tags
        if (tags.length === 1 && tags[0] === '') {
          try {
            availableTags = await generateTags(name, description)
          } catch {
            setIsSaving(false)
          }
        }

        // add tags first
        chrome.runtime.sendMessage(
          {
            action: BJActions.ADD_TAGS,
            names: availableTags,
          },
          (addedTags: string[]) => {
            chrome.runtime.sendMessage(
              {
                action: BJActions.CREATE_CIRCLE,
                circleName: name,
                circleDescription: description,
                url,
                tags: addedTags,
              },
              async (response) => {
                if (response.error) {
                  setIsSaving(false)
                } else {
                  const addedCircleId = response.data

                  try {
                    // convert the OpenAI image to resized image buffer
                    const webpBuffer = await resizeAndConvertImageToBuffer(circleImageUrl)

                    // upload the converted image to Supabase storage
                    await uploadImageToSupabase(
                      webpBuffer,
                      'media_bucket',
                      `circle_images/${addedCircleId}.webp`
                    )

                    // update the circle's logo url
                    chrome.runtime.sendMessage(
                      {
                        action: BJActions.UPDATE_CIRCLE_IMAGE_URL,
                        circleId: addedCircleId,
                      },
                      (res) => {
                        if (res === 'success') {
                          // now we want to load circles again just to make sure the result went through
                          getCircles()
                          // we need to remove the generated circles from the storage
                          chrome.runtime.sendMessage(
                            {
                              action: BJActions.REMOVE_CIRCLES_FROM_STORAGE,
                              tabId: currentTabId
                            },
                            (res) => {
                              if (res) {
                                setIsSaving(false)
                                setCircleGenerationStatus(null)
                                setPageStatus(circlePageStatus.CIRCLE_LIST)
                              }
                            }
                          )
                        } else {
                          setIsSaving(false)
                        }
                      }
                    )
                  } catch (ex) {
                    console.error(ex)
                    setIsSaving(false)
                  }
                }
              }
            )
          }
        )
      }
    },
    [circleImageUrl, currentTabId, getCircles, setCircleGenerationStatus, setPageStatus, tags, url]
  )

  const handleGenerateImage = useCallback(async () => {
    const name = getValues('name')
    const description = getValues('description')
    if (name && description) {
      setIsGeneratingImage(true)
      const result = await generateCircleImage(undefined, name, description)
      setCircleImageUrl(result.url.replaceAll('"', ''))
      setIsGeneratingImage(false)
    }
  }, [getValues])

  useEffect(() => {
    handleGenerateImage()
  }, [handleGenerateImage])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0]
    if (imgFile) {
      const reader = new FileReader()
      reader.onload = () => {
        setCircleImageUrl(reader.result as string)
      }
      reader.readAsDataURL(imgFile)
    }
  }

  return (
    <div className="w-full h-full py-5">
      <CreationHeader
        title="Create Circle"
        onBack={() => {
          setCircleData(initialCircleData)
          setPageStatus(circlePageStatus.ADD_AUTOMATICALLY)
        }}
      />
      <form
        onSubmit={handleSubmit(handleCreateCircle)}
        className="space-y-6 w-full flex flex-col items-center"
      >
        <FormLine
          title="Name:"
          id="name"
          type="text"
          error={errors.name?.message}
          {...register('name', {
            required: "Circle name is required",
            // --- will be applied if we need later ------
            // pattern: {
            //   value: /^[a-zA-Z0-9 _-]+$/,
            //   message: "Please enter a valid name"
            // }
          })}
          placeholder="Give it a good name!"
        />
        <FormLine
          title="Description:"
          id="description"
          type="text"
          error={errors.description?.message}
          {...register('description', {
            required: "Circle description is required",
            // --- will be applied if we need later ------
            // pattern: {
            //   value: /^[a-zA-Z0-9 _-]+$/,
            //   message: "Please enter a valid description"
            // }
          })}
          placeholder="What does it about?"
        />
        {isGeneratingImage ? (
          <div className="w-25 h-25 flex items-center justify-center">
            <Loading />
          </div>
        ) : (
          <div className="w-25 h-25 ">
            <div className="relative w-full h-full rounded-full bg-secondary">
              {circleImageUrl ? (
                <div>
                  <img
                    src={circleImageUrl}
                    alt="circle logo"
                    className="z-10 rounded-full w-25 h-25"
                  />
                </div>
              ) : null}
              <div
                className="absolute top-0 inset-0 flex items-center justify-center group cursor-pointer"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div
                  className={classNames('w-fit text-tertiary z-20', {
                    'hidden group-hover:flex text-transparent group-hover:text-white':
                      circleImageUrl,
                    'group-hover:text-black/50': !circleImageUrl,
                  })}
                >
                  <UploadIcon />
                </div>
              </div>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        <div className="w-full flex justify-center">
          <GenerateButton type="button" onClick={handleGenerateImage}>
            <Refresh />
            <p>{isGeneratingImage ? 'Generating' : 'Generate'}</p>
          </GenerateButton>
        </div>

        <div className="fixed bottom-6 w-fit justify-center">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Completing' : 'Complete'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddManualCircle
