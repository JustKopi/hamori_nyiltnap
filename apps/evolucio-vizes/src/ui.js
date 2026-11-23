import * as Render from './render.js'
import { openInfoModal } from './info.js'
import { BALANCE, setWorldScale, densityScaleFactor } from './config.js'
import { TRAITS } from './trait-defs.js'
import { recomputeGridDims } from './grid.js'

const $ = (id) => {
  const el = document.getElementById(id)
  if (!el) {
    throw new Error(`Missing DOM element: ${id}`)
  }
  return el
}

const populationTargetSlider = $('populationTargetSlider')
const treeSlider = $('treeSlider')
const simSpeedSlider = $('simSpeedSlider')
const mfSlider = $('mfSlider')
const mrSlider = $('mrSlider')
const cxChanceSlider = $('cxChanceSlider')
const cxAmountSlider = $('cxAmountSlider')
const hotspotSlider = $('hotspotSlider')
const sizeSlider = $('sizeSlider')
const selectionViewCheck = $('selectionViewCheck')
const trailsCheck = $('trailsCheck')
const labelsCheck = $('labelsCheck')
const nightCheck = $('nightCheck')
const hiResCheck = $('hiResCheck')
const invasiveCheck = $('invasiveCheck')
const waterStartCheck = $('waterStartCheck')
const treeDespawnCheck = $('treeDespawnCheck')
const followCheck = $('followCheck')
const zoomSlider = $('zoomSlider')
const playPauseBtn = $('playPauseBtn')
const restartBtn = $('restartBtn')
const advancedToggle = $('advancedToggle')
const advancedPanel = $('advancedPanel')
const infoToggle = $('infoToggle')
const saveBtn = $('saveBtn')
const loadBtn = $('loadBtn')
const loadFileInput = $('loadFileInput')

const dayEl = $('dayEl')
const traitDayEl = $('traitDayEl')
const popEl = $('popEl')
const foodEl = $('foodEl')
const cycleMeter = $('cycleMeter')
const cycleFill = $('cycleFill')
const cycleOrb = $('cycleOrb')
const cycleCaption = $('cycleCaption')

const valueEls = {
  populationTarget: $('populationTargetVal'),
  tree: $('treeVal'),
  simSpeed: $('simSpeedVal'),
  mf: $('mfVal'),
  mr: $('mrVal'),
  cxChance: $('cxChanceVal'),
  cxAmount: $('cxAmountVal'),
  hotspot: $('hotspotVal'),
  zoom: $('zoomVal'),
  size: $('sizeVal'),
}

const statBars = {
  tank: { bar: $('tankBar'), value: $('tankAvg') },
  vision: { bar: $('visionBar'), value: $('visionAvg') },
  focus: { bar: $('focusBar'), value: $('focusAvg') },
  burst: { bar: $('burstBar'), value: $('burstAvg') },
  forage: { bar: $('forageBar'), value: $('forageAvg') },
  water: { bar: $('waterBar'), value: $('waterAvg') },
  ready: { bar: $('readyBar'), value: $('readyAvg') },
}

export const chartCanvas = $('traitChart')
export const chartCtx = chartCanvas.getContext('2d')

let simPaused = false

export function createWorldConfig() {
  return {
    populationTarget: +populationTargetSlider.value,
    treeCount: +treeSlider.value,
    mutationFrequency: +mfSlider.value,
    mutationAmount: +mrSlider.value,
    crossoverChance: +cxChanceSlider.value,
    crossoverAmount: +cxAmountSlider.value,
    hotspotShare: +hotspotSlider.value,
    invasivesEnabled: invasiveCheck.checked,
    nightEnabled: nightCheck.checked,
    waterStartEnabled: waterStartCheck.checked,
    treeDespawnDisabled: treeDespawnCheck.checked,
  }
}

export function updateCycleMeter(world) {
  const duration = world.phase === 'day' ? BALANCE.DAY_LENGTH : BALANCE.NIGHT_LENGTH
  const progress = Math.max(0, Math.min(1, world.phaseTick / duration))
  const percent = `${progress * 100}%`
  cycleFill.style.width = percent
  cycleOrb.style.left = percent
  cycleMeter.classList.toggle('is-night', world.phase === 'night')
  cycleCaption.textContent = world.phase === 'day'
    ? `Nappal ${Math.round(progress * 100)}%`
    : `Éjszaka ${Math.round(progress * 100)}%`
}

export function updateHud(world) {
  dayEl.textContent = world.day.toString()
  traitDayEl.textContent = `Nap ${world.day}`
  popEl.textContent = world.creatures.length.toString()
  foodEl.textContent = world.food.length.toString()

  const sums = Object.fromEntries(TRAITS.map((t) => [t, 0]))
  let ready = 0
  const count = Math.max(1, world.creatures.length)
  for (const c of world.creatures) {
    for (const t of TRAITS) {
      sums[t] += c.genome[t]
    }
    if (c.foodHeld >= BALANCE.SURVIVAL_RESERVE + 1 && !c.reproductionBlocked) {
      ready++
    }
  }
  for (const t of TRAITS) {
    const avg = sums[t] / count
    statBars[t].bar.style.width = `${avg * 100}%`
    statBars[t].value.textContent = avg.toFixed(2)
  }
  const readyRatio = ready / count
  statBars.ready.bar.style.width = `${readyRatio * 100}%`
  statBars.ready.value.textContent = `${Math.round(readyRatio * 100)}%`
}

export function updateLabels() {
  valueEls.populationTarget.textContent = populationTargetSlider.value
  valueEls.tree.textContent = treeSlider.value
  valueEls.simSpeed.textContent = simSpeedSlider.value
  valueEls.mf.textContent = (+mfSlider.value).toFixed(2)
  valueEls.mr.textContent = (+mrSlider.value).toFixed(2)
  valueEls.cxChance.textContent = (+cxChanceSlider.value).toFixed(2)
  valueEls.cxAmount.textContent = (+cxAmountSlider.value).toFixed(2)
  valueEls.hotspot.textContent = (+hotspotSlider.value).toFixed(2)
  valueEls.size.textContent = `${(+sizeSlider.value).toFixed(1)}×`
}

function syncWorldConfig(world) {
  world.setConfig(createWorldConfig())
  Render.setRenderOptions({
    showSelectionView: selectionViewCheck.checked,
    showTrails: trailsCheck.checked,
    showLabels: labelsCheck.checked,
    followMode: followCheck.checked,
  })
}

export function getSimSpeed() { return +simSpeedSlider.value }
export function isPaused() { return simPaused }
export function isHiResEnabled() { return hiResCheck.checked }

function updatePlayPauseButton() {
  playPauseBtn.classList.toggle('is-paused', simPaused)
  playPauseBtn.setAttribute('aria-label', simPaused ? 'Lejátszás' : 'Szünet')
  playPauseBtn.title = simPaused ? 'Lejátszás' : 'Szünet'
}

export function setupUI(world, canvas, ctx, resetSimulation, onPauseToggle) {
  for (const slider of [populationTargetSlider, simSpeedSlider, mfSlider, mrSlider, cxChanceSlider, cxAmountSlider]) {
    slider.addEventListener('input', () => {
      updateLabels()
      syncWorldConfig(world)
    })
  }

  for (const check of [selectionViewCheck, trailsCheck, labelsCheck, nightCheck, invasiveCheck, waterStartCheck, treeDespawnCheck, followCheck]) {
    check.addEventListener('change', () => syncWorldConfig(world))
  }

  for (const slider of [treeSlider, hotspotSlider]) {
    slider.addEventListener('input', () => {
      updateLabels()
      syncWorldConfig(world)
    })
    slider.addEventListener('change', () => {
      syncWorldConfig(world)
      world.regenerateTrees()
    })
  }

  sizeSlider.addEventListener('input', () => updateLabels())
  sizeSlider.addEventListener('change', () => {
    const scale = +sizeSlider.value
    const wasAtMax = +zoomSlider.value >= +zoomSlider.max - 1e-6
    setWorldScale(scale)
    recomputeGridDims()
    zoomSlider.max = scale.toString()
    if (wasAtMax || +zoomSlider.value > scale) {
      zoomSlider.value = scale.toString()
    }
    world.resize(scale, createWorldConfig())
    applyZoomSlider()
  })

  const stageEl = canvas.closest('.stage')

  restartBtn.addEventListener('click', () => {
    resetSimulation()
  })

  playPauseBtn.addEventListener('click', () => {
    simPaused = !simPaused
    updatePlayPauseButton()
    if (stageEl) {
      stageEl.classList.toggle('is-paused', simPaused)
    }
    if (onPauseToggle) {
      onPauseToggle(simPaused)
    }
  })
  updatePlayPauseButton()

  hiResCheck.addEventListener('change', () => {
    Render.syncCanvasResolution(canvas, ctx, isHiResEnabled())
  })

  function applyZoomSlider() {
    const sliderValue = +zoomSlider.value
    const targetZoom = 1 / sliderValue
    Render.setCameraZoom(targetZoom)
    valueEls.zoom.textContent = `${sliderValue.toFixed(2)}×`
  }
  zoomSlider.addEventListener('input', applyZoomSlider)
  applyZoomSlider()
  Render.bindCamera(canvas, world)

  advancedToggle.addEventListener('click', () => {
    advancedPanel.hidden = !advancedPanel.hidden
    advancedToggle.classList.toggle('active', !advancedPanel.hidden)
  })

  infoToggle.addEventListener('click', () => {
    openInfoModal()
  })

  saveBtn.addEventListener('click', async () => {
    try {
      const data = await world.requestSave()
      const text = JSON.stringify(data)
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evolucio-vizes-day${world.day}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (e) {
      alert('Mentés sikertelen: ' + e.message)
    }
  })

  loadBtn.addEventListener('click', () => loadFileInput.click())

  const MAX_LOAD_BYTES = 20 * 1024 * 1024

  loadFileInput.addEventListener('change', async () => {
    const file = loadFileInput.files && loadFileInput.files[0]
    if (!file) {
      return
    }
    if (file.size > MAX_LOAD_BYTES) {
      alert(`Betöltés sikertelen: a fájl túl nagy (max ${MAX_LOAD_BYTES / 1024 / 1024} MB).`)
      loadFileInput.value = ''
      return
    }
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data && data.meta && typeof data.meta.worldScale === 'number') {
        const scale = Math.min(10, Math.max(1, data.meta.worldScale))
        setWorldScale(scale)
        recomputeGridDims()
        sizeSlider.value = scale
        zoomSlider.max = scale.toString()
        if (+zoomSlider.value > scale) {
          zoomSlider.value = scale.toString()
        }
      }
      const config = await world.applyLoad(data)
      Render.resetRenderState()
      const k = densityScaleFactor()
      populationTargetSlider.value = Math.round(config.populationTarget / k)
      treeSlider.value = Math.round(config.treeCount / k)
      mfSlider.value = config.mutationFrequency
      mrSlider.value = config.mutationAmount
      cxChanceSlider.value = config.crossoverChance
      cxAmountSlider.value = config.crossoverAmount
      hotspotSlider.value = config.hotspotShare
      invasiveCheck.checked = config.invasivesEnabled
      nightCheck.checked = config.nightEnabled
      waterStartCheck.checked = !!config.waterStartEnabled
      treeDespawnCheck.checked = !!config.treeDespawnDisabled
      updateLabels()
      applyZoomSlider()
    } catch (e) {
      alert('Betöltés sikertelen: ' + e.message)
    } finally {
      loadFileInput.value = ''
    }
  })

  const hideUiCheck = document.getElementById('hideUiCheck')
  const graphOnlyCheck = document.getElementById('graphOnlyCheck')
  if (hideUiCheck && stageEl) {
    hideUiCheck.addEventListener('change', () => {
      stageEl.classList.toggle('ui-hidden', hideUiCheck.checked)
    })
  }
  if (graphOnlyCheck && stageEl) {
    graphOnlyCheck.addEventListener('change', () => {
      stageEl.classList.toggle('ui-graph-only', graphOnlyCheck.checked)
    })
  }

  syncWorldConfig(world)
}
