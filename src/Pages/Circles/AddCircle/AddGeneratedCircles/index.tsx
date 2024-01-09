import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { addCirclePageStatus } from "../../../../utils/constants";
import { CircleInterface } from "../../../../types/circle";
import Loading from "../../../../components/Loading";
import { Button } from "../../../../components/GeneralButton";
import AutoCircleItem from "../../../../components/AutoCircleItem";
import { getSpecificNumberOfWords } from "../../../../utils/helpers";

interface AddGeneratedCirclesInterface {
  setPageStatus: Dispatch<SetStateAction<number>>;
  setAddPageStatus: Dispatch<SetStateAction<number>>;
  url: string;
}

const AddGeneratedCircles = ({ setPageStatus, setAddPageStatus, url }: AddGeneratedCirclesInterface) => {
  const [circles, setCircles] = useState<CircleInterface[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const getCircles = useCallback(() => {
    setIsLoading(true)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.runtime.sendMessage(
        { action: "getPageContent", tabId: tabs[0].id },
        (response) => {
          chrome.runtime.sendMessage(
            {action: 'getGeneratedCircles', pageUrl: url, pageContent: response},
            (res1) => {
              console.log('Generated circles: ', res1)
              if (res1?.error && res1?.error === "context_length_exceeded") {
                const limitedWords = getSpecificNumberOfWords(response, 5000)
                chrome.runtime.sendMessage(
                  {action: 'getGeneratedCircles', pageUrl: url, pageContent: limitedWords},
                  (res2) => {
                    console.log('Generated circles with limited words: ', res2)
                    if (res2.length >= 5) {
                      setCircles(res2)
                    }
                    setIsLoading(false)
                  }
                )
              } else {
                if (res1.length >= 5) {
                  setCircles(res1)
                }
                setIsLoading(false)
              }
            }
          )
        }
      );
    });
  }, [url])

  useEffect(() => {
    getCircles()
  }, [getCircles])

  return (
    <div className="w-full h-full py-5 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl font-semibold">Choose a circle</p>
        <button
          onClick={() => setAddPageStatus(addCirclePageStatus.SELECT_OPTION)}
          className="bg-gray-500 text-white px-3 py-1 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Back
        </button>
      </div>
      {isLoading && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 transform self-center border-black py-4 ">
          <Loading />
        </div>
      )}
      {!isLoading && circles.length === 0 && (
        <div className="w-full h-[70%] flex items-center justify-center">
          <p className="text-base leading-normal font-bold">
            There are no generated circles for this page
          </p>
        </div>
      )}

      {!isLoading && circles.length > 0 && (
        <div className="h-[70%] overflow-y-auto overflow-x-hidden scrollbar-none">
          {circles.map((circle, index) => (
            <AutoCircleItem key={index} circle={circle} url={url} setPageStatus={setPageStatus} />
          ))}
        </div>
      )}
      <Button onClick={getCircles} disabled={isLoading}>{isLoading ? 'Generating' : 'Generate New'}</Button>
    </div>
  )
}

export default AddGeneratedCircles