import React, { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// 火焰组件
function Flame({ isLit, windForce, onFlameOut }) {
  const flameRef = useRef()
  const [flameHeight, setFlameHeight] = useState(1)
  const timeRef = useRef(0)
  
  useFrame((state, delta) => {
    if (!flameRef.current) return
    
    timeRef.current += delta
    
    if (isLit) {
      // 逐渐燃烧，火焰变小
      setFlameHeight(prev => Math.max(0, prev - delta * 0.02))
      
      // 火焰摇曳效果
      const sway = Math.sin(timeRef.current * 3) * 0.3 + Math.cos(timeRef.current * 5) * 0.2
      const windSway = windForce * 0.5
      
      flameRef.current.rotation.z = (sway + windSway) * 0.3
      flameRef.current.position.x = windSway * 0.5
      
      // 风力过大时吹灭蜡烛
      if (windForce > 0.7 || flameHeight <= 0.1) {
        onFlameOut()
      }
    } else {
      setFlameHeight(0)
    }
    
    // 火焰脉动
    const scale = 1 + Math.sin(timeRef.current * 8) * 0.1
    flameRef.current.scale.set(scale, flameHeight, scale)
  })
  
  if (!isLit || flameHeight <= 0) return null
  
  return (
    <group ref={flameRef} position={[0, 1.5, 0]}>
      {/* 外焰 - 黄色 */}
      <mesh>
        <coneGeometry args={[0.15, 0.6, 8]} />
        <meshBasicMaterial 
          color="#ffaa00" 
          transparent 
          opacity={0.9}
        />
      </mesh>
      {/* 内焰 - 蓝色 */}
      <mesh position={[0, 0.1, 0]}>
        <coneGeometry args={[0.08, 0.3, 8]} />
        <meshBasicMaterial 
          color="#4488ff" 
          transparent 
          opacity={0.7}
        />
      </mesh>
      {/* 火焰光晕 */}
      <pointLight 
        color="#ffaa00" 
        intensity={2 * flameHeight} 
        distance={5}
      />
    </group>
  )
}

// 烟雾粒子组件
function SmokeParticles({ isActive }) {
  const particlesRef = useRef()
  const particleCount = 50
  const positions = new Float32Array(particleCount * 3)
  const velocities = useRef([])
  
  // 初始化粒子位置和速度
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.2
    positions[i * 3 + 1] = 1.5 + Math.random() * 0.5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2
    
    velocities.current.push({
      x: (Math.random() - 0.5) * 0.02,
      y: 0.02 + Math.random() * 0.03,
      z: (Math.random() - 0.5) * 0.02
    })
  }
  
  useFrame((state, delta) => {
    if (!particlesRef.current || !isActive) return
    
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      // 更新位置
      positions[i * 3] += velocities.current[i].x
      positions[i * 3 + 1] += velocities.current[i].y
      positions[i * 3 + 2] += velocities.current[i].z
      
      // 重置粒子
      if (positions[i * 3 + 1] > 4) {
        positions[i * 3] = (Math.random() - 0.5) * 0.2
        positions[i * 3 + 1] = 1.5
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  if (!isActive) return null
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#888888"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// 蜡烛主体组件
function Candle({ isLit, windForce, onFlameOut }) {
  const candleRef = useRef()
  
  return (
    <group ref={candleRef}>
      {/* 蜡烛主体 */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
        <meshStandardMaterial 
          color="#f5deb3" 
          roughness={0.3}
        />
      </mesh>
      
      {/* 烛台 */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.2, 16]} />
        <meshStandardMaterial 
          color="#8b4513" 
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      
      {/* 蜡油 */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.05, 16]} />
        <meshStandardMaterial 
          color="#f0e68c" 
          roughness={0.2}
        />
      </mesh>
      
      {/* 烛芯 */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* 火焰 */}
      <Flame isLit={isLit} windForce={windForce} onFlameOut={onFlameOut} />
      
      {/* 烟雾 */}
      <SmokeParticles isActive={!isLit} />
    </group>
  )
}

// 主场景组件
function Scene({ isLit, windForce, onFlameOut }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <Candle isLit={isLit} windForce={windForce} onFlameOut={onFlameOut} />
      <OrbitControls 
        enableZoom={true} 
        enablePan={false}
        minDistance={3}
        maxDistance={8}
      />
    </>
  )
}

// 主应用组件
export default function App() {
  const [isLit, setIsLit] = useState(true)
  const [windForce, setWindForce] = useState(0)
  const canvasRef = useRef()
  const mousePos = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)
  
  const handleFlameOut = () => {
    setIsLit(false)
    setWindForce(0)
  }
  
  const handleRelight = () => {
    setIsLit(true)
  }
  
  const handleMouseMove = (e) => {
    if (canvasRef.current && e.buttons === 1) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      // 计算鼠标移动速度作为风力
      const deltaX = x - mousePos.current.x
      const deltaY = y - mousePos.current.y
      const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      setWindForce(Math.min(speed * 2, 1))
      
      mousePos.current = { x, y }
      isDragging.current = true
      
      // 风力逐渐衰减
      setTimeout(() => {
        if (isDragging.current) {
          setWindForce(prev => Math.max(0, prev - 0.1))
        }
      }, 100)
    }
  }
  
  const handleMouseUp = () => {
    isDragging.current = false
    setWindForce(0)
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100%', height: '100%' }}
      >
        <Canvas
          camera={{ position: [0, 2, 5], fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #0a0a0a, #1a1a2e)' }}
        >
          <Scene 
            isLit={isLit} 
            windForce={windForce} 
            onFlameOut={handleFlameOut} 
          />
        </Canvas>
      </canvas>
      
      {/* UI 覆盖层 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>3D 蜡烛</h1>
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          {isLit 
            ? '拖动鼠标向蜡烛吹风' 
            : '蜡烛已熄灭'}
        </p>
        {!isLit && (
          <button
            onClick={handleRelight}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#ffaa00',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              color: '#000',
              fontWeight: 'bold'
            }}
          >
            🔥 重新点亮
          </button>
        )}
      </div>
      
      {/* 风力指示器 */}
      {isLit && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          zIndex: 10
        }}>
          <p style={{ fontSize: '14px' }}>
            风力: {(windForce * 100).toFixed(0)}%
          </p>
          <div style={{
            width: '200px',
            height: '10px',
            backgroundColor: '#333',
            borderRadius: '5px',
            marginTop: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${windForce * 100}%`,
              height: '100%',
              backgroundColor: windForce > 0.7 ? '#ff4444' : '#44ff44',
              transition: 'width 0.1s'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
