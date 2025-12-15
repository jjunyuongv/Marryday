import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import Lottie from 'lottie-react'
import './FuturePage.css'

gsap.registerPlugin(ScrollTrigger)

// ScrollTrigger 자동 refresh 방지 및 안전한 refresh 패치
// 모바일에서 removeChild 오류 방지
if (typeof ScrollTrigger !== 'undefined') {
    // ScrollTrigger의 자동 refresh 이벤트 제한 (resize 제거)
    try {
        ScrollTrigger.config({
            autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" // resize 이벤트 제거
        })
    } catch (e) {
        // config가 지원되지 않을 수 있음
        console.debug('ScrollTrigger.config error:', e)
    }

    // ScrollTrigger의 refresh 메서드를 안전하게 패치
    const originalRefresh = ScrollTrigger.refresh
    if (originalRefresh && typeof originalRefresh === 'function') {
        ScrollTrigger.refresh = function () {
            try {
                // DOM이 안전한 상태인지 확인
                if (!document.body || !document.documentElement) {
                    return
                }

                // 모든 트리거를 안전하게 refresh
                const allTriggers = ScrollTrigger.getAll()
                if (allTriggers && allTriggers.length > 0) {
                    allTriggers.forEach(trigger => {
                        try {
                            // DOM이 여전히 존재하는지 확인
                            if (trigger && trigger.trigger) {
                                const triggerElement = trigger.trigger
                                // triggerElement가 DOM 노드인지 확인
                                if (triggerElement && triggerElement.nodeType === 1) {
                                    if (document.body.contains(triggerElement)) {
                                        // DOM이 존재할 때만 refresh
                                        if (typeof trigger.refresh === 'function') {
                                            trigger.refresh()
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            // 개별 트리거 refresh 오류는 무시
                            console.debug('ScrollTrigger individual refresh error:', e)
                        }
                    })
                }
            } catch (e) {
                // refresh 오류는 무시
                console.debug('ScrollTrigger.refresh error:', e)
            }
        }
    }

    // ScrollTrigger의 내부 refresh 함수들을 패치하기 위해
    // 전역 오류 핸들러로 ScrollTrigger refresh 오류를 무시
    const originalErrorHandler = window.onerror
    window.onerror = function (message, source, lineno, colno, error) {
        // ScrollTrigger의 removeChild 오류는 무시
        if (message && typeof message === 'string' &&
            (message.includes('removeChild') || message.includes('NotFoundError'))) {
            if (source && source.includes('ScrollTrigger')) {
                console.debug('ScrollTrigger removeChild error ignored:', message)
                return true // 오류를 처리했음을 표시
            }
        }
        // 다른 오류는 원래 핸들러로 전달
        if (originalErrorHandler) {
            return originalErrorHandler.call(this, message, source, lineno, colno, error)
        }
        return false
    }

    // unhandledrejection도 처리
    window.addEventListener('unhandledrejection', function (event) {
        if (event.reason && typeof event.reason === 'object') {
            const errorMessage = event.reason.message || event.reason.toString()
            if (errorMessage && errorMessage.includes('removeChild') &&
                errorMessage.includes('ScrollTrigger')) {
                console.debug('ScrollTrigger removeChild promise rejection ignored:', errorMessage)
                event.preventDefault() // 오류 전파 방지
            }
        }
    })
}

const FuturePage = ({ onBackToMain }) => {
    const visionRef = useRef(null)
    const fullImgRef = useRef(null)
    const bgRef = useRef(null)
    const topTxtRef = useRef(null)
    const btmTxtRef = useRef(null)
    const canvasRef = useRef(null)
    const sceneRef = useRef(null)
    const modelRef = useRef(null)
    const mixerRef = useRef(null)
    const animationIdRef = useRef(null)
    const rendererRef = useRef(null)
    const cameraRef = useRef(null)
    const controlsEnabledRef = useRef(false)
    const isDraggingRef = useRef(false)
    const previousMousePositionRef = useRef({ x: 0, y: 0 })
    const defaultCameraZRef = useRef(1) // 기본 카메라 Z 위치 저장
    const instructionRef = useRef(null)
    const scrollDownIconRef = useRef(null)
    const [scrollDownAnimation, setScrollDownAnimation] = useState(null)
    const [isModelLoaded, setIsModelLoaded] = useState(false)
    const [isViewerFullscreen, setIsViewerFullscreen] = useState(false)

    // 모바일에서 Future 페이지일 때만 body 스크롤 막기
    useEffect(() => {
        if (window.innerWidth <= 768) {
            document.body.classList.add('future-page-active')
            document.documentElement.classList.add('future-page-active')
        }

        return () => {
            document.body.classList.remove('future-page-active')
            document.documentElement.classList.remove('future-page-active')
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // 씬 생성
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x050505)  // 더 어둡게
        sceneRef.current = scene

        // 스튜디오 조명 설정 (주변은 어둡게, 드레스만 밝게)
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1)
        hemisphereLight.color.setHex(0xffffff)  // 명확한 하얀색
        hemisphereLight.groundColor.setHex(0xffffff)  // 명확한 하얀색
        hemisphereLight.position.set(0, 4, 0)
        scene.add(hemisphereLight)

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
        ambientLight.color.setHex(0xffffff)  // 명확한 하얀색
        scene.add(ambientLight)

        // 주변 조명은 최소화 (드레스만 밝게 하기 위해)
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.1)
        directionalLight1.color.setHex(0xffffff)  // 명확한 하얀색
        directionalLight1.position.set(1.5, 5, 2)
        directionalLight1.castShadow = false
        scene.add(directionalLight1)

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.05)
        directionalLight2.color.setHex(0xffffff)  // 명확한 하얀색
        directionalLight2.position.set(0, 3, 3)
        directionalLight2.castShadow = false
        scene.add(directionalLight2)

        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.05)
        directionalLight3.color.setHex(0xffffff)  // 명확한 하얀색
        directionalLight3.position.set(-2, 3, -2)
        scene.add(directionalLight3)

        const pointLight1 = new THREE.PointLight(0xffffff, 0.1, 10)
        pointLight1.color.setHex(0xffffff)  // 명확한 하얀색
        pointLight1.position.set(2, 2, 1)
        scene.add(pointLight1)

        const pointLight2 = new THREE.PointLight(0xffffff, 0.1, 10)
        pointLight2.color.setHex(0xffffff)  // 명확한 하얀색
        pointLight2.position.set(-2, 2, 1)
        scene.add(pointLight2)

        // SpotLight 추가 (드레스 조명 - 메인 조명, 천 재질을 위한 부드러운 조명)
        const spotLight = new THREE.SpotLight(0xe0e0e0, 4.0)  // 적당한 밝기
        spotLight.color.setHex(0xe0e0e0)  // 약간 밝은 회색빛 하얀색
        spotLight.position.set(0, 4, 2.5)  // 드레스 위쪽에서 비춤 (더 위에서, 더 앞에서)
        spotLight.angle = Math.PI / 3  // 60도 각도 (더 넓게, 부드러운 조명)
        spotLight.penumbra = 0.8  // 매우 부드러운 가장자리 (천 재질 느낌)
        spotLight.decay = 0.3  // 거리 감쇠 최소화
        spotLight.distance = 30  // 거리 증가
        spotLight.castShadow = true
        spotLight.shadow.enabled = true
        spotLight.shadow.mapSize.width = 2048  // 울렁임 방지를 위해 해상도 증가
        spotLight.shadow.mapSize.height = 2048  // 울렁임 방지를 위해 해상도 증가
        spotLight.shadow.camera.near = 0.1
        spotLight.shadow.camera.far = 50
        spotLight.shadow.camera.fov = 45
        spotLight.shadow.radius = 8
        spotLight.shadow.bias = -0.0008  // 울렁임 방지 (그림자가 표면과 겹치지 않도록)
        spotLight.shadow.normalBias = 0.02  // 울렁임 방지 추가 설정
        // 드레스 중앙(가슴~허리 높이)에 타겟 설정
        spotLight.target.position.set(0, 0.4, -0.8)
        spotLight.target.updateMatrixWorld()
        scene.add(spotLight)
        scene.add(spotLight.target)

        // 피팅룸 공간 구성 (어두운 배경)
        const floorGeometry = new THREE.PlaneGeometry(6, 6)
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 1.0,
            metalness: 0.0
        })
        const floor = new THREE.Mesh(floorGeometry, floorMaterial)
        floor.rotation.x = -Math.PI / 2
        floor.position.set(0, 0, -1.0)
        floor.receiveShadow = true
        scene.add(floor)

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f0f0f,
            roughness: 1.0,
            metalness: 0.0
        })
        const sideWallGeometry = new THREE.PlaneGeometry(6, 4)

        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial)
        leftWall.position.set(-1.8, 2, -1.0)
        leftWall.rotation.y = Math.PI / 6
        scene.add(leftWall)

        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial)
        rightWall.position.set(1.8, 2, -1.0)
        rightWall.rotation.y = -Math.PI / 6
        scene.add(rightWall)

        const backWallGeometry = new THREE.PlaneGeometry(4, 4.5)
        const backWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f0f0f,
            roughness: 1.0,
            metalness: 0.0
        })
        const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial)
        backWall.position.set(0, 2, -2.5)
        scene.add(backWall)

        const mirrorGeometry = new THREE.PlaneGeometry(1.4, 3.0)
        const mirrorMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.3,
            metalness: 0.0
        })
        const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial)
        mirror.position.set(0.9, 2.0, -2.49)
        scene.add(mirror)

        // 배경 거울 추가 (뷰어 배경에 큰 거울)
        const backgroundMirrorGeometry = new THREE.PlaneGeometry(20, 20)  // 매우 큰 거울
        const backgroundMirrorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.05,  // 매우 매끄러움 (거울 효과)
            metalness: 0.95,  // 높은 금속성 (반사 효과)
            side: THREE.DoubleSide  // 양면 모두 렌더링
        })
        const backgroundMirror = new THREE.Mesh(backgroundMirrorGeometry, backgroundMirrorMaterial)
        backgroundMirror.position.set(0, 1, 3)  // 카메라 뒤쪽에 배치
        backgroundMirror.rotation.y = Math.PI  // 카메라를 향하도록 회전
        backgroundMirror.receiveShadow = true
        scene.add(backgroundMirror)

        // HDRI 환경 맵 설정
        const rgbeLoader = new RGBELoader()
        if (rgbeLoader) {
            // 웹버전에서 더 높은 해상도의 HDRI 사용
            const isMobile = window.innerWidth <= 768
            const hdriUrl = isMobile
                ? 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr'
                : 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/studio_small_09_4k.hdr'

            rgbeLoader.load(
                hdriUrl,
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    texture.minFilter = THREE.LinearFilter
                    texture.magFilter = THREE.LinearFilter
                    texture.generateMipmaps = false
                    // 환경맵을 완전히 제거하여 반사 방지 (천 재질)
                    scene.environment = null
                    scene.environmentIntensity = 0.0  // 환경맵 강도 완전 제거
                    scene.background = new THREE.Color(0x050505)  // 어두운 배경 유지
                },
                undefined,
                (error) => {
                    console.warn('HDRI 로드 실패, 기본 라이팅 사용:', error)
                }
            )
        }

        // 카메라 설정
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const defaultZ = 1
        camera.position.set(0, 1, defaultZ)
        defaultCameraZRef.current = defaultZ // 기본 Z 위치 저장
        cameraRef.current = camera

        // 렌더러 설정 (천 재질 느낌을 위해 exposure 조정)
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.9,  // 약간 낮춰서 부드러운 느낌 (플라스틱 느낌 방지)
            powerPreference: 'high-performance'
        })
        renderer.setSize(width, height)
        // 최고 화질을 위해 pixelRatio 설정
        // 웹버전에서는 최소 2를 보장하여 고해상도 화면에서도 선명하게 표시
        const isMobile = window.innerWidth <= 768
        let pixelRatio = window.devicePixelRatio || 1

        if (!isMobile) {
            // 웹버전: 최소 2를 보장하되 최대 3까지
            pixelRatio = Math.max(Math.min(pixelRatio, 3), 2)
        } else {
            // 모바일: devicePixelRatio를 그대로 사용하되 최대 3까지
            pixelRatio = Math.min(pixelRatio, 3)
        }

        renderer.setPixelRatio(pixelRatio)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.shadowMap.autoUpdate = true
        // Three.js r152+ 업데이트: outputEncoding → outputColorSpace
        renderer.outputColorSpace = THREE.SRGBColorSpace
        // Three.js r155+ 업데이트: physicallyCorrectLights 제거됨 (기본적으로 물리 기반 라이팅 사용)
        rendererRef.current = renderer

        // GLTF 모델 로드
        const loader = new GLTFLoader()
        const clock = new THREE.Clock()

        loader.load(
            '/3D/scene.gltf',
            (gltf) => {
                const model = gltf.scene
                model.scale.set(0.8, 0.8, 0.8)  // 크기 축소
                model.position.set(0, 0.35, -0.8)  // 뒤로 이동 (Z축 값 증가)
                modelRef.current = model

                // 머티리얼 보정
                const layerColors = {
                    'Dress_Layer_1': 0xF0F0F0,
                    'Dress_Layer_2': 0xE8E8E8,
                    'Dress_Layer_5': 0xE8E8E8,
                    'Dress_Layer_6': 0xE8E8E8,
                    'Flowers': 0xFFDEE1,
                    'default': 0xF0F0F0
                }

                const areaColors = {
                    cape: 0xFAFAFA,
                    waist: 0xFAFAFA
                }

                const capeMeshes = ['Object_10', 'Object_12']
                const disableTextureLayers = ['Dress_Layer_5', 'Dress_Layer_6']

                model.traverse((obj) => {
                    if (obj.isMesh) {
                        obj.castShadow = true
                        obj.receiveShadow = true

                        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]

                        materials.forEach((mat) => {
                            if (!mat) return

                            // 텍스처 필터링 개선
                            const setTextureFiltering = (texture) => {
                                if (texture && rendererRef.current) {
                                    texture.minFilter = THREE.LinearMipmapLinearFilter
                                    texture.magFilter = THREE.LinearFilter
                                    texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy()
                                    texture.generateMipmaps = true
                                }
                            }

                            if (mat.map) {
                                mat.map.colorSpace = THREE.SRGBColorSpace
                                setTextureFiltering(mat.map)
                            }

                            if (mat.emissiveMap) {
                                mat.emissiveMap.colorSpace = THREE.SRGBColorSpace
                                setTextureFiltering(mat.emissiveMap)
                            }

                            if (mat.normalMap) {
                                mat.normalMap.colorSpace = THREE.NoColorSpace
                                setTextureFiltering(mat.normalMap)
                                // 울렁임 방지를 위한 normalScale 조정
                                if (mat.normalScale !== undefined) {
                                    mat.normalScale.set(0.5, 0.5)  // 울렁임 방지
                                }
                            } else {
                                // normalMap이 없어도 normalScale 설정
                                if (mat.normalScale !== undefined) {
                                    mat.normalScale.set(0.5, 0.5)  // 울렁임 방지
                                }
                            }

                            // 다른 텍스처 맵들도 필터링 개선
                            if (mat.roughnessMap) setTextureFiltering(mat.roughnessMap)
                            if (mat.metalnessMap) setTextureFiltering(mat.metalnessMap)
                            if (mat.aoMap) setTextureFiltering(mat.aoMap)
                            if (mat.bumpMap) setTextureFiltering(mat.bumpMap)

                            const materialName = mat.name || ''
                            const meshName = obj.name || ''

                            const isLayer5 = materialName.includes('Dress_Layer_5')
                            const isLayer6 = materialName.includes('Dress_Layer_6')

                            const isCape =
                                (isLayer5 || isLayer6) &&
                                capeMeshes.includes(meshName)

                            const waistMeshCandidates = ['Object_4', 'Object_8']
                            const isWaist =
                                waistMeshCandidates.includes(meshName) &&
                                !isCape

                            let layerColor = layerColors.default
                            let shouldDisableTexture = false

                            if (isCape) {
                                layerColor = areaColors.cape
                                shouldDisableTexture = true
                            } else if (isWaist) {
                                layerColor = areaColors.waist
                                shouldDisableTexture = true
                            } else {
                                for (const layerName in layerColors) {
                                    if (layerName !== 'default' && materialName.includes(layerName)) {
                                        layerColor = layerColors[layerName]
                                        if (disableTextureLayers.includes(layerName)) {
                                            shouldDisableTexture = true
                                        }
                                        break
                                    }
                                }
                            }

                            if (shouldDisableTexture) {
                                if (mat.map) {
                                    mat.map = null
                                }
                                mat.alphaMap = null
                                mat.aoMap = null
                                mat.bumpMap = null
                                mat.displacementMap = null
                                mat.emissiveMap = null
                                mat.lightMap = null
                                mat.metalnessMap = null
                                mat.normalMap = null
                                mat.roughnessMap = null

                                if (mat.color) {
                                    mat.color.setHex(layerColor)
                                }

                                mat.needsUpdate = true
                            } else {
                                if (mat.color) {
                                    mat.color.setHex(layerColor)
                                }
                            }

                            // 천 느낌을 위해 반사 완전 제거
                            if (mat.roughness !== undefined) {
                                mat.roughness = 1.0  // 최대 거칠기 (천 재질 느낌)
                            }

                            if (mat.metalness !== undefined) {
                                mat.metalness = 0.0  // 비금속 (천 재질)
                            }

                            // 환경맵 반사 완전 제거
                            mat.envMap = null
                            if (mat.envMapIntensity !== undefined) {
                                mat.envMapIntensity = 0.0
                            }

                            // 천 재질 느낌을 위한 emissive 추가 (부드러운 느낌)
                            if (mat.emissive !== undefined) {
                                mat.emissive = new THREE.Color(0x000000)
                                mat.emissiveIntensity = 0.0
                            }

                            // 스펙큘러 반사 완전 제거
                            if (mat.specular !== undefined) {
                                mat.specular = new THREE.Color(0x000000)
                                mat.specular.set(0x000000)
                            }
                            if (mat.specularColor !== undefined) {
                                mat.specularColor = new THREE.Color(0x000000)
                            }
                            if (mat.specularMap !== undefined) {
                                mat.specularMap = null
                            }

                            // clearcoat 완전 제거 (반짝임 효과 제거)
                            if (mat.clearcoat !== undefined) {
                                mat.clearcoat = 0.0
                            }
                            if (mat.clearcoatRoughness !== undefined) {
                                mat.clearcoatRoughness = 1.0
                            }
                            if (mat.clearcoatMap !== undefined) {
                                mat.clearcoatMap = null
                            }
                            if (mat.clearcoatNormalMap !== undefined) {
                                mat.clearcoatNormalMap = null
                            }

                            // glossiness 제거
                            if (mat.glossiness !== undefined) {
                                mat.glossiness = 0.0
                            }

                            // sheen 제거 (천 재질에서 반짝임 제거)
                            if ('clearcoat' in mat) {
                                mat.clearcoat = 0.0
                            }
                            if ('sheen' in mat) {
                                mat.sheen = 0.0
                            }
                            if (mat.sheenColor !== undefined) {
                                mat.sheenColor = new THREE.Color(0x000000)
                            }
                            if (mat.sheenRoughness !== undefined) {
                                mat.sheenRoughness = 1.0
                            }
                            if (mat.sheenMap !== undefined) {
                                mat.sheenMap = null
                            }

                            // 반사 관련 모든 속성 제거
                            if (mat.reflectivity !== undefined) {
                                mat.reflectivity = 0.0
                            }
                            if (mat.refractionRatio !== undefined) {
                                mat.refractionRatio = 1.0
                            }

                            // 추가 반사 제거 (플라스틱 느낌 방지)
                            if (mat.transmission !== undefined) {
                                mat.transmission = 0.0
                            }
                            if (mat.thickness !== undefined) {
                                mat.thickness = 0.0
                            }
                            if (mat.ior !== undefined) {
                                mat.ior = 1.0
                            }

                            // 텍스처의 반사도 제거
                            if (mat.roughnessMap) {
                                // roughnessMap은 유지하되 반사는 없도록
                            }
                            if (mat.metalnessMap) {
                                mat.metalnessMap = null
                            }

                            // 울렁임 방지를 위한 dithering 설정
                            if (mat.dithering !== undefined) {
                                mat.dithering = true  // 울렁임 방지
                            }

                            // 천 재질 느낌을 위한 추가 설정
                            mat.needsUpdate = true
                        })
                    }
                })

                scene.add(model)

                // 단상 추가
                const pedestalGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 32)  // 너비를 더 넓게
                const pedestalMaterial = new THREE.MeshStandardMaterial({
                    color: 0xF0F0E8,
                    roughness: 0.8,
                    metalness: 0.0
                })
                const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
                pedestal.position.set(0, 0.35 - 0.15, -0.8)  // 드레스와 함께 뒤로 이동
                pedestal.receiveShadow = true
                pedestal.castShadow = true
                scene.add(pedestal)

                // 애니메이션 설정
                if (gltf.animations && gltf.animations.length) {
                    const mixer = new THREE.AnimationMixer(model)
                    gltf.animations.forEach((clip) => {
                        mixer.clipAction(clip).play()
                    })
                    mixerRef.current = mixer
                }

                // 모델이 정상적으로 로드되면 로딩 상태 해제
                setIsModelLoaded(true)

                // 모델 로드 후 자동회전은 즉시 시작됨 (애니메이션 루프에서 처리)
                // 드래그 컨트롤은 ScrollTrigger 완료 후 활성화되지만,
                // 모델이 로드된 후 일정 시간이 지나면 자동으로 활성화 (안전장치)
                // 모바일과 웹버전 모두 ScrollTrigger 대기
                setTimeout(() => {
                    // DOM이 여전히 존재하는지 확인
                    if (modelRef.current && !controlsEnabledRef.current &&
                        visionRef.current && document.body.contains(visionRef.current)) {
                        try {
                            // ScrollTrigger.getAll() 사용하지 않음 (이미 제거된 DOM 참조 오류 방지)
                            // 대신 일정 시간 후 자동으로 컨트롤 활성화
                            controlsEnabledRef.current = true
                        } catch (e) {
                            // ignore errors
                            console.debug('Control activation error:', e);
                        }
                    }
                }, 500) // 0.5초 후 안전장치로 활성화
            },
            undefined,
            (error) => {
                console.error('모델 로드 오류:', error)
                // 오류가 나더라도 로딩 상태는 해제
                setIsModelLoaded(true)
            }
        )

        // 리사이즈 핸들러
        const handleResize = () => {
            const newWidth = canvas.clientWidth
            const newHeight = canvas.clientHeight
            if (cameraRef.current) {
                cameraRef.current.aspect = newWidth / newHeight
                cameraRef.current.updateProjectionMatrix()
            }
            if (rendererRef.current) {
                rendererRef.current.setSize(newWidth, newHeight)
                // 리사이즈 시에도 pixelRatio 유지
                const isMobile = window.innerWidth <= 768
                let pixelRatio = window.devicePixelRatio || 1

                if (!isMobile) {
                    // 웹버전: 최소 2를 보장하되 최대 3까지
                    pixelRatio = Math.max(Math.min(pixelRatio, 3), 2)
                } else {
                    // 모바일: devicePixelRatio를 그대로 사용하되 최대 3까지
                    pixelRatio = Math.min(pixelRatio, 3)
                }

                rendererRef.current.setPixelRatio(pixelRatio)
            }
        }
        window.addEventListener('resize', handleResize)

        // 마우스 컨트롤 (스크롤 애니메이션 완료 후 활성화)
        const handleMouseEnter = () => {
            if (controlsEnabledRef.current && !isDraggingRef.current) {
                canvas.style.cursor = 'grab'
            }
        }

        const handleMouseLeave = () => {
            if (!isDraggingRef.current) {
                canvas.style.cursor = 'default'
            }
        }

        const handleMouseDown = (e) => {
            if (!controlsEnabledRef.current) return
            isDraggingRef.current = true
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
            canvas.style.cursor = 'grabbing'
        }

        const handleMouseMove = (e) => {
            if (!controlsEnabledRef.current || !isDraggingRef.current || !modelRef.current) return
            e.preventDefault()
            const deltaX = e.clientX - previousMousePositionRef.current.x
            modelRef.current.rotation.y += deltaX * 0.01
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseUp = (e) => {
            if (!controlsEnabledRef.current) return
            isDraggingRef.current = false
            // 호버 상태에 따라 커서 설정
            if (canvas.matches(':hover')) {
                canvas.style.cursor = 'grab'
            } else {
                canvas.style.cursor = 'default'
            }
        }

        const handleWheel = (e) => {
            if (!controlsEnabledRef.current || !cameraRef.current) return
            e.preventDefault()
            const zoomSpeed = 0.05
            const defaultZ = defaultCameraZRef.current // 저장된 기본 Z 위치 (1)
            const currentZ = cameraRef.current.position.z
            // e.deltaY > 0: 휠 다운 (축소, Z 증가) / e.deltaY < 0: 휠 업 (확대, Z 감소)
            const newZ = currentZ + e.deltaY * zoomSpeed

            // 기본값(defaultZ)보다 커지지 않도록 (기본 크기 이상으로 축소 방지)
            // 최소값은 0.5로 제한 (확대 제한)
            // Z값이 클수록 멀어지므로(축소), 기본값보다 커지면 안 됨
            cameraRef.current.position.z = Math.max(0.5, Math.min(defaultZ, newZ))
        }

        // 터치 이벤트 핸들러 (모바일용)
        const handleTouchStart = (e) => {
            if (!controlsEnabledRef.current) return
            e.preventDefault()
            isDraggingRef.current = true
            const touch = e.touches[0]
            previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY }
        }

        const handleTouchMove = (e) => {
            if (!controlsEnabledRef.current || !isDraggingRef.current || !modelRef.current) return
            e.preventDefault()
            const touch = e.touches[0]
            const deltaX = touch.clientX - previousMousePositionRef.current.x
            modelRef.current.rotation.y += deltaX * 0.01
            previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY }
        }

        const handleTouchEnd = (e) => {
            if (!controlsEnabledRef.current) return
            e.preventDefault()
            isDraggingRef.current = false
        }

        // 마우스 이벤트 (웹버전)
        canvas.addEventListener('mouseenter', handleMouseEnter)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('wheel', handleWheel)

        // 터치 이벤트 (모바일)
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false })

        canvas.style.cursor = 'default'

        // 애니메이션 루프
        let isAnimating = true
        const animate = () => {
            if (!isAnimating) return

            animationIdRef.current = requestAnimationFrame(animate)

            if (mixerRef.current) {
                mixerRef.current.update(clock.getDelta())
            }

            // 모델이 로드되었고 드래그 중이 아닐 때 무조건 천천히 자동 회전
            // controlsEnabledRef와 관계없이 모델이 있으면 회전
            // 모델이 씬에 추가되었는지는 scene.add()에서 이미 처리되므로 체크 불필요
            if (modelRef.current && !isDraggingRef.current) {
                modelRef.current.rotation.y += 0.003
            }

            if (rendererRef.current && cameraRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current)
            }
        }
        animate()

        // 클린업
        return () => {
            isAnimating = false

            window.removeEventListener('resize', handleResize)
            if (canvas) {
                canvas.removeEventListener('mouseenter', handleMouseEnter)
                canvas.removeEventListener('mouseleave', handleMouseLeave)
                canvas.removeEventListener('mousedown', handleMouseDown)
                canvas.removeEventListener('wheel', handleWheel)
                // 터치 이벤트 제거 (모바일)
                canvas.removeEventListener('touchstart', handleTouchStart)
                canvas.removeEventListener('touchmove', handleTouchMove)
                canvas.removeEventListener('touchend', handleTouchEnd)
                canvas.removeEventListener('touchcancel', handleTouchEnd)
                canvas.style.cursor = ''
            }
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)

            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
                animationIdRef.current = null
            }

            // Three.js 리소스 정리 (ref를 null로 설정하기 전에)
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose()
                    }
                    if (object.material) {
                        const materials = Array.isArray(object.material) ? object.material : [object.material]
                        materials.forEach((material) => {
                            if (material.map) material.map.dispose()
                            if (material.normalMap) material.normalMap.dispose()
                            material.dispose()
                        })
                    }
                })
            }

            // Three.js renderer cleanup
            // 주의: canvas는 React가 관리하는 DOM이므로 직접 제거하지 않음
            // React가 자동으로 제거해주므로 dispose()만 호출
            if (rendererRef.current) {
                try {
                    rendererRef.current.dispose()
                } catch (e) {
                    // ignore dispose errors
                }
            }

            // ref 초기화 (dispose 후에)
            controlsEnabledRef.current = false
            isDraggingRef.current = false
            modelRef.current = null
            mixerRef.current = null
            sceneRef.current = null
            rendererRef.current = null
            cameraRef.current = null
        }
    }, [])

    // 페이지 마운트 시 스크롤을 맨 위로 리셋 및 상태 초기화
    useEffect(() => {
        // 상태 완전 초기화
        setIsModelLoaded(false)
        controlsEnabledRef.current = false
        isDraggingRef.current = false
        previousMousePositionRef.current = { x: 0, y: 0 }

        // ref는 useEffect의 클린업에서 처리하므로 여기서는 초기화하지 않음
        // (씬과 렌더러는 useEffect에서 새로 생성됨)

        // 배포 환경에서 스크롤 위치 복원 문제 해결을 위해 강제로 리셋
        // 즉시 실행
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0

        // ScrollTrigger.clearScrollMemory() 제거
        // clearScrollMemory()는 내부적으로 refresh를 호출할 수 있어서 이미 제거된 DOM을 참조할 수 있음
        // 모바일에서 모든 화면에서 오류 발생 가능

        // 약간의 지연 후 다시 한 번 확인 (배포 환경 대응)
        const scrollResetTimer = setTimeout(() => {
            try {
                // DOM이 여전히 존재하는지 확인
                if (visionRef.current && document.body.contains(visionRef.current)) {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                    document.documentElement.scrollTop = 0
                    document.body.scrollTop = 0
                    // ScrollTrigger.refresh()는 호출하지 않음 (이미 제거된 DOM 참조 오류 방지)
                    // 개별 트리거는 자동으로 refresh됨
                }
            } catch (e) {
                // ignore errors
                console.debug('Scroll reset error:', e);
            }
        }, 100)

        // ScrollTrigger.refresh()는 호출하지 않음
        // ScrollTrigger.refresh()는 모든 트리거를 refresh하는데, 이미 제거된 DOM을 참조할 수 있어 오류 발생
        // 개별 트리거는 생성 시 자동으로 설정되므로 전체 refresh 불필요

        // 모바일에서 스크롤 방지
        const isMobile = window.innerWidth <= 768
        if (isMobile) {
            // 모바일에서 스크롤 방지 핸들러
            const preventScroll = (e) => {
                // 3D 캔버스 영역에서는 드래그 허용 (이미 canvas에 이벤트 리스너가 있음)
                const target = e.target
                const canvas = canvasRef.current
                if (target === canvas || canvas?.contains(target)) {
                    return // canvas 영역은 드래그 허용
                }
                // 스크롤 다운 아이콘 클릭은 허용
                if (target.closest('.scroll_down_icon')) {
                    return
                }
                // 나머지 영역에서는 스크롤 방지
                e.preventDefault()
            }

            // touchmove와 wheel 이벤트로 스크롤 방지
            document.addEventListener('touchmove', preventScroll, { passive: false })
            document.addEventListener('wheel', preventScroll, { passive: false })
            document.addEventListener('scroll', preventScroll, { passive: false })

            return () => {
                clearTimeout(scrollResetTimer)
                document.removeEventListener('touchmove', preventScroll)
                document.removeEventListener('wheel', preventScroll)
                document.removeEventListener('scroll', preventScroll)
            }
        }

        return () => {
            clearTimeout(scrollResetTimer)
        }
    }, [])

    // 마우스 스크롤 다운 아이콘 애니메이션 로드
    useEffect(() => {
        fetch('/3D/Mouse scroll down.json')
            .then(response => response.json())
            .then(data => setScrollDownAnimation(data))
            .catch(error => console.error('마우스 스크롤 아이콘 로드 실패:', error))
    }, [])

    // 모바일에서 스크롤 다운 아이콘 클릭 핸들러
    const handleScrollDownClick = () => {
        const isMobile = window.innerWidth <= 768
        if (!isMobile) return

        // 모바일에서는 스크롤 없이 바로 애니메이션 완료 처리
        if (visionRef.current && fullImgRef.current && bgRef.current) {
            // DOM이 여전히 존재하는지 확인
            if (!document.body.contains(visionRef.current) ||
                !document.body.contains(fullImgRef.current)) {
                return
            }

            // bgAnimation 완료 (clip-path와 scale)
            gsap.to(bgRef.current, {
                clipPath: "inset(0% 0% 0% 0%)",
                scale: 1.3,
                duration: 0.5,
                ease: "power2.out"
            })

            // 텍스트 즉시 숨김 (모바일 클릭 후)
            const bTxtContainer = document.querySelector('#vision1012 .b_txt')
            if (bTxtContainer && document.body.contains(bTxtContainer)) {
                // 클래스 추가로 숨김
                bTxtContainer.classList.add('mobile-clicked-hide')
                bTxtContainer.style.display = 'none'
                bTxtContainer.style.visibility = 'hidden'
                bTxtContainer.style.opacity = '0'
            }

            if (topTxtRef.current && document.body.contains(topTxtRef.current)) {
                topTxtRef.current.classList.add('mobile-clicked-hide')
                topTxtRef.current.style.display = 'none'
                topTxtRef.current.style.visibility = 'hidden'
                topTxtRef.current.style.opacity = '0'
            }

            if (btmTxtRef.current && document.body.contains(btmTxtRef.current)) {
                btmTxtRef.current.classList.add('mobile-clicked-hide')
                btmTxtRef.current.style.display = 'none'
                btmTxtRef.current.style.visibility = 'hidden'
                btmTxtRef.current.style.opacity = '0'
            }

            // 추가로 모든 b_txt 관련 요소 숨김
            setTimeout(() => {
                try {
                    const allBTxtElements = document.querySelectorAll('#vision1012 .b_txt, #vision1012 .top_txt, #vision1012 .btm_txt')
                    allBTxtElements.forEach(el => {
                        if (el && document.body.contains(el)) {
                            el.classList.add('mobile-clicked-hide')
                            el.style.display = 'none'
                            el.style.visibility = 'hidden'
                            el.style.opacity = '0'
                        }
                    })
                } catch (e) {
                    // ignore DOM errors
                    console.debug('DOM query error:', e);
                }
            }, 100)

            // ScrollTrigger.getAll() 사용하지 않음 (이미 제거된 DOM 참조 오류 방지)
            // 대신 개별 트리거는 useLayoutEffect에서 관리하는 scrollTriggers 배열 사용
            // 여기서는 직접 애니메이션을 완료 상태로 만들기만 함

            // 컨트롤 활성화
            if (modelRef.current) {
                controlsEnabledRef.current = true
            }

            // 안내 문구 표시 (좌측 상단에 배치)
            const showInstruction = () => {
                // 여러 방법으로 요소 찾기
                let instructionEl = instructionRef.current
                if (!instructionEl) {
                    instructionEl = document.querySelector('#vision1012 .instruction_txt')
                }
                if (!instructionEl) {
                    instructionEl = document.querySelector('.instruction_txt')
                }
                if (!instructionEl && fullImgRef.current) {
                    instructionEl = fullImgRef.current.querySelector('.instruction_txt')
                }

                if (instructionEl) {
                    // 클래스 추가로 표시
                    instructionEl.classList.add('mobile-clicked-show')
                    instructionEl.classList.add('mobile-show-force')

                    // setProperty로 !important 적용
                    instructionEl.style.setProperty('display', 'block', 'important')
                    instructionEl.style.setProperty('visibility', 'visible', 'important')
                    instructionEl.style.setProperty('opacity', '1', 'important')
                    instructionEl.style.setProperty('position', 'absolute', 'important')
                    // 모바일에서 헤더 아래에 위치 (헤더 높이 + 여유 공간)
                    const isMobile = window.innerWidth <= 768
                    const topValue = isMobile ? '80px' : '20px'

                    instructionEl.style.setProperty('top', topValue, 'important')
                    instructionEl.style.setProperty('left', '20px', 'important')
                    instructionEl.style.setProperty('bottom', 'auto', 'important')
                    instructionEl.style.setProperty('right', 'auto', 'important')
                    instructionEl.style.setProperty('z-index', '99', 'important')
                    instructionEl.style.setProperty('text-align', 'left', 'important')
                    instructionEl.style.setProperty('pointer-events', 'none', 'important')

                    // 직접 스타일도 설정 (이중 보장)
                    instructionEl.style.display = 'block'
                    instructionEl.style.visibility = 'visible'
                    instructionEl.style.opacity = '1'
                    instructionEl.style.position = 'absolute'
                    instructionEl.style.top = topValue
                    instructionEl.style.left = '20px'
                    instructionEl.style.zIndex = '99'

                    // 애니메이션
                    gsap.killTweensOf(instructionEl)
                    gsap.fromTo(instructionEl,
                        { opacity: 0, y: -10 },
                        { opacity: 1, y: 0, duration: 0.3 }
                    )
                }
            }

            // 즉시 실행
            showInstruction()

            // 추가로 안내 문구 강제 표시 (지연 후)
            setTimeout(() => {
                showInstruction()
            }, 10)

            setTimeout(() => {
                showInstruction()
            }, 50)

            setTimeout(() => {
                showInstruction()
            }, 100)

            setTimeout(() => {
                showInstruction()
            }, 300)

            setTimeout(() => {
                showInstruction()
            }, 500)

            setTimeout(() => {
                showInstruction()
            }, 1000)

            // 스크롤 다운 아이콘 숨김
            if (scrollDownIconRef.current) {
                gsap.to(scrollDownIconRef.current, {
                    opacity: 0,
                    y: -10,
                    duration: 0.3,
                    onComplete: () => {
                        if (scrollDownIconRef.current) {
                            scrollDownIconRef.current.style.display = 'none'
                        }
                    }
                })
            }
        }
    }

    // GSAP ScrollTrigger 애니메이션
    // useLayoutEffect를 사용하여 React의 DOM 제거보다 먼저 cleanup 실행
    useLayoutEffect(() => {
        const scrollTriggers = []
        const gsapAnimations = []
        let timer = null
        let isMounted = true

        // 리사이즈 핸들러
        const handleResize = () => {
            if (isMounted && visionRef.current && document.body.contains(visionRef.current)) {
                try {
                    // 개별 트리거만 refresh (전체 refresh는 오류 발생 가능)
                    scrollTriggers.forEach(trigger => {
                        if (trigger && typeof trigger.refresh === 'function') {
                            try {
                                trigger.refresh();
                            } catch (e) {
                                // ignore individual refresh errors
                            }
                        }
                    });
                } catch (e) {
                    // ignore refresh errors
                    console.debug('ScrollTrigger.refresh error in handleResize:', e);
                }
            }
        };

        // DOM이 렌더링된 후 실행
        timer = setTimeout(() => {
            // 스크롤 위치 다시 한 번 확인 및 리셋 (배포 환경 대응)
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0

            // 초기 스크롤 다운 아이콘 표시
            if (scrollDownIconRef.current && !controlsEnabledRef.current) {
                scrollDownIconRef.current.style.display = 'block'
                const iconAnimation = gsap.fromTo(scrollDownIconRef.current,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.5, delay: 0.5 }
                )
                gsapAnimations.push(iconAnimation)
            }
            // ScrollTrigger 새로고침 (개별 트리거만 refresh)
            // 주의: ScrollTrigger.refresh()는 모든 트리거를 refresh하는데, 이미 제거된 DOM을 참조할 수 있음
            // 따라서 개별 트리거만 refresh하거나, 트리거가 생성된 후에만 refresh
            // 여기서는 트리거가 아직 생성되지 않았으므로 refresh하지 않음

            // ref를 사용해서 DOM 요소에 직접 접근
            // ScrollTrigger의 pin은 DOM에 wrapper를 추가하므로 주의 필요
            if (visionRef.current && fullImgRef.current && isMounted) {
                // 부모 노드가 존재하는지 확인
                if (visionRef.current.parentNode && fullImgRef.current.parentNode) {
                    // 모바일에서는 스크롤 범위 제한
                    const isMobile = window.innerWidth <= 768
                    const pinEnd = isMobile ? "+=500" : "bottom bottom"

                    const pinAnimation = gsap.to(fullImgRef.current, {
                        scrollTrigger: {
                            trigger: visionRef.current,
                            pin: true,
                            scrub: 0.5,
                            start: "top top",
                            end: pinEnd,
                            pinSpacing: isMobile ? false : false,
                            invalidateOnRefresh: true,
                            anticipatePin: 1,
                            markers: false,
                            onLeave: () => {
                                // 모바일에서 pin이 해제되면 스크롤을 정확히 멈춤
                                if (isMobile && visionRef.current && document.body.contains(visionRef.current)) {
                                    try {
                                        // ScrollTrigger의 end 지점 계산
                                        const triggerTop = visionRef.current.offsetTop
                                        const scrollEnd = triggerTop + 500 // end: "+=500"에 맞춤

                                        // 즉시 스크롤 위치 고정
                                        requestAnimationFrame(() => {
                                            if (visionRef.current && document.body.contains(visionRef.current)) {
                                                window.scrollTo({ top: scrollEnd, behavior: 'instant' })
                                                document.documentElement.scrollTop = scrollEnd
                                                document.body.scrollTop = scrollEnd
                                            }
                                        })
                                    } catch (e) {
                                        // ignore errors
                                        console.debug('onLeave error:', e);
                                    }
                                }
                            },
                            onEnterBack: () => {
                                // 모바일에서 다시 진입할 때도 스크롤 제한
                                if (isMobile && visionRef.current && document.body.contains(visionRef.current)) {
                                    try {
                                        const triggerTop = visionRef.current.offsetTop
                                        if (window.scrollY < triggerTop) {
                                            window.scrollTo({ top: triggerTop, behavior: 'instant' })
                                        }
                                    } catch (e) {
                                        // ignore errors
                                        console.debug('onEnterBack error:', e);
                                    }
                                }
                            }
                        }
                    });
                    if (pinAnimation && pinAnimation.scrollTrigger) {
                        scrollTriggers.push(pinAnimation.scrollTrigger);
                        gsapAnimations.push(pinAnimation);
                    }
                }
            }

            // 3D 뷰어 확대 및 clip-path 애니메이션
            if (bgRef.current && fullImgRef.current && isMounted) {
                // 모바일에서는 스크롤 범위 제한
                const isMobile = window.innerWidth <= 768
                const scrollEnd = isMobile ? "+=500" : "+=1000"

                const bgAnimation = gsap.to(bgRef.current, {
                    clipPath: "inset(0% 0% 0% 0%)",
                    scale: 1.3,
                    scrollTrigger: {
                        trigger: fullImgRef.current,
                        start: "top top",
                        end: scrollEnd,
                        scrub: 0.5,
                        onEnter: () => {
                            // 스크롤이 시작될 때 모델이 이미 로드되어 있으면 컨트롤 활성화
                            // 모바일과 웹버전 모두 동일하게 처리
                            if (modelRef.current) {
                                controlsEnabledRef.current = true
                            }
                        },
                        onComplete: () => {
                            // 애니메이션 완료 시 컨트롤 활성화 (강제로 활성화)
                            // 모바일과 웹버전 모두 동일하게 처리
                            if (modelRef.current) {
                                controlsEnabledRef.current = true
                            }

                            // 전체화면 상태로 설정
                            setIsViewerFullscreen(true)

                            // 안내 문구 표시
                            if (instructionRef.current) {
                                instructionRef.current.style.display = 'block'
                                gsap.fromTo(instructionRef.current,
                                    { opacity: 0 },
                                    { opacity: 1, duration: 0.3 }
                                )
                            }
                            // 스크롤 다운 아이콘 숨김
                            if (scrollDownIconRef.current) {
                                gsap.killTweensOf(scrollDownIconRef.current)
                                gsap.to(scrollDownIconRef.current, {
                                    opacity: 0,
                                    y: 10,
                                    duration: 0.3,
                                    onComplete: () => {
                                        if (scrollDownIconRef.current) {
                                            scrollDownIconRef.current.style.display = 'none'
                                        }
                                    }
                                })
                            }
                        },
                        onUpdate: (self) => {
                            // 스크롤이 끝에 도달했을 때 (progress >= 0.98로 더 엄격하게)
                            // 모바일과 웹버전 모두 동일한 기준 적용
                            if (self.progress >= 0.98) {
                                // 전체화면 상태로 설정
                                setIsViewerFullscreen(true)

                                // 컨트롤 강제 활성화 (모델이 로드되었는지 확인)
                                if (modelRef.current) {
                                    controlsEnabledRef.current = true
                                }

                                // 안내 문구 강제 표시
                                if (instructionRef.current) {
                                    instructionRef.current.style.display = 'block'
                                    gsap.killTweensOf(instructionRef.current)
                                    gsap.to(instructionRef.current, { opacity: 1, duration: 0.2, clearProps: 'none' })
                                }

                                // 스크롤 다운 아이콘 강제 숨김
                                if (scrollDownIconRef.current) {
                                    gsap.killTweensOf(scrollDownIconRef.current)
                                    gsap.to(scrollDownIconRef.current, {
                                        opacity: 0,
                                        y: 10,
                                        duration: 0.2,
                                        onComplete: () => {
                                            if (scrollDownIconRef.current) {
                                                scrollDownIconRef.current.style.display = 'none'
                                            }
                                        }
                                    })
                                }
                            } else {
                                // 스크롤 진행 중일 때 (progress < 0.98)
                                // 전체화면 상태 해제
                                setIsViewerFullscreen(false)

                                // 컨트롤 비활성화 (스크롤이 끝까지 내려가지 않았으면 비활성화)
                                controlsEnabledRef.current = false

                                // 안내 문구 숨김
                                if (instructionRef.current) {
                                    gsap.killTweensOf(instructionRef.current)
                                    gsap.to(instructionRef.current, {
                                        opacity: 0,
                                        duration: 0.2,
                                        onComplete: () => {
                                            if (instructionRef.current) {
                                                instructionRef.current.style.display = 'none'
                                            }
                                        }
                                    })
                                }

                                // 스크롤 다운 아이콘 표시
                                if (scrollDownIconRef.current) {
                                    if (scrollDownIconRef.current.style.display === 'none') {
                                        scrollDownIconRef.current.style.display = 'block'
                                    }
                                    gsap.killTweensOf(scrollDownIconRef.current)
                                    gsap.to(scrollDownIconRef.current, { opacity: 1, y: 0, duration: 0.2 })
                                }
                            }
                        },
                        onReverseComplete: () => {
                            // 스크롤을 맨 위로 올렸을 때 초기 상태로 복원 (모바일 고려)
                            const isMobile = window.innerWidth <= 768
                            const isSmallMobile = window.innerWidth <= 480
                            // 모바일에서는 top_txt는 조금만 오른쪽(양수), btm_txt는 오른쪽(양수)
                            const topInitialX = isSmallMobile ? 15 : isMobile ? 20 : -350
                            const btmInitialX = isSmallMobile ? 15 : isMobile ? 20 : 350

                            if (topTxtRef.current) {
                                gsap.killTweensOf(topTxtRef.current)
                                gsap.set(topTxtRef.current, { x: topInitialX, opacity: 1, clearProps: 'none' })
                            }
                            if (btmTxtRef.current) {
                                gsap.killTweensOf(btmTxtRef.current)
                                gsap.set(btmTxtRef.current, { x: btmInitialX, opacity: 1, clearProps: 'none' })
                            }
                        }
                    }
                });
                if (bgAnimation.scrollTrigger) {
                    scrollTriggers.push(bgAnimation.scrollTrigger);
                }
                gsapAnimations.push(bgAnimation);
            }

            // 위쪽 텍스트가 왼쪽으로 사라지게
            if (topTxtRef.current && fullImgRef.current && isMounted) {
                // 화면 크기에 따라 초기 위치 설정
                const isMobile = window.innerWidth <= 768
                const isSmallMobile = window.innerWidth <= 480
                // 모바일에서는 조금만 오른쪽으로 이동 (양수), 웹버전은 왼쪽으로 (음수)
                const initialX = isSmallMobile ? 15 : isMobile ? 20 : -350
                const endX = isSmallMobile ? -600 : isMobile ? -800 : -1200

                // 기존 애니메이션 제거
                gsap.killTweensOf(topTxtRef.current)

                // 모바일에서도 작동하도록 명시적으로 설정
                if (topTxtRef.current.style) {
                    topTxtRef.current.style.willChange = 'transform'
                }

                gsap.set(topTxtRef.current, {
                    x: initialX,
                    opacity: 1,
                    force3D: true,
                    immediateRender: true
                })

                // 모바일에서는 스크롤 범위 제한
                const scrollEnd = isMobile ? "+=500" : "+=1000"

                const topTxtAnimation = gsap.to(topTxtRef.current, {
                    x: endX, // 화면 크기에 따라 다른 값
                    opacity: 0,
                    force3D: true,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: fullImgRef.current,
                        start: "top top",
                        end: scrollEnd,
                        scrub: 1,
                        invalidateOnRefresh: true,
                        refreshPriority: -1,
                        onUpdate: (self) => {
                            // 모바일에서도 애니메이션이 작동하는지 확인
                            if (topTxtRef.current && self.progress > 0) {
                                topTxtRef.current.style.willChange = 'transform'
                            }
                        }
                    }
                });
                if (topTxtAnimation.scrollTrigger) {
                    scrollTriggers.push(topTxtAnimation.scrollTrigger);
                }
                gsapAnimations.push(topTxtAnimation);
            }

            // 아래쪽 텍스트가 오른쪽으로 사라지게
            if (btmTxtRef.current && fullImgRef.current && isMounted) {
                // 화면 크기에 따라 초기 위치 설정
                const isMobile = window.innerWidth <= 768
                const isSmallMobile = window.innerWidth <= 480
                // 모바일에서는 오른쪽으로 이동 (양수), 웹버전은 오른쪽으로 (양수)
                const initialX = isSmallMobile ? 15 : isMobile ? 20 : 350
                const endX = isSmallMobile ? 600 : isMobile ? 800 : 1200

                // 기존 애니메이션 제거
                gsap.killTweensOf(btmTxtRef.current)

                // 모바일에서도 작동하도록 명시적으로 설정
                if (btmTxtRef.current.style) {
                    btmTxtRef.current.style.willChange = 'transform'
                }

                gsap.set(btmTxtRef.current, {
                    x: initialX,
                    opacity: 1,
                    force3D: true,
                    immediateRender: true
                })

                // 모바일에서는 스크롤 범위 제한
                const scrollEnd = isMobile ? "+=500" : "+=1000"

                const btmTxtAnimation = gsap.to(btmTxtRef.current, {
                    x: endX, // 화면 크기에 따라 다른 값
                    opacity: 0,
                    force3D: true,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: fullImgRef.current,
                        start: "top top",
                        end: scrollEnd,
                        scrub: 1,
                        invalidateOnRefresh: true,
                        refreshPriority: -1,
                        onUpdate: (self) => {
                            // 모바일에서도 애니메이션이 작동하는지 확인
                            if (btmTxtRef.current && self.progress > 0) {
                                btmTxtRef.current.style.willChange = 'transform'
                            }
                        }
                    }
                });
                if (btmTxtAnimation.scrollTrigger) {
                    scrollTriggers.push(btmTxtAnimation.scrollTrigger);
                }
                gsapAnimations.push(btmTxtAnimation);
            }

            // 리사이즈 시 ScrollTrigger 새로고침
            window.addEventListener('resize', handleResize);
        }, 100);

        return () => {
            // 컴포넌트가 언마운트되었음을 표시
            isMounted = false;

            if (timer) {
                clearTimeout(timer);
            }

            // 리사이즈 이벤트 리스너 제거
            window.removeEventListener('resize', handleResize);

            // ScrollTrigger를 먼저 정리 (pin 해제가 중요)
            // React가 DOM을 제거하기 전에 ScrollTrigger의 pin을 해제해야 함
            // 부모 노드 존재 여부를 확인한 후 안전하게 정리
            try {
                // ref가 여전히 유효하고 부모 노드가 존재하는지 확인
                const isRefValid = visionRef.current &&
                    fullImgRef.current &&
                    visionRef.current.parentNode &&
                    fullImgRef.current.parentNode &&
                    document.body.contains(visionRef.current) &&
                    document.body.contains(fullImgRef.current);

                // 모든 ScrollTrigger를 역순으로 disable하고 kill (pin이 있는 것부터)
                for (let i = scrollTriggers.length - 1; i >= 0; i--) {
                    const trigger = scrollTriggers[i];
                    if (trigger) {
                        try {
                            // ref가 유효할 때만 disable (pin 해제)
                            if (isRefValid) {
                                if (typeof trigger.disable === 'function') {
                                    trigger.disable();
                                }
                            }
                            // kill로 완전히 제거 (false를 전달하여 DOM 제거 시도 방지)
                            if (typeof trigger.kill === 'function') {
                                // false를 전달하면 DOM에서 요소를 제거하지 않고 ScrollTrigger만 정리
                                trigger.kill(false);
                            }
                        } catch (e) {
                            // ignore individual errors - 이미 제거되었을 수 있음
                            console.debug('ScrollTrigger cleanup error:', e);
                        }
                    }
                }

                // 남은 모든 ScrollTrigger 정리
                // 주의: ScrollTrigger.getAll()은 모든 트리거를 반환하는데, 이미 제거된 DOM을 참조하는 트리거도 포함될 수 있음
                // 따라서 더 안전하게 처리
                try {
                    // scrollTriggers 배열에 있는 트리거만 정리 (이미 추적 중인 것들)
                    // ScrollTrigger.getAll()은 사용하지 않음 (다른 페이지의 트리거도 포함될 수 있고, 이미 제거된 DOM 참조 가능)
                    scrollTriggers.forEach(trigger => {
                        if (trigger) {
                            try {
                                // ref가 유효할 때만 disable
                                if (isRefValid) {
                                    if (typeof trigger.disable === 'function') {
                                        trigger.disable();
                                    }
                                }
                                // kill로 완전히 제거 (false를 전달하여 DOM 제거 시도 방지)
                                if (typeof trigger.kill === 'function') {
                                    trigger.kill(false);
                                }
                            } catch (e) {
                                // ignore cleanup errors
                                console.debug('ScrollTrigger cleanup error:', e);
                            }
                        }
                    });
                } catch (e) {
                    // ignore cleanup errors
                    console.debug('ScrollTrigger cleanup error:', e);
                }

                // ScrollTrigger 전체 정리 및 스크롤 위치 리셋
                // 주의: clearScrollMemory나 refresh는 호출하지 않음 (이미 kill된 트리거에 대해 오류 발생 가능)
                try {
                    // 언마운트 시에도 스크롤 위치 리셋
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                    document.documentElement.scrollTop = 0
                    document.body.scrollTop = 0
                } catch (e) {
                    // ignore scroll errors
                    console.debug('Scroll reset error:', e);
                }
            } catch (e) {
                // ignore ScrollTrigger cleanup errors
                console.debug('ScrollTrigger cleanup error:', e);
            }

            // GSAP 애니메이션 kill
            gsapAnimations.forEach(anim => {
                try {
                    if (anim && typeof anim.kill === 'function') {
                        anim.kill();
                    }
                } catch (e) {
                    // ignore
                }
            });
        }
    }, [])

    return (
        <div id="vision1012" ref={visionRef}>
            <div className="full_img" ref={fullImgRef}>
                <div className={`bg ${!isModelLoaded ? 'bg-loading' : ''}`} ref={bgRef}>
                    <canvas ref={canvasRef} className="future-canvas" />
                </div>
                {!isModelLoaded && (
                    <div className="future-loading-overlay">
                        <div className="future-loading-inner">
                            <p className="future-loading-title">3D 드레스를 불러오는 중입니다</p>
                            <p className="future-loading-sub">잠시만 기다려 주세요...</p>
                        </div>
                    </div>
                )}
                <div className="b_txt">
                    <p className="top_txt" ref={topTxtRef}>곧 만나게 될 <span>새로운 경험</span></p>
                    <p className="btm_txt" ref={btmTxtRef}><span>3D</span>웨딩드레스</p>
                </div>
                <div className="instruction_txt" ref={instructionRef}>
                    <p>드래그하여 드레스를 둘러보세요</p>
                    <p className="sub">마우스 휠로 확대/축소 가능</p>
                </div>
                {isViewerFullscreen && (
                    <div className="future-viewer-tooltip">
                        <button className="future-faq-button">
                            <HiQuestionMarkCircle />
                            <div className="future-tooltip">
                                <span>웨딩드레스의 선택은 디테일에서 시작됩니다</span>
                                <span>3D로 회전하거나 확대하며 라인과 구조를 직접 탐색해볼 수 있습니다</span>
                            </div>
                        </button>
                    </div>
                )}
                <div className="scroll_down_icon" ref={scrollDownIconRef} onClick={handleScrollDownClick}>
                    <p className="scroll-click-text">click</p>
                    <p className="scroll-scroll-text">Scroll</p>
                    {scrollDownAnimation && (
                        <Lottie
                            animationData={scrollDownAnimation}
                            loop={true}
                            className="scroll-down-lottie"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default FuturePage
