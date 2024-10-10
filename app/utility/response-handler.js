const setDataResponse = (data, response) => {
  response.status(200)
          .json(data)
}

const setDataErrorResponse = (error, response) => {
  response.status(500)
          .json({
              code: "ServiceError",
              message: "Error occurred while processing your request."
          })
}

module.exports = {setDataErrorResponse, setDataResponse}