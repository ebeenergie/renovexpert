'use client'

import { useRef, useState, useImperativeHandle, forwardRef } from 'react'

const SignaturePad = forwardRef(function SignaturePad({ label, height = 160 }, ref) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const [hasStroke, setHasStroke] = useState(false)

  useImperativeHandle(ref, () => ({
    clear() {
      const c = canvasRef.current
      c.getContext('2d').clearRect(0, 0, c.width, c.height)
      setHasStroke(false)
    },
    isEmpty() { return !hasStroke },
    toDataURL() { return canvasRef.current.toDataURL('image/png') },
    loadDataURL(dataUrl) {
      if (!dataUrl) return
      const c = canvasRef.current
      const ctx = c.getContext('2d')
      ctx.clearRect(0, 0, c.width, c.height)
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height)
      img.src = dataUrl
      setHasStroke(true)
    },
  }))

  function getPos(e) {
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - r.left) * (c.width / r.width),
      y: (src.clientY - r.top) * (c.height / r.height),
    }
  }

  function onDown(e) {
    e.preventDefault()
    drawing.current = true
    lastPos.current = getPos(e)
  }

  function onMove(e) {
    e.preventDefault()
    if (!drawing.current) return
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const p = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = p
    setHasStroke(true)
  }

  function onUp(e) {
    e.preventDefault()
    drawing.current = false
  }

  return (
    <div>
      {label && <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem' }}>{label}</p>}
      <div style={{ position: 'relative', border: '2px dashed #cbd5e1', borderRadius: '10px', backgroundColor: '#fafafa' }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={height}
          style={{ width: '100%', height: `${height}px`, display: 'block', cursor: 'crosshair', touchAction: 'none', borderRadius: '8px' }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
        {!hasStroke && (
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#cbd5e1', fontSize: '0.9rem', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            ✍️ Dessinez votre signature ici
          </span>
        )}
      </div>
    </div>
  )
})

export default SignaturePad
