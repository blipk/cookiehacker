//init
const abracadabra = () => {
    actionManager.removeAll()
    //hide shimmers
    let hiddenshimmers = () => Array.from(style.sheet.cssRules).findIndex(r => r.cssText.includes('.shimmer'))
    actionManager.add({ name: 'hideshimmers', keyfn: function (noop = false)  {
        if (noop) return hiddenshimmers() !== -1
        hiddenshimmers() === -1 ? style.sheet.insertRule(`.shimmer {visibility: hidden}`, Array.from(style.sheet.cssRules).length) : style.sheet.deleteRule(hiddenshimmers())
    },  key: 'w' })

    document.onkeyup = function(e) {
        e = e || window.event;
        //console.log(e)
        const k = e.key
        if (!k) return
        for (const [name, action] of Object.entries(actionManager.actions)) {
            if (action.key != k) continue
            info("Key pressed for action:", action.name, action)
            action.keyfn()
        }
    };

    document.querySelector('#sectionRight').onmousemove = () => { showValues() }
    actionManager.add({ name: 'updateValues', autostart: true, fn: () => { showValues() }, interval: 20000, key: 'q', keyfn: () => { showValues(true) } })
    actionManager.add({ name: 'bigcookie', autostart: true, fn: () => { clickcookie() }, interval: 10, key: 'a' })
    Game.shimmersL.removeChild = (el) => { try { Game.shimmersL.removeChild(el) } catch (e) {} } // Patch errors from clicking too many golden cookies
    actionManager.add({ name: 'autodeleteshimmers', autostart: true, fn: () => { clickgoldens({deleteGoldens: true, alsoClick: true}) }, interval: 1, key: 's' })
    actionManager.add({ name: 'clickgoldens', keyfn: (noop = false) => { if (noop) return 'press'; clickgoldens({}, true) },  key: 'x' })
    actionManager.add({ name: 'autoclickgoldens', autostart: true, fn: () => { clickgoldens() },  interval: 3244, key: 'f' })
    actionManager.add({ name: 'clickwraths', keyfn: (noop = false) => { if (noop) return 'press'; clickgoldens({clickTypes: ['wrath']}, true) }, key: 'z' })
    actionManager.add({ name: 'autoclickwraths', autostart: true, fn: () => { clickgoldens({clickTypes: ['wrath']}) },  interval: 1411, key: 'd' })

    actionManager.add({ name: 'popwrinklersatmaxuntilgold', autostart: true, fn: () => {
        const goldenWrinklers = Game.wrinklers.filter(w => w.type === 1)
        const activeWrinklers = Game.wrinklers.filter(w => w.close !== 0)
        const normalWrinklers = Game.wrinklers.filter(w => w.close !== 0 && w.type !== 1).sort((a, b) => a.sucked - b.sucked)

        if (goldenWrinklers?.length > 0) return //info("Already have a golden wrinkler")
        if (!activeWrinklers?.length) return //info("No active wrinklers")
        if (activeWrinklers.length >= 10 && goldenWrinklers?.length === 0) {
            info("10 wrinklers reached and no golden one yet - killing one")
            normalWrinklers[0].hp = 0
            //normalWrinklers.forEach(w => w.hp = 0)
        }
     },  interval: 1411, key: 'e' })

    buildUI()
    ui.querySelector('#hackerinfo').innerHTML = ''
}
if (Game) Game.abracadabra = abracadabra

//custom stylesheet
const style = document.querySelector('#hackstyle') || Object.assign(document.createElement('style'), {id: 'hackstyle'})
document.head.querySelector('#hackstyle') ? null : document.head.appendChild(style);

//ui / keybind helper
let ui = document.querySelector('#cookiehacker') || Object.assign(document.createElement('div'), {id: 'cookiehacker', innerHTML: ""})
let actions = ui.querySelector('#hackeractions') || Object.assign(document.createElement('div'), {id: 'hackeractions', innerHTML: ""})
const bottomOffset = 400
Object.assign(ui.style, {
    zIndex: '999999',
    fontsize: "2rem",
    position: "absolute",
    left:"1vw",
    top: (document.body.offsetHeight-bottomOffset)+"px",
})
Object.assign(actions.style, {
    padding: '5px',
    border: '2.5px solid'
})
ui = document.body.querySelector('#cookiehacker') || document.body.appendChild(ui);
actions = ui.querySelector('#hackeractions') || ui.appendChild(actions);
const buildUI = () => {
    const hackerInfo = ui.querySelector('#hackerinfo') || ui.appendChild(Object.assign(document.createElement('div'), {id: 'hackerinfo', innerHTML: ``}))
    Object.assign(hackerInfo.style, {
        width: document.querySelector('#sectionLeft').offsetWidth*0.88+'px',
        height: (document.body.offsetHeight-(document.body.offsetHeight-bottomOffset)-actions.offsetHeight-50)+'px',
        marginTop: '5px',
        overflowX: 'hidden',
        overflowY: 'auto',
    })

    if (Array.from(style.sheet.cssRules).find(r => r.cssText.includes('action-button')))
        style.sheet.deleteRule(Array.from(style.sheet.cssRules).findIndex(r => r.cssText.includes('action-button')))
    style.sheet.insertRule(`.action-button {background-color: green; border: none;}`, 0)

    for (const [name, action] of Object.entries(actionManager.actions).sort((a, b) => a[1].state() === 'press' ? 1 : b[1].state() === 'press' ? 0 : -1)) {
        const state = action.state()
        const html = action.toggleHTML()
        //console.log(action.name, action.state())
        const aEl = actions.querySelector(`#${name}`)
        if (!aEl)
            actions.appendChild(Object.assign(document.createElement('div'), {id: name, classList: ['hackaction'], innerHTML: html}))
        else {
            if (aEl.innerHTML === html) continue
            aEl.innerHTML = html
        }

    }

}
let lastmsg = ''
const info = function() {
    if (!document.querySelector('#hackerinfo')) buildUI()

    //const srcAction = Object.values(actionManager.actions).find(a => a.keyfn?.toString().includes(arguments.callee.caller.name))
    //console.log("XX", arguments.callee.caller, Array.from(arguments.callee.caller.arguments))
    //console.log("YY", srcAction?.fn)
    const text = Array.from(arguments).join(' ')
    const info = document.querySelector('#hackerinfo')
    //const target = srcAction ?
    const lineCount = info.innerHTML.split('<br').length-1

    const repeat = text === lastmsg && info.innerHTML.includes(text)
    //if (lineCount > 10 && !repeat) info.innerHTML = ''
    info.innerHTML = `${repeat ? info.innerHTML.replace(lastmsg, lastmsg+'.') : text+'<br/>' + info.innerHTML}`
    lastmsg = text
}

//action manager
const actionManager = {
	init: (() => {try{return actionManager?.clearAll() || true}catch(e){return true}})(),
    actions: {},
    add: function(opts) {
        const { name, fn, interval, key, autostart = false, keyfn = () => { this.toggle(this.actions[name]) } } = opts
        info("adding action:", opts.name, opts)
        this.actions = {
            ...this.actions,
            ... {
                [name]: {
                    ... { id: autostart ? setInterval(() => { fn() }, interval) : null },
                    ...opts,
                    ... { start: () => this.start(name), stop: () => this.stop(name), toggle: () => this.toggle(name), toggleHTML: () => this.toggleHTML(name), state: () => this.state(name), autostart: autostart,
                            changeInterval: (interval) => this.changeInterval(name, interval),
                            keyfn: () => {keyfn(); buildUI();},
                            stateFunction: () => {return keyfn(true);}, }
                }
            }
        }
        if (autostart) fn()
    },
    removeAll: function() {
        Object.values(this.actions).forEach(a => a.stop())
        this.actions = {}
    },
    state: function(name) {
        const action = this.actions[name] || this.actions[name.name]
        if (!action) return console.log(`No action with ${name} found`)
        if (typeof action.fn === 'undefined')
            return action.stateFunction(true)
        return action.id
    },
    start: function(name, restart = false) {
        const action = this.actions[name] || this.actions[name.name]
        if (!action) return
        info("Starting action", action.name, action.interval)
        if (action.id && !restart) return
        if (restart) clearInterval(action.id)
        action.id = setInterval(() => { action.fn() }, action.interval)
        action.fn()
        buildUI()
    },
    stop: function(name) {
        const action = this.actions[name] || this.actions[name.name]
        if (!action) return
        info("Stopping action", action.name)
        clearInterval(action.id)
        action.id = null
        buildUI()
    },
    changeInterval: function(name, interval) {
        const action = this.actions[name] || this.actions[name.name]
        if (!action) return
        action.stop()
        action.interval = interval
        action.start()
    },
    toggle: function(name) {
        const action = this.actions[name] || this.actions[name.name]
        if (!action) return
		//info("Toggling action:", action.name)
        action.id ? this.stop(action) : this.start(action)
            //fn
    },
    toggleHTML: function(name) {
        const action = this.actions[name] || this.actions[name.name]
        if (!action) return
        const state = action.state()
        const stateText = state !== 'press' ? state ? 'on' : 'off' : 'press'
        const keyInput = `<input type="text" value="${action.key}" maxlength="1" size="1" onchange="javascript:actionManager.actions['${action.name}'].key=event.target.value"/>`
        const intervalInput = `${action.interval ? `every <input type="number" onchange="javascript:actionManager.actions['${action.name}'].changeInterval(event.target.value)" style="width: ${(action.interval.toString().length * 8.8)+15}px" value='${action.interval}'>ms` : ''}`
        const label = `<label for=""${action.name}_toggle">${action.name}</label> ${intervalInput}`
        const actionInput = state === 'press' ?
            `<button type="button" id="${action.name}_toggle" class='action-button' name="${action.name}_toggle" onclick="javascript:actionManager.actions['${action.name}'].keyfn()">X</button>`
        : `<input type="checkbox" id="${action.name}_toggle" name="${action.name}_toggle" value="" onclick="javascript:a=actionManager.actions['${action.name}']; typeof a.fn === 'function' ? a.toggle() : a.keyfn()" ${state ? 'checked' : ''}>`
        const actionInfo = `<div id="${action.name}_info"></div>`
        return `${keyInput} ${actionInput} ${label}`
    },
	clearAll: function() {
		for (const [name, action] of Object.entries(this.actions)) {
			this.stop(action)
		}
		return this.actions = {}
	}
}

// Game Code
function clickcookie() {
    document.querySelector('#bigCookie').dispatchEvent(new Event('click', { bubbles: true, cancelable: false }))
}

function clickgoldens(opts = {}, keyaction = false) {
	const { nothing, clickDelay = 0, maxClick = 4000, deleteGoldens = false, deleteMin = 50, alsoClick = false, clickTypes = ['golden'] } = opts
    const goldens = document.querySelectorAll('.shimmer')
    //const goldens = Game.shimmers //this doesnt actually have all the elements when there is a large number of them
	if (goldens.length < deleteMin && deleteGoldens) return

    const wrathCount = Array.from(goldens).filter(g => g.getAttribute('alt')?.split(' ')[0].toLowerCase() === 'wrath')?.length || 0
    const goldenCount = goldens.length - wrathCount
	if (keyaction) {
        const targetCount = clickTypes.includes('golden') && clickTypes.includes('wrath')
                        ? goldens.length
                        : clickTypes.includes('golden') ? goldenCount : wrathCount;
        info(`${deleteGoldens ? alsoClick ? 'Deleting and clicking' : 'Deleting':'Clicking'} ${deleteGoldens ? goldens.length : maxClick === -1 || maxClick > goldens.length ? targetCount === wrathCount ? wrathCount : goldenCount : maxClick} of ${targetCount} ${clickTypes} cookies`)
    }

    const pop = (golden, shimmer) => {
        if (shimmer) shimmer.pop()
        else golden.dispatchEvent(new Event('click', { bubbles: true, cancelable: false }))
    }
    for (const i in goldens) {
		const golden = goldens[i]
        const shimmer = Game.shimmers.find(s => s.l == golden)

		if (!golden) continue //sometimes they get deleted by the time we're here
		if (deleteGoldens) {
            if (shimmer) shimmer.die()
            if (golden.remove) golden.remove()
            if (golden.style) golden.style.display = 'none'

			if (!alsoClick) continue
		}

        if (deleteGoldens && Game.shimmers[0]?.forceObj?.type?.includes('cookie storm')) continue//don't click through storms

		if (maxClick > 0 && i >= maxClick) break
        const type = shimmer?.type || golden.getAttribute ? golden.getAttribute('alt').split(' ')[0].toLowerCase() : null
        if (clickTypes.includes(type)) {
            const allBuffs = Object.values(Game.buffs)
            const wrathKeys = Object.keys(Game.buffs).filter(b => b.multCpS <= 1)
            const wrathBuffs = Object.values(Game.buffs).filter(b => b.multCpS <= 1)

            if (allBuffs?.find(b => b.dname === 'Cursed finger')) return info("Waiting: Cursed finger active")
            //if (type === 'wrath' && wrathBuffs?.find(b => b.dname === 'Clot')?.time > 2000)//&& wrathBuffs?.some(b => b.time > 2000))
            //    return info(`Wrath buff is currently active for too long ${wrathBuffs[0]?.time}, not autoclicking`)
            if (allBuffs?.find(b => b.dname === 'Elder frenzy')) return info("Waiting: Elder frenzy active")
            if (wrathBuffs.length > 2) return info("Waiting: Too many negative buffs", wrathKeys)


			clickDelay === 0
			? pop(golden, shimmer)
            : setTimeout(() => { pop(golden, shimmer) }, clickDelay)
        }
    }
}

// Value info helper
let buildings = Object.assign([], Game.ObjectsById)
let buildingsByValue = [];
function showValues(log = false) {
    document.querySelectorAll('.value').forEach(el => el.remove())

	buildings.map((b) => {
		b.computed_cps = (b.storedTotalCps / b.amount) * Game.globalCpsMult
        if (typeof b.last_computed_cps === 'undefined') b.last_computer_cps = b.computed_cps
        b.last_computed_cps = b.computed_cps === 0 ? b.last_computed_cps : b.computed_cps

        b.value = (b.price / b.last_computed_cps)
		return b
	})

	buildingsByValue = [...buildings].sort((a, b) => {
		//numberFormatters[1](Game.ObjectsById[0].getSumPrice(1))
		const amount = b.price >= a.price
						? a.getSumPrice(parseInt((b.price / a.price), 10))
						: b.getSumPrice(parseInt(a.price / b.price, 10))

		//console.log(a.name, ' buys ', amount, b.name)
		//a.value = (amount / a.computed_cps)
		//b.value = (amount / b.computed_cps)
		return a.value - b.value
	})

	for (const i in buildingsByValue) {
        const index = buildingsByValue.length-i-1
		const building = buildingsByValue[index]
		if (log) info(`${parseInt(index,10)+1}.`, building.name, `(${building.value})`)
	}
    if (log) info("Building sorted values (cps per buy):")

    for (const i in buildings) {
		const building = buildings[i]
		const valueIndex = buildingsByValue.findIndex(b => b.name === building.name)

		let valueInfo = document.querySelector(`${building.name}Value`)
		if (!valueInfo) {
			valueInfo = Object.assign(document.createElement('span'), { id: building.name + 'Value', classList: 'value', innerHTML: ` (${numberFormatters[1](building.value)} per buy)(${valueIndex+1})` })
			document.querySelectorAll('.product.unlocked')[i].querySelector('.content > .price').appendChild(valueInfo)
		}

		valueInfo.style.color = 'black'
		if (valueIndex === 0) {
			valueInfo.style.color = 'yellow'
		} else if (valueIndex === 1) {
			valueInfo.style.color = 'orange'
		} else if (valueIndex === 2) {
			valueInfo.style.color = 'lightblue'
		}
    }

}

abracadabra()

/*
const upgrades = Game.UpgradesInStore

// Click the ticker achievement
function clickTicker(count) {
	if (count > 100) return;
	Game.tickerL.click();
	count++;
	setTimeout(() => {clickTicker(count)}, 10);
}
setTimeout(() => {clickTicker(0)}, 10)

// speed up game clock //clearInterval(speedUpGameIntervalID)
const factor = 20
let speedUpGameIntervalID = setInterval(function () {
      Game.accumulatedDelay += (factor - 1) * 1000 / Game.fps;
}, 1000 / Game.fps);
*/