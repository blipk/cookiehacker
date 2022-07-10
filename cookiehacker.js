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
    actionManager.add({ name: 'autodeleteshimmers', autostart: true, fn: () => { clickgoldens({deleteGoldens: true, alsoClick: false}) }, interval: 10, key: 's' })
    actionManager.add({ name: 'clickgoldens', keyfn: (noop = false) => { if (noop) return 'press'; clickgoldens({}, true) },  key: 'x' })
    actionManager.add({ name: 'autoclickgoldens', autostart: true, fn: () => { clickgoldens() },  interval: 3244, key: 'f' })
    actionManager.add({ name: 'clickwraths', keyfn: (noop = false) => { if (noop) return 'press'; clickgoldens({clickTypes: ['wrath']}, true) }, key: 'z' })
    actionManager.add({ name: 'autoclickwraths', autostart: true, fn: () => { clickgoldens({clickTypes: ['wrath']}) },  interval: 1411, key: 'd' })

    actionManager.add({ name: 'popwrinklersatmaxuntilgold', autostart: false, fn: () => { checkwrinklers() },  interval: 1411, key: 'e' })

    initUI()
    buildUI()
}
if (Game) Game.abracadabra = abracadabra

let ui, actions, style, resize_ob
const bottomOffset = 400
const initUI = () => {
    //custom stylesheet
    style = document.querySelector('#hackstyle') || Object.assign(document.createElement('style'), {id: 'hackstyle'})
    document.head.querySelector('#hackstyle') ? null : document.head.appendChild(style);

    //ui / keybind helper
    ui = document.querySelector('#cookiehacker') || Object.assign(document.createElement('div'), {id: 'cookiehacker', innerHTML: ""})
    actions = ui.querySelector('#hackeractions') || Object.assign(document.createElement('div'), {id: 'hackeractions', innerHTML: ""})

    ui = document.body.querySelector('#cookiehacker') || document.body.appendChild(ui);
    actions = ui.querySelector('#hackeractions') || ui.appendChild(actions);

    resize_ob = new ResizeObserver((entries) => { styleUI() });
    resize_ob.observe(document.querySelector("#sectionLeft"));
}

const styleUI = () => {
    const leftWidth = `calc(${(document.querySelector('#sectionLeft').offsetWidth-document.querySelector('.buff').offsetWidth)}px - 2vw)`
    Object.assign(ui.style, {
        zIndex: '999999',
        fontsize: "2rem",
        position: "absolute",
        left:"1vw",
        top: (document.body.offsetHeight-bottomOffset)+"px",
    })

    Object.assign(actions.style, {
        padding: '5px',
        border: '2.5px solid',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    })

    document.querySelectorAll(`#${ui.id} > *`).forEach(l => {
        Object.assign(l.style, {
            width: leftWidth,
        })
    })
}
const buildUI = () => {
    if (!ui) initUI()
    styleUI()

    const hackerInfo = ui.querySelector('#hackerinfo') || ui.appendChild(Object.assign(document.createElement('div'), {id: 'hackerinfo', innerHTML: ``}))
    Object.assign(hackerInfo.style, {
        width: document.querySelector('#sectionLeft').offsetWidth*0.88+'px',
        height: (document.body.offsetHeight-(document.body.offsetHeight-bottomOffset)-actions.offsetHeight-50)+'px',
        marginTop: '5px',
        overflowX: 'hidden',
        overflowY: 'auto',
    })

    const updateStyle = (styleText, index = 0) => {
        if (Array.from(style.sheet.cssRules).find(r => r.cssText.includes(styleText)))
            style.sheet.deleteRule(Array.from(style.sheet.cssRules).findIndex(r => r.cssText.includes(styleText)))
        else if (Array.from(style.sheet.cssRules).find(r => styleText.includes(r.selectorText)))
            style.sheet.deleteRule(Array.from(style.sheet.cssRules).findIndex(r => styleText.includes(r.selectorText)))
        style.sheet.insertRule(styleText, Array.from(style.sheet.cssRules).length)
    }
    updateStyle(`.action-button {background-color: green; border: none;}`)
    updateStyle(`.action-info {color: green}`)
    updateStyle(`.hackaction {display: flex}`)
    updateStyle(`.hackaction > * {margin-left: 5px}`)

    for (const [name, action] of Object.entries(actionManager.actions).sort((a, b) => a[1].state() === 'press' ? 1 : b[1].state() === 'press' ? -1 : 0)) {
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
let repeatCount = 0
const nosrcInfo = function() {info(...arguments)}
const info = function() {
    if (!document.querySelector('#hackerinfo')) buildUI()
    const text = Array.from(arguments).join(' ').trim()

    const callerArgs = Array.from(arguments.callee.caller.arguments)
    const callerName = arguments.callee.caller.name
    //console.log("AA", callerName, callerArgs)
    const srcAction = Object.values(actionManager.actions).find(a => {
        const fns = a.fn?.toString().replaceAll(' ','').replaceAll("'",'').replaceAll('"','')
        const kfns = a.oKeyfn?.toString().replaceAll(' ','').replaceAll("'",'').replaceAll('"','')
        const args = JSON.stringify(callerArgs).slice(0, -1).slice(1).replaceAll(' ','').replaceAll("'",'').replaceAll('"','')

        const searchString = `${callerName}(${args})`

        /*
        console.log(a.name, fns, kfns)
        console.log("CCC", fns?.includes(callerName) )
        console.log("CCC", fns?.includes(args), fns, args )

        console.log("CCC2", kfns?.includes(callerName) )
        console.log("CCC2", kfns?.includes(args), kfns, args )

        console.log("CCC", searchString)
        console.log("CCC2", fns?.includes(searchString), fns, args )
        console.log("CCC3", kfns?.includes(searchString), kfns, args )

        //console.log("CCC", callerArgs[0]?.key === a.key, callerArgs[0]?.key, a.key)

        console.log('------------')
        */


        //if (callerArgs[0]?.key === a.key) //keyboard event
        //    return true

        return fns?.includes(searchString) || kfns?.includes(searchString)
            || text.includes(` action ${a.name}`) //from actionManager function


    })

    //console.log("XX", text, arguments.callee.caller)
    //console.log( callerArgs)


    const info = document.querySelector('#hackerinfo')
    const srcActionInfo = document.querySelector(`#${srcAction?.name}_info`)
    //const target = srcAction ?
    const lineCount = info.innerHTML.split('<br').length-1

    const repeat = (text === lastmsg && info.innerHTML.includes(text) && repeatCount < 25) || (text === srcAction?.lastMsg && srcActionInfo?.innerHTML.includes(text) && srcAction.lastMsgRepeat < 25)
    //if (lineCount > 10 && !repeat) info.innerHTML = ''
    //console.log("YY", text, repeat, srcAction)
    //console.log(srcActionInfo)


    if (srcAction && srcActionInfo) {
//        console.log(text, repeat, srcAction.lastMsg)
        srcActionInfo.innerHTML = `${repeat ? text+'.'.repeat(srcAction.lastMsgRepeat) : text}`
    } else
        info.innerHTML = `${repeat ? info.innerHTML.replace(lastmsg, lastmsg+'.') : text+'<br/>' + info.innerHTML}`


    //if (srcActionInfo && !srcActionInfo.innerHTML.x) srcActionInfo.innerHTML.x = setTimeout(() => {srcActionInfo.innerHTML = ''; srcActionInfo.innerHTML.x = null}, 9999)
    if (srcAction) {
        srcAction.lastMsg = text
        if (repeat) srcAction.lastMsgRepeat += 1
        else srcAction.lastMsgRepeat = 0
    }
    if (repeat) repeatCount += 1
    else repeatCount = 0
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
                            oKeyfn: keyfn,
                            keyfn: () => {keyfn(); buildUI();},
                            stateFunction: () => {return keyfn(true);},
                            lastMsg: '', lastMsgRepeat: 0,
                         }
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
        const okfns = action.oKeyfn.toString()
        const kfns = action.keyfn.toString()
        if (typeof action.fn === 'undefined')
            return action.stateFunction(true)
        if (!okfns.includes('this.toggle')) //no toggling on key press
            return 'press'
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
        const keyInput = `<input type="text" value="${action.key}" maxlength="1" size="1" onfocus="javascript:event.target.select()" onchange="javascript:actionManager.actions['${action.name}'].key=event.target.value"/>`
        const intervalInput = `${action.interval ? ` &nbsp;every <input type="number" min="1" onchange="javascript:actionManager.actions['${action.name}'].changeInterval(event.target.value)" style="width: ${(action.interval.toString().length * 8.8)+15}px" value='${action.interval}'>ms` : ''}`
        const label = `<label for=""${action.name}_toggle">${action.name}</label> ${intervalInput}`
        const actionInput = state === 'press' ?
            `<button type="button" id="${action.name}_toggle" class='action-button' name="${action.name}_toggle" onclick="javascript:actionManager.actions['${action.name}'].keyfn()">X</button>`
        : `<input type="checkbox" id="${action.name}_toggle" name="${action.name}_toggle" value="" onclick="javascript:a=actionManager.actions['${action.name}']; typeof a.fn === 'function' ? a.toggle() : a.keyfn()" ${state ? 'checked' : ''}>`
        const actionInfo = `<div id="${action.name}_info" class="action-info">${action.lastMsg || ''}${'.'.repeat(action.lastMsgRepeat)}</div>`
        return `${keyInput} ${actionInput} ${label} ${actionInfo}`
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
function checkwrinklers() {
    const goldenWrinklers = Game.wrinklers.filter(w => w.type === 1)
    const activeWrinklers = Game.wrinklers.filter(w => w.close !== 0)
    const normalWrinklers = Game.wrinklers.filter(w => w.close !== 0 && w.type !== 1).sort((a, b) => a.sucked - b.sucked)
    const maxWrinklers = Game.getWrinklersMax()

    if (goldenWrinklers?.length > 0 && Game.Achievements["Moistburster"].won) return info("Already have a golden wrinkler and achievements")
    if (!activeWrinklers?.length) return info("Waiting for wrinklers")
    if (activeWrinklers.length >= maxWrinklers && (goldenWrinklers?.length === 0 || !Game.Achievements["Moistburster"].won)) {
        info("Max wrinklers reached and either no golden one or no achievement yet - killing some")
        //normalWrinklers[0].hp = 0
        normalWrinklers.forEach((w, i) => setTimeout(() => {w.hp = 0}, i*1414))
    }
    return info(`Waiting for max wrinklers (${maxWrinklers})`)
}
function clickgoldens(opts = {}, keyaction = false) {
	const { nothing, clickDelay = 0, maxClick = 4000, deleteGoldens = false, deleteMin = 50, alsoClick = false, clickTypes = ['golden'] } = opts
    const goldens = document.querySelectorAll('.shimmer')
    //const goldens = Game.shimmers //this doesnt actually have all the elements when there is a large number of them
	if (goldens.length < deleteMin && deleteGoldens) return

    const wrathCount = Array.from(goldens).filter(g => g.getAttribute('alt')?.split(' ')[0].toLowerCase() === 'wrath')?.length || 0
    const goldenCount = goldens.length - wrathCount

    const allBuffs = Object.values(Game.buffs)
    const wrathKeys = Object.keys(Game.buffs).filter(b => b.multCpS <= 1)
    const wrathBuffs = Object.values(Game.buffs).filter(b => b.multCpS <= 1)

    if (!deleteGoldens && clickTypes.includes('wrath')) {
        if (allBuffs?.find(b => b.dname === 'Cursed finger')) return info("Waiting: Cursed finger active")
        //if (type === 'wrath' && wrathBuffs?.find(b => b.dname === 'Clot')?.time > 2000)//&& wrathBuffs?.some(b => b.time > 2000))
        //    return info(`Wrath buff is currently active for too long ${wrathBuffs[0]?.time}, not autoclicking`)
        if (allBuffs?.find(b => b.dname === 'Elder frenzy')) return info("Waiting: Elder frenzy active")
        if (wrathBuffs.length >= 3) return info("Waiting: Too many negative buffs", wrathKeys)
    }

    //if (keyaction) {
        const targetCount = deleteGoldens ? goldens.length :
                clickTypes.includes('golden') && clickTypes.includes('wrath')
                        ? goldens.length
                        : clickTypes.includes('golden') ? goldenCount : wrathCount;
        info(`${deleteGoldens ? alsoClick ? 'Deleting and clicking' : 'Deleting':'Clicking'} ${deleteGoldens ? goldens.length : maxClick === -1 || maxClick > goldens.length ? targetCount === wrathCount ? wrathCount : goldenCount : maxClick} of ${targetCount} ${clickTypes} cookies`)
    //}

    const pop = (golden, shimmer) => {
        if (shimmer) shimmer.pop()
        else golden.dispatchEvent(new Event('click', { bubbles: true, cancelable: false }))
    }
    if (deleteGoldens) {console.log("AA")}
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
			clickDelay === 0
			? pop(golden, shimmer)
            : setTimeout(() => { pop(golden, shimmer) }, clickDelay)
        }
    }
}

// Value info helper
let buildings = Object.assign([], Game.ObjectsById)
let buildingsByValue = [];
const upgrades = Object.assign([], Game.UpgradesInStore)
let upgradesByValue = [];
function showValues(log = false) {
    // Buildings
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
		if (log) nosrcInfo(`${parseInt(index,10)+1}.`, building.name, `(${building.value})`)
	}
    if (log) nosrcInfo("Building sorted values (cps per buy):")

    for (const i in buildings) {
		const building = buildings[i]
		const valueIndex = buildingsByValue.findIndex(b => b.name === building.name)

		let valueInfo = document.querySelector(`${building.name}Value`)
		if (!valueInfo) {
			valueInfo = Object.assign(document.createElement('span'), { id: building.name + 'Value', classList: 'value', innerHTML: ` (${numberFormatters[1](building.value)} per buy)(${valueIndex+1})` })
			document.querySelectorAll('.product.unlocked')[i]?.querySelector('.content > .price').appendChild(valueInfo)
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

    // store upgrades
    for (const upgrade of upgrades) {
        const price = upgrade.getPrice()

        let group
        Object.entries(Game.UpgradesByPool).forEach(([groupName, upgradeGroup]) => {
            if (!groupName) return //"" group contains all
            if (!upgradeGroup.includes(upgrade)) return
            group = groupName
        })

        const building =  buildings.find(b => b.name == upgrade.buildingTie.name)
        const percent = (parseInt(upgrade.desc.match(/[+|-][0-9]%/g) || '+100%', 10) / 100) //non-fortune building upgrades are 'twice', which is a 100% increase

        let cpsIncrease = 0
        if (building)
            cpsIncrease = building.bought * building.last_computed_cps * percent
        else {
            if (group === 'cookie') {
                cpsIncrease = Game.unbuffedCps * percent
            } else if (group === 'debug')  {

            } else if (group === 'kitten')  {   //milk
            } else if (group === 'prestige')  {
            } else if (group === 'tech')  { //pocalypse
            } else if (group === 'toggle')  { //pocalypse/seasonal/misc
            } else {

            }
        }

        const storeEl = document.querySelector(`.upgrade[onclick*="Game.UpgradesById[${upgrade.id}]"]`)
        upgrade.cpsIncrease = cpsIncrease
        upgrade.groupName = group
        upgrade.value = price / cpsIncrease
        upgrade.El = storeEl
        
        //console.log(upgrade.name, group, percent, numberFormatters[1](cpsIncrease))
    }
    upgradesByValue = [...upgrades].sort((a, b) => { return a.value - b.value })
    upgradesByValue.forEach((upgrade, i) => {
        const storeEl = upgrade.El
        const storeInfo = storeEl.querySelector(`#${upgrade.name.replaceAll(' ','')}_storeinfo`)
                        || storeEl.appendChild(Object.assign(document.createElement('div'),{id: `${upgrade.name.replaceAll(' ','')}_storeinfo`}))
        storeInfo.innerHTML =  `(${i+1})`
        Object.assign(storeInfo.style, {
            position: 'absolute',
            width: storeEl.offsetWidth+'px',
            maxWidth: storeEl.offsetWidth+'px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        })
    })

}

abracadabra()

/*

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