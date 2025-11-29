import { useEffect, useMemo, useRef, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import '../../styles/Main/DomeGallery.css'

const DEFAULT_IMAGES = [
    { src: '/Image/main/Adress1.png', alt: 'Adress1.png' },
    { src: '/Image/main/Adress2.png', alt: 'Adress2.png' },
    { src: '/Image/main/Adress3.png', alt: 'Adress3.png' },
    { src: '/Image/main/Adress4.png', alt: 'Adress4.png' },
    { src: '/Image/main/Adress5.png', alt: 'Adress5.png' },
    { src: '/Image/main/Bdress7.png', alt: 'Bdress7.png' },
    { src: '/Image/main/Bdress8.PNG', alt: 'Bdress8.PNG' },
    { src: '/Image/main/Bdress9.PNG', alt: 'Bdress9.PNG' },
    { src: '/Image/main/Bdress10.PNG', alt: 'Bdress10.PNG' },
    { src: '/Image/main/Kdress1.png', alt: 'Kdress1.png' },
    { src: '/Image/main/Kdress2.PNG', alt: 'Kdress2.PNG' },
    { src: '/Image/main/Kdress7.PNG', alt: 'Kdress7.PNG' },
    { src: '/Image/main/Kdress8.png', alt: 'Kdress8.png' },
    { src: '/Image/main/Mdress1.PNG', alt: 'Mdress1.PNG' },
    { src: '/Image/main/Minidress2.PNG', alt: 'Minidress2.PNG' },
    { src: '/Image/main/Minidress3.png', alt: 'Minidress3.png' },
    { src: '/Image/main/Minidress4.png', alt: 'Minidress4.png' },
    { src: '/Image/main/Tdress10.png', alt: 'Tdress10.png' },
    { src: '/Image/main/Tdress19.PNG', alt: 'Tdress19.PNG' },
    { src: '/Image/main/Tdress32.PNG', alt: 'Tdress32.PNG' },
    { src: '/Image/main/Tdress33.png', alt: 'Tdress33.png' },
    { src: '/Image/main/Tdress34.PNG', alt: 'Tdress34.PNG' },
    { src: '/Image/main/Tdress35.png', alt: 'Tdress35.png' },
    { src: '/Image/main/Tdress39.png', alt: 'Tdress39.png' },
    { src: '/Image/main/Pdress1.PNG', alt: 'Pdress1.PNG' },
    { src: '/Image/main/Pdress2.PNG', alt: 'Pdress2.PNG' },
    { src: '/Image/main/Pdress3.PNG', alt: 'Pdress3.PNG' },
    { src: '/Image/main/Pdress4.PNG', alt: 'Pdress4.PNG' },
    { src: '/Image/main/Pdress5.PNG', alt: 'Pdress5.PNG' },
    { src: '/Image/main/Sdress2.png', alt: 'Sdress2.png' },
    { src: '/Image/main/Sdress10.png', alt: 'Sdress10.png' },
    { src: '/Image/main/Sdress11.png', alt: 'Sdress11.png' }
]

const DEFAULTS = {
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    segments: 35
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg) => {
    const a = (((deg + 180) % 360) + 360) % 360
    return a - 180
}
function buildItems(pool, seg) {
    const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
    const evenYs = [-4, -2, 0, 2, 4]
    const oddYs = [-3, -1, 1, 3, 5]

    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs
        return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }))
    })

    const totalSlots = coords.length
    if (pool.length === 0) {
        return coords.map((c) => ({ ...c, src: '', alt: '' }))
    }

    const normalizedImages = pool.map((image) => {
        if (typeof image === 'string') {
            return { src: image, alt: '' }
        }
        return { src: image.src || '', alt: image.alt || '' }
    })

    const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length])

    for (let i = 1; i < usedImages.length; i += 1) {
        if (usedImages[i].src === usedImages[i - 1].src) {
            for (let j = i + 1; j < usedImages.length; j += 1) {
                if (usedImages[j].src !== usedImages[i].src) {
                    const tmp = usedImages[i]
                    usedImages[i] = usedImages[j]
                    usedImages[j] = tmp
                    break
                }
            }
        }
    }

    return coords.map((c, i) => ({
        ...c,
        src: usedImages[i].src,
        alt: usedImages[i].alt
    }))
}

export default function DomeGallery({
    images = DEFAULT_IMAGES,
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#ffffff',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    imageBorderRadius = '30px',
    grayscale = false
}) {
    const rootRef = useRef(null)
    const mainRef = useRef(null)
    const sphereRef = useRef(null)

    const rotationRef = useRef({ x: 0, y: 0 })
    const startRotRef = useRef({ x: 0, y: 0 })
    const startPosRef = useRef(null)
    const draggingRef = useRef(false)
    const movedRef = useRef(false)
    const inertiaRAF = useRef(null)
    const autoRotateRAF = useRef(null)
    const autoRotateSpeed = useRef(0.08) // 회전 속도 (deg per frame)

    const items = useMemo(() => buildItems(images, segments), [images, segments])

    const applyTransform = (xDeg, yDeg) => {
        const el = sphereRef.current
        if (el) {
            el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
        }
    }

    const lockedRadiusRef = useRef(null)

    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect
            const w = Math.max(1, cr.width)
            const h = Math.max(1, cr.height)
            const minDim = Math.min(w, h)
            const maxDim = Math.max(w, h)
            const aspect = w / h
            let basis
            switch (fitBasis) {
                case 'min':
                    basis = minDim
                    break
                case 'max':
                    basis = maxDim
                    break
                case 'width':
                    basis = w
                    break
                case 'height':
                    basis = h
                    break
                default:
                    basis = aspect >= 1.3 ? w : minDim
            }
            let radius = basis * fit
            const heightGuard = h * 1.35
            radius = Math.min(radius, heightGuard)
            radius = clamp(radius, minRadius, maxRadius)
            lockedRadiusRef.current = Math.round(radius)

            const viewerPad = Math.max(8, Math.round(minDim * padFactor))
            root.style.setProperty('--radius', `${lockedRadiusRef.current}px`)
            root.style.setProperty('--viewer-pad', `${viewerPad}px`)
            root.style.setProperty('--overlay-blur-color', overlayBlurColor)
            root.style.setProperty('--tile-radius', imageBorderRadius)
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')
            applyTransform(rotationRef.current.x, rotationRef.current.y)
        })
        ro.observe(root)
        return () => ro.disconnect()
    }, [
        fit,
        fitBasis,
        minRadius,
        maxRadius,
        padFactor,
        overlayBlurColor,
        grayscale,
        imageBorderRadius
    ])

    useEffect(() => {
        applyTransform(rotationRef.current.x, rotationRef.current.y)
    }, [])

    // 자동 회전 기능
    useEffect(() => {
        const autoRotate = () => {
            if (!draggingRef.current && !inertiaRAF.current) {
                const nextY = wrapAngleSigned(rotationRef.current.y + autoRotateSpeed.current)
                rotationRef.current = { ...rotationRef.current, y: nextY }
                applyTransform(rotationRef.current.x, nextY)
            }
            autoRotateRAF.current = requestAnimationFrame(autoRotate)
        }
        autoRotateRAF.current = requestAnimationFrame(autoRotate)
        return () => {
            if (autoRotateRAF.current) {
                cancelAnimationFrame(autoRotateRAF.current)
                autoRotateRAF.current = null
            }
        }
    }, [])

    const stopInertia = useCallback(() => {
        if (inertiaRAF.current) {
            cancelAnimationFrame(inertiaRAF.current)
            inertiaRAF.current = null
        }
    }, [])

    const startInertia = useCallback(
        (vx, vy) => {
            const MAX_V = 1.4
            let vX = clamp(vx, -MAX_V, MAX_V) * 80
            let vY = clamp(vy, -MAX_V, MAX_V) * 80
            let frames = 0
            const d = clamp(dragDampening ?? 0.6, 0, 1)
            const frictionMul = 0.94 + 0.055 * d
            const stopThreshold = 0.015 - 0.01 * d
            const maxFrames = Math.round(90 + 270 * d)
            const step = () => {
                vX *= frictionMul
                vY *= frictionMul
                if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
                    inertiaRAF.current = null
                    return
                }
                if (++frames > maxFrames) {
                    inertiaRAF.current = null
                    return
                }
                const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg)
                const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200)
                rotationRef.current = { x: nextX, y: nextY }
                applyTransform(nextX, nextY)
                inertiaRAF.current = requestAnimationFrame(step)
            }
            stopInertia()
            inertiaRAF.current = requestAnimationFrame(step)
        },
        [dragDampening, maxVerticalRotationDeg, stopInertia]
    )

    useGesture(
        {
            onDragStart: ({ event }) => {
                stopInertia()
                const evt = event
                draggingRef.current = true
                movedRef.current = false
                startRotRef.current = { ...rotationRef.current }
                startPosRef.current = { x: evt.clientX, y: evt.clientY }
            },
            onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
                if (!draggingRef.current || !startPosRef.current) return
                const evt = event
                const dxTotal = evt.clientX - startPosRef.current.x
                const dyTotal = evt.clientY - startPosRef.current.y
                if (!movedRef.current) {
                    const dist2 = dxTotal * dxTotal + dyTotal * dyTotal
                    if (dist2 > 16) movedRef.current = true
                }
                const nextX = clamp(
                    startRotRef.current.x - dyTotal / dragSensitivity,
                    -maxVerticalRotationDeg,
                    maxVerticalRotationDeg
                )
                const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity)
                if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
                    rotationRef.current = { x: nextX, y: nextY }
                    applyTransform(nextX, nextY)
                }
                if (last) {
                    draggingRef.current = false
                    let [vMagX, vMagY] = velocity
                    const [dirX, dirY] = direction
                    let vx = vMagX * dirX
                    let vy = vMagY * dirY
                    if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
                        const [mx, my] = movement
                        vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2)
                        vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2)
                    }
                    if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy)
                    movedRef.current = false
                }
            }
        },
        { target: mainRef, eventOptions: { passive: true } }
    )

    return (
        <div
            ref={rootRef}
            className="sphere-root"
            style={{
                ['--segments-x']: segments,
                ['--segments-y']: segments,
                ['--overlay-blur-color']: overlayBlurColor,
                ['--tile-radius']: imageBorderRadius,
                ['--image-filter']: grayscale ? 'grayscale(1)' : 'none'
            }}
        >
            <main ref={mainRef} className="sphere-main">
                <div className="stage">
                    <div ref={sphereRef} className="sphere">
                        {items.map((it, i) => (
                            <div
                                key={`${it.x},${it.y},${i}`}
                                className="item"
                                data-src={it.src}
                                data-offset-x={it.x}
                                data-offset-y={it.y}
                                data-size-x={it.sizeX}
                                data-size-y={it.sizeY}
                                style={{
                                    ['--offset-x']: it.x,
                                    ['--offset-y']: it.y,
                                    ['--item-size-x']: it.sizeX,
                                    ['--item-size-y']: it.sizeY
                                }}
                            >
                                <div className="item__image">
                                    <img src={it.src} draggable={false} alt={it.alt} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    )
}

