;(async function () {
  var oldOpen = XMLHttpRequest.prototype.open
  var oldSend = XMLHttpRequest.prototype.send
  window.lastResult = null
  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    window.lastUrl = url
    oldOpen.call(this, method, url, async, user, pass)
  }
  XMLHttpRequest.prototype.send = function (data) {
    var self = this
    this.addEventListener('load', function () {
      window.lastResult = self.responseText // 存储请求的响应数据
    })
    oldSend.call(this, data)
  }
})()
const sleep = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))
const clickAndWait = async element => {
  element.click()
  await sleep(2000) // 等待异步操作完成，可以根据实际情况调整等待时间
}

const makeFetchRequest = async () => {
  try {
    const response = await fetch('http://localhost:8081/api/parts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xmlString: window.lastResult })
    })
    const data = await response.json()
    console.log('Fetch response:', data)
  } catch (error) {
    console.error('Fetch error:', error)
  }
}
const getEngines = async () => {
  // 循环处理 engines
  const engines = document.getElementById('combo-1064-picker-listEl')?.children
  if (engines) {
    const enginesArray = Array.from(engines)
    if (enginesArray.length > 0) {
      for (let engine of enginesArray) {
        await clickAndWait(engine)
        console.log(window.lastResult)
        await makeFetchRequest() // 等待 fetch 请求完成
      }
    }
  } else {
    console.log(window.lastResult)
    await makeFetchRequest() // 等待 fetch 请求完成
  }
}
const getParts = async () => {
  // 循环处理 parts
  const parts = document.getElementById('combo-1063-picker-listEl')?.children
  if (parts) {
    const partsArray = Array.from(parts)
    if (partsArray.length > 0) {
      for (let part of partsArray) {
        await clickAndWait(part)
        await getEngines()
      }
    }
  } else {
    await getEngines()
  }
}
const getModels = async () => {
  // 循环处理 models
  const models = document.getElementById('combo-1062-picker-listEl')?.children
  if (models) {
    const modelsArray = Array.from(models)
    if (modelsArray.length > 0) {
      for (let model of modelsArray) {
        await clickAndWait(model)
        await getParts()
      }
    }
  } else {
    await getParts()
  }
}
const getMakes = async () => {
  // 循环处理 makes
  const makes = document.getElementById('combo-1061-picker-listEl')?.children
  if (makes) {
    const makesArray = Array.from(makes)
    if (makesArray.length > 0) {
      for (let make of makesArray) {
        await clickAndWait(make)
        await getModels()
      }
    }
  } else {
    await getModels()
  }
}

const catchData = async () => {
  // 获取 years 列表
  const years = document.getElementById('combo-1060-picker-listEl').children
  const yearsArray = Array.from(years)
  // 主循环，遍历 years 列表
  for (let year of yearsArray) {
    await clickAndWait(year)
    await getMakes()
  }
}

catchData()