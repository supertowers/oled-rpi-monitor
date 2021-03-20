
const si = require('systeminformation')

let i2c = require('i2c-bus'),
  i2cBus = i2c.openSync(1),
  oled = require('oled-i2c-bus')

const moment = require('moment')

const font = require('oled-font-5x7')

let opts = {
  width: 128,
  height: 32,
  address: 0x3C
}

let screen = new oled(i2cBus, opts)

// do cool oled things here


// sets cursor to x = 1, y = 1

let ips, cpu, temp, mem, memAvailable, memTotal, time

let tickVars = null
let tickUpdate = null

const updateVars = async () => {
  cpu = await si.currentLoad()
  ips = (await si.networkInterfaces()).map(x => x.ip4)
  temp = Math.round((await si.cpuTemperature()).main * 10) / 10
  mem = (await si.mem())
  memAvailable = Math.round(mem.available / 1024 / 1024)
  memTotal = Math.round(mem.total / 1024 / 1024)

  tickVars = setTimeout(updateVars, 1000)
}

let page = 0


const update = async () => {

  tickUpdate = setTimeout(update, 500)

  time = new moment()

  let text = [
    `CPU: ${cpu.avgload}    ${time.format('HH:mm:ss')}`,
    `Temp: ${temp}°C`,
    `Memory: ${memAvailable}/${memTotal}Mb`,
  ]

  for (let ip of ips.filter(x => x !== '127.0.0.1')) {
    text.push(`IP: ${ip}`)
  }

  screen.clearDisplay()
  screen.setCursor(0, 0)
  screen.writeString(font, 1, text.slice(page, page + 4).join("\n"), 1, false)

  page += 1
  page = page % (text.length - 3)
}

const onEnd = async () => {
  screen.turnOffDisplay()
}

const start = async () => {
  await updateVars()
  update()
}

start()

let exceptionOccured = false;
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exceptionOccured = true;
    process.exit();
});

process.on('SIGINT', () => {
  clearTimeout(tickVars)
  clearTimeout(tickUpdate)

  process.exit()
})

process.on('exit', onEnd)




