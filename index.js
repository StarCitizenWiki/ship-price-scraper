const puppeteer = require('puppeteer')
const fs = require('fs');

const prices = []

const scrape = async (page, tuple) => {
  await page.goto(tuple.href)

  await page.waitForSelector('.explorer .main-view h2 > span')

  const name = await page.$$eval('.explorer .main-view h2 > span', name => {
    return name.map(name => name.textContent)
  })

  const price = await page.$$eval('.final-price', price => {
    return price.map(price => {
      return {
        price: price.dataset.value,
        currency: price.dataset.currency
      }
    })
  })

  const sortedPrice = price.sort((a, b) => {
    return a.price - b.price
  })

  const result = {
    name: name[0],
    price: sortedPrice[0],
  }

  console.log(`${JSON.stringify(result)},`)

  prices.push(result)
}

(async () => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('https://robertsspaceindustries.com/ship-matrix')
  await page.evaluate(() => {
    Ty.Api.Store.setCustomerRegion({}, {country_id:3})
  })
  await page.waitForSelector('.statbox a.other')

  const links = await page.$$eval('.statbox a.other', link => {
    return link.map(link => {
      return {
        text: link.textContent.split(' - ')[0],
        href: link.href
      }
    })
  })

  console.log('[')
  for (const link of links) {
    await scrape(page, link)
  }
  console.log(']')

  prices.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

  fs.writeFileSync(`output/output_${Date.now()}.json`, JSON.stringify(prices))

  await browser.close()
})()
