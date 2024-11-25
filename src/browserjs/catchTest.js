const xmlToJson = xml => {
  let obj = {}
  if (xml.nodeType === 1) {
    const element = xml
    for (let i = 0; i < element.attributes.length; i++) {
      const attribute = element.attributes[i]
      obj[attribute.nodeName] = attribute.nodeValue
    }
    for (let j = 0; j < xml.childNodes.length; j++) {
      const item = xml.childNodes[j]
      const nodeName = item.nodeName
      if (typeof obj[nodeName] === 'undefined') {
        obj[nodeName] = xmlToJson(item)
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          const old = obj[nodeName]
          obj[nodeName] = []
          obj[nodeName].push(old)
        }
        obj[nodeName].push(xmlToJson(item))
      }
    }
  } else if (xml.nodeType === 3) {
    if (xml.nodeValue !== null) {
      obj = xml.nodeValue.trim()
    }
  }
  return obj
}
;(async function () {
  var oldOpen = XMLHttpRequest.prototype.open
  var oldSend = XMLHttpRequest.prototype.send
  window.lastResult = null
  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    this._url = url // 保存url到XHR对象上，供重试时使用
    this._method = method // 保存method到XHR对象上，供重试时使用
    this._async = async // 保存async标志到XHR对象上，供重试时使用
    this._user = user // 保存user到XHR对象上，供重试时使用
    this._pass = pass // 保存pass到XHR对象上，供重试时使用
    oldOpen.call(this, method, url, async, user, pass)
  }
  XMLHttpRequest.prototype.send = function (data) {
    var self = this
    var retryCount = 0
    var maxRetries = 3
    var retryDelay = 2000
    const handleLoad = async () => {
      if (self.status >= 200 && self.status < 300) {
        window.lastResult = self.responseText
        const parser = new DOMParser()
        const result = parser.parseFromString(window.lastResult, 'text/xml')
        const resultJson = xmlToJson(result.documentElement)
        if (result.documentElement.tagName == 'ShowMeThePartsDetail') {
          let yearContent =
            document.getElementById('combo-1060-inputEl').value.trim() || ''
          let makeContent =
            document.getElementById('combo-1061-inputEl').value.trim() ||
            'unknown'
          let modelContent =
            document.getElementById('combo-1062-inputEl').value.trim() ||
            'unknown'
          let typeContent =
            document.getElementById('combo-1063-inputEl').value.trim() ||
            'unknown'
          let engineContent =
            document.getElementById('combo-1064-inputEl').value.trim() || 'All'
          await makeFetchRequest(
            resultJson,
            yearContent,
            makeContent,
            modelContent,
            typeContent,
            engineContent
          )
        }
      } else {
        handleError()
      }
    }
    const handleError = () => {
      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(function () {
          console.log(`Retry ${retryCount}/${maxRetries} for ${self._url}`)
          oldOpen.call(
            self,
            self._method,
            self._url,
            self._async,
            self._user,
            self._pass
          )
          self.addEventListener('load', handleLoad)
          self.addEventListener('error', handleError)
          oldSend.call(self, data)
        }, retryDelay * retryCount)
      } else {
        console.error(`Failed after ${maxRetries} retries`)
        let yearContent =
          document.getElementById('combo-1060-inputEl').value.trim() || ''
        let makeContent =
          document.getElementById('combo-1061-inputEl').value.trim() ||
          'unknown'
        let modelContent =
          document.getElementById('combo-1062-inputEl').value.trim() ||
          'unknown'
        let typeContent =
          document.getElementById('combo-1063-inputEl').value.trim() ||
          'unknown'
        let engineContent =
          document.getElementById('combo-1064-inputEl').value.trim() || 'All'
        console.log(
          yearContent,
          makeContent,
          modelContent,
          typeContent,
          engineContent
        )
        return
      }
    }
    this.addEventListener('load', handleLoad)
    this.addEventListener('error', handleError)
    oldSend.call(this, data)
  }
})()

const makeFetchRequest = async (
  resultJson,
  year,
  make,
  model,
  type,
  engine
) => {
  try {
    // const response = await fetch('http://3.18.104.4:8080/api/parts/add', {
      const response = await fetch('http://3.18.104.4:8080/api/test/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resultJson,
        year,
        make,
        model,
        type,
        engine
      })
    })
    const data = await response.json()
    return data
  } catch (error) {

    if (error.message.includes('503')) {
      console.log('忽略 503 错误');
      return;
    }

    console.error('Fetch error:', error)
    // console.log(`Error occurred with parameters:
    //   year: ${year},
    //   make: ${make},
    //   model: ${model},
    //   type: ${type},
    //   engine: ${engine}`)
    await makeFetchRequest(resultJson, year, make, model, type, engine)
  }
}

// 根据上次数据定位的函数
const locateLastPosition = async (lastData) => {
  console.log('定位到上次抓取的位置:', lastData);

  const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
  const yearIndex = years.findIndex((year) => year.textContent.trim() === lastData.year);
  if (yearIndex === -1) {
    console.error(`未能找到年份: ${lastData.year}`);
    return { success: false };
  }
  years[yearIndex].click();
  console.log(`定位到年份: ${lastData.year}`);
  await waitForNextList(years[yearIndex], 'combo-1061-picker-listEl');

  const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
  const makeIndex = makes.findIndex((make) => make.textContent.trim() === lastData.make);
  if (makeIndex === -1) {
    console.error(`未能找到品牌: ${lastData.make}`);
    return { success: true };
  }
  makes[makeIndex].click();
  console.log(`定位到品牌: ${lastData.make}`);
  await waitForNextList(makes[makeIndex], 'combo-1062-picker-listEl');

  const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
  const modelIndex = models.findIndex((model) => model.textContent.trim() === lastData.model);
  if (modelIndex === -1) {
    console.error(`未能找到车型: ${lastData.model}`);
    return { success: true };
  }
  models[modelIndex].click();
  console.log(`定位到车型: ${lastData.model}`);
  await waitForNextList(models[modelIndex], 'combo-1063-picker-listEl');

  const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
  const typeIndex = types.findIndex((type) => type.textContent.trim() === lastData.type);
  if (typeIndex === -1) {
    console.error(`未能找到部件类型: ${lastData.type}`);
    return { success: true };
  }
  types[typeIndex].click();
  console.log(`定位到部件类型: ${lastData.type}`);
  await waitForNextList(types[typeIndex], 'combo-1064-picker-listEl');

  const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
  const engineIndex = engines.findIndex((engine) => engine.textContent.trim() === lastData.engine);

  if (lastData.engine === 'All') {
    console.log('发动机类型为 "All"，已由网页自动选择。');
    return { success: true };
  } else if (engineIndex !== -1) {
    engines[engineIndex].click();
    console.log(`定位到发动机: ${lastData.engine}`);
    return { success: true };
  }

  console.error(`未能找到发动机: ${lastData.engine}`);
  return { success: false };
};

const getEngines = async () => {
  const engines = document.getElementById('combo-1064-picker-listEl')?.children
  if (engines) {
    const enginesArray = Array.from(engines)
    if (enginesArray.length > 1) {
      for (let engine of enginesArray) {
        engine.click()
        await new Promise(resolve => setTimeout(resolve, 8000))
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 8000))
    }
  }
}
const getTypes = async () => {
  const typeInput = document.getElementById('combo-1063-inputEl')
  const types = document.getElementById('combo-1063-picker-listEl')?.children
  if (types) {
    const typesArray = Array.from(types)
    if (typesArray.length > 1) {
      if (typeInput) {
        const typeIndex = typesArray.findIndex(
          type => type.textContent.trim() === typeInput.value.trim()
        )
        if (typeIndex !== -1) {
          typesArray.splice(0, typeIndex)
        }
      }
      for (let type of typesArray) {
        await waitForNextList(type, 'combo-1064-picker-listEl')
        await getEngines()
      }
    } else {
      await getEngines()
    }
  }
}

const getModels = async () => {
  const modelInput = document.getElementById('combo-1062-inputEl')
  const models = document.getElementById('combo-1062-picker-listEl')?.children
  if (models) {
    const modelsArray = Array.from(models)
    if (modelsArray.length > 1) {
      if (modelInput) {
        const modelIndex = modelsArray.findIndex(
          model => model.textContent.trim() === modelInput.value.trim()
        )
        if (modelIndex !== -1) {
          modelsArray.splice(0, modelIndex)
        }
      }
      for (let model of modelsArray) {
        await waitForNextList(model, 'combo-1063-picker-listEl')
        await getTypes()
      }
    } else {
      await getTypes()
    }
  }
}
const getMakes = async () => {
  const makeInput = document.getElementById('combo-1061-inputEl')
  const makes = document.getElementById('combo-1061-picker-listEl')?.children
  if (makes) {
    const makesArray = Array.from(makes)
    if (makesArray.length > 1) {
      if (makeInput) {
        const makeIndex = makesArray.findIndex(
          make => make.textContent.trim() === makeInput.value.trim()
        )
        if (makeIndex !== -1) {
          makesArray.splice(0, makeIndex)
        }
      }
      for (let make of makesArray) {
        await waitForNextList(make, 'combo-1062-picker-listEl')
        await getModels()
      }
    } else {
      await getModels()
    }
  }
}

const catchData = async () => {
  const yearInput = document.getElementById('combo-1060-inputEl')
  const years = document.getElementById('combo-1060-picker-listEl').children
  const yearsArray = Array.from(years)
  if (yearInput) {
    const yearIndex = yearsArray.findIndex(
      year => year.textContent.trim() === yearInput.value.trim()
    )
    if (yearIndex !== -1) {
      yearsArray.splice(0, yearIndex)
    }
  }
  for (let year of yearsArray) {
    await waitForNextList(year, 'combo-1061-picker-listEl')
    await getMakes()
  }
}
const waitForNextList = (element, nextId) => {
  const targetNode = document.getElementById(nextId)
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver((mutations, observer) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          observer.disconnect()
          setTimeout(resolve, 4000)
          return
        }
      }
    })
    if (targetNode) {
      observer.observe(targetNode, { childList: true })
    }
    element.click()
    setTimeout(() => {
      observer.disconnect()
      resolve()
    }, 10000)
  })
}

// 获取最新数据并启动抓取任务
const fetchAndLocate = async () => {
  try {
    // const response = await fetch('http://3.18.104.4:8080/api/parts/latest');
    const response = await fetch('http://3.18.104.4:8080/api/test/latest');

    if (response.ok) {
      const data = await response.json();
      const lastData = data.latestParts?.[0];
      if (lastData) {
        const locateResult = await locateLastPosition(lastData);
        if (locateResult.success) {
          console.log('定位成功，从上次记录继续抓取...');
          await catchData(); // 定位成功后继续抓取剩余数据
          return;
        }
      }
    }
    console.error('未能获取到最新记录或定位失败，重新从头开始抓取...');
    await catchData(); // 若无法定位则从头开始抓取
  } catch (error) {
    console.error('获取最新数据时出错:', error);
    await catchData(); // 若出错也从头开始抓取
  }
};

// 调用主任务逻辑
fetchAndLocate();