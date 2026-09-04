import {
  useState, useRef, useCallback, useEffect, type CSSProperties, type TouchEvent,
} from 'react'
import { createPortal } from 'react-dom'

// ─── Static data ─────────────────────────────────────────────────────────────

const SQUARES = [
  { id: 0,  emoji: '🥯', label: 'Bagel' },
  { id: 1,  emoji: '🚇', label: 'Delayed subway train' },
  { id: 2,  emoji: '🎷', label: 'Street performer' },
  { id: 3,  emoji: '🐈', label: 'Bodega cat' },
  { id: 4,  emoji: '🍕', label: 'Pizza slice' },
  { id: 5,  emoji: '🎬', label: 'Movie filming set' },
  { id: 6,  emoji: '🚕', label: 'Yellow cab' },
  { id: 7,  emoji: '🐦', label: 'Pigeon' },
  { id: 8,  emoji: '👜', label: 'Dog in a tote bag' },
  { id: 9,  emoji: '☀️', label: 'Dodging a puddle on a sunny day' },
  { id: 10, emoji: '🛒', label: "Trader Joe's line" },
  { id: 11, emoji: '☕', label: 'Overpriced iced coffee' },
  { id: 12, emoji: '📸', label: 'FREE', isFree: true, isCenter: true },
  { id: 13, emoji: '🕶️', label: 'Celebrity spotted in the wild' },
  { id: 14, emoji: '🗑️', label: 'Trash pile mountain' },
  { id: 15, emoji: '🍹', label: 'Rooftop bar drinks' },
  { id: 16, emoji: '🍦', label: 'Mister Softee truck music' },
  { id: 17, emoji: '🐀', label: 'Rat running across the tracks' },
  { id: 18, emoji: '🌳', label: 'Central Park' },
  { id: 19, emoji: '🏗️', label: 'Scaffolding' },
  { id: 20, emoji: '🥙', label: 'Halal cart' },
  { id: 21, emoji: '🎤', label: 'Subway performance' },
  { id: 22, emoji: '🖤', label: 'Someone wearing black' },
  { id: 23, emoji: '💳', label: 'Subway swipe' },
  { id: 24, emoji: '🌇', label: 'Skyline view at sunset' },
]

const BINGO_LINES = [
  [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
  [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
  [0,6,12,18,24],[4,8,12,16,20],
]

const TILE_COLORS: [string, string][] = [
  ['#F43F8A','#BE185D'],['#F97316','#C2410C'],['#EAB308','#B45309'],
  ['#14B8A6','#0E7490'],['#A855F7','#7E22CE'],['#EC4899','#9333EA'],
  ['#38BDF8','#2563EB'],['#34D399','#0D9488'],['#FB7185','#E11D48'],
  ['#FBBF24','#D97706'],['#8B5CF6','#6D28D9'],['#22D3EE','#0284C7'],
  ['#F472B6','#DB2777'],['#F87171','#DC2626'],['#4ADE80','#16A34A'],
  ['#818CF8','#4F46E5'],['#FB923C','#EA580C'],['#2DD4BF','#0F766E'],
  ['#E879F9','#C026D3'],['#60A5FA','#4338CA'],['#FCD34D','#D97706'],
  ['#FC8181','#B91C1C'],['#C084FC','#7C3AED'],['#67E8F9','#0E7490'],
  ['#F0ABFC','#9333EA'],
]

const LETTER_COLORS = ['#FF2D78','#FF6B35','#FFD60A','#00D4AA','#8B5CF6']
const BURST_COLORS  = ['#FF2D78','#FFD60A','#00D4AA','#FF6B35','#8B5CF6','#06B6D4','#F472B6','#34D399','#FBBF24','#60A5FA']

const AFFIRMATIONS = [
  { text: 'GOOD JOB!',            emoji: '🙌' },
  { text: 'PERFECT!',             emoji: '✨' },
  { text: 'UNSTOPPABLE!',         emoji: '⚡' },
  { text: 'CRUSHED IT!',          emoji: '💥' },
  { text: 'ABSOLUTE LEGEND!',     emoji: '👑' },
  { text: "THAT'S HOW IT'S DONE!",emoji: '🔥' },
  { text: 'BINGO MASTER!',        emoji: '🏆' },
  { text: "YOU'RE THAT GIRL!",    emoji: '💅' },
  { text: 'ICONIC BEHAVIOR!',     emoji: '🌈' },
  { text: 'MAIN CHARACTER!',      emoji: '🌟' },
  { text: 'WE LOVE TO SEE IT!',   emoji: '😍' },
  { text: 'NEW YORK CITY ROYALTY!', emoji: '🗽' },
  { text: 'SLAYING ACCORDINGLY!', emoji: '🔱' },
]

// Tiles that carry optional sponsored badges (shown to VIP users & card owner)
const SPONSORED: Record<number, string> = {}

// ─── App constants ────────────────────────────────────────────────────────────

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/6oUbJ1dDq3LBcJP5AT0Ba01'

const VIP_KEY         = 'isVIP'
const VIP_EXPIRY_KEY  = 'vipExpiry'
const VIP_DURATION_MS = 30 * 24 * 60 * 60 * 1000
const CUSTOM_KEY      = 'fib-custom-v1'
const META_KEY        = 'fib-meta-v2'
const APP_URL         = 'https://write-unify-73848034.figma.site'
const MAX_PLAYERS     = 8

// ─── Board link encoding ──────────────────────────────────────────────────────

type CustomLabels = Record<number, { label: string; emoji: string }>

function encodeBoardToLink(labels: CustomLabels): string {
  try {
    const payload = JSON.stringify(labels)
    return `${APP_URL}/?board=${btoa(encodeURIComponent(payload))}`
  } catch { return APP_URL }
}

function decodeBoardFromParam(encoded: string): CustomLabels | null {
  try { return JSON.parse(decodeURIComponent(atob(encoded))) } catch { return null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rnd(a: number, b: number) { return a + Math.random() * (b - a) }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function formatTime(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

// ─── Image compression ────────────────────────────────────────────────────────

async function compressImage(dataUrl: string, maxPx = 820, quality = 0.78): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ─── HD card export ───────────────────────────────────────────────────────────

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y)
  ctx.closePath()
}

async function exportHDCard(
  photos: Record<number, string>,
  customLabels: Record<number, { label: string; emoji: string }>,
  completedCount: number,
) {
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0F0320'); bg.addColorStop(0.5, '#3B0764'); bg.addColorStop(1, '#1A0438')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Title
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FF2D78'
  ctx.font = 'bold 72px sans-serif'
  ctx.fillText('🗽 NEW YORK CITY BINGO 🗽', W / 2, 110)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '38px sans-serif'
  ctx.fillText(`${completedCount} / 24 challenges completed`, W / 2, 165)

  // Grid
  const margin = 28, gap = 9
  const cellSize = (W - margin * 2 - gap * 4) / 5
  const gridTop = 215

  for (let i = 0; i < 25; i++) {
    const col = i % 5, row = Math.floor(i / 5)
    const x = margin + col * (cellSize + gap)
    const y = gridTop + row * (cellSize + gap)
    const [c1, c2] = TILE_COLORS[i]

    ctx.save()
    roundRect(ctx, x, y, cellSize, cellSize, 14)
    ctx.clip()

    if (photos[i]) {
      try {
        const img = await loadImg(photos[i])
        ctx.drawImage(img, x, y, cellSize, cellSize)
        const ov = ctx.createLinearGradient(x, y, x, y + cellSize)
        ov.addColorStop(0.45, 'transparent'); ov.addColorStop(1, 'rgba(0,0,0,0.65)')
        ctx.fillStyle = ov; ctx.fillRect(x, y, cellSize, cellSize)
      } catch {
        const tg = ctx.createLinearGradient(x, y, x+cellSize, y+cellSize)
        tg.addColorStop(0, c1); tg.addColorStop(1, c2)
        ctx.fillStyle = tg; ctx.fillRect(x, y, cellSize, cellSize)
      }
    } else {
      const tg = ctx.createLinearGradient(x, y, x+cellSize, y+cellSize)
      tg.addColorStop(0, c1); tg.addColorStop(1, c2)
      ctx.fillStyle = tg; ctx.fillRect(x, y, cellSize, cellSize)
    }
    ctx.restore()

    // Emoji / label
    const sq = SQUARES[i]
    if (i === 12) {
      ctx.fillStyle = '#FFD60A'; ctx.font = `bold ${cellSize * 0.18}px sans-serif`
      ctx.textAlign = 'center'; ctx.fillText('FREE', x + cellSize/2, y + cellSize/2 + 8)
    } else if (!photos[i]) {
      const em = customLabels[i]?.emoji ?? sq.emoji
      ctx.font = `${cellSize * 0.38}px sans-serif`
      ctx.textAlign = 'center'; ctx.fillText(em, x + cellSize/2, y + cellSize/2 + 10)
    }

    // Green check badge
    if (photos[i] && i !== 12) {
      ctx.fillStyle = '#22C55E'
      ctx.beginPath(); ctx.arc(x+14, y+14, 10, 0, Math.PI*2); ctx.fill()
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(x+9,y+14); ctx.lineTo(x+13,y+18); ctx.lineTo(x+19,y+10); ctx.stroke()
    }
  }

  // Branding
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '30px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('🗽 New York City Bingo — play at write-unify-73848034.figma.site 🚕', W/2, H - 55)

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'new-york-city-bingo-hd.jpg'
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }, 'image/jpeg', 0.92)
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const IDB_NAME = 'new-york-city-bingo', IDB_VER = 1, PHOTO_STORE = 'photos'

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VER)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE)
    }
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror   = () => reject(req.error)
  })
}
async function idbPut(id: number, data: string) {
  const db = await openPhotoDb()
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(PHOTO_STORE,'readwrite')
    tx.objectStore(PHOTO_STORE).put(data,id)
    tx.oncomplete=()=>{db.close();res()}; tx.onerror=()=>{db.close();rej(tx.error)}
  })
}
async function idbDelete(id: number) {
  const db = await openPhotoDb()
  return new Promise<void>((res,rej)=>{
    const tx=db.transaction(PHOTO_STORE,'readwrite')
    tx.objectStore(PHOTO_STORE).delete(id)
    tx.oncomplete=()=>{db.close();res()}; tx.onerror=()=>{db.close();rej(tx.error)}
  })
}
async function idbLoadAll(): Promise<Record<number,string>> {
  const db = await openPhotoDb()
  return new Promise((res,rej)=>{
    const result: Record<number,string>={}
    const req=db.transaction(PHOTO_STORE,'readonly').objectStore(PHOTO_STORE).openCursor()
    req.onsuccess=e=>{
      const cur=(e.target as IDBRequest<IDBCursorWithValue|null>).result
      if(cur){result[cur.key as number]=cur.value;cur.continue()}else{db.close();res(result)}
    }
    req.onerror=()=>{db.close();rej(req.error)}
  })
}
async function idbClear() {
  const db = await openPhotoDb()
  return new Promise<void>((res,rej)=>{
    const tx=db.transaction(PHOTO_STORE,'readwrite')
    tx.objectStore(PHOTO_STORE).clear()
    tx.oncomplete=()=>{db.close();res()}; tx.onerror=()=>{db.close();rej(tx.error)}
  })
}

// ─── Metadata localStorage ────────────────────────────────────────────────────

interface StoredMeta {
  completed: number[]; photoTimes: Record<string,string>; celebratedKey: string[]; hasPhotos: boolean
}
function saveMeta(completed:Set<number>,photoTimes:Record<number,Date>,celebratedKey:Set<string>,hasPhotos:boolean){
  try {
    localStorage.setItem(META_KEY,JSON.stringify({
      completed:[...completed],
      photoTimes:Object.fromEntries(Object.entries(photoTimes).map(([k,v])=>[k,(v as Date).toISOString()])),
      celebratedKey:[...celebratedKey],hasPhotos,
    } as StoredMeta))
  } catch {}
}
function loadMeta(){
  const def={completed:new Set<number>([12]),photoTimes:{} as Record<number,Date>,celebratedKey:new Set<string>(),hasPhotos:false}
  try {
    const raw=localStorage.getItem(META_KEY)
    if(!raw)return def
    const m=JSON.parse(raw) as StoredMeta
    return {
      completed:new Set<number>(m.completed??[12]),
      photoTimes:Object.fromEntries(Object.entries(m.photoTimes??{}).map(([k,v])=>[Number(k),new Date(v as string)])),
      celebratedKey:new Set<string>(m.celebratedKey??[]),
      hasPhotos:m.hasPhotos??false,
    }
  } catch { return def }
}

// ─── Custom labels localStorage ───────────────────────────────────────────────

function loadCustomLabels():Record<number,{label:string;emoji:string}>{
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}') } catch { return {} }
}
function saveCustomLabels(labels:Record<number,{label:string;emoji:string}>){
  try { localStorage.setItem(CUSTOM_KEY,JSON.stringify(labels)) } catch {}
}

// ─── Ambient Web Audio hook ───────────────────────────────────────────────────
// Synthesized tropical pad — no external CDN dependency, zero CORS issues.
// To use a real audio file instead, swap this hook for an <audio> element.

function useAmbientAudio(enabled: boolean) {
  const ctxRef     = useRef<AudioContext|null>(null)
  const masterRef  = useRef<GainNode|null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval>|null>(null)
  const startedRef = useRef(false)

  const pluck = useCallback((ctx: AudioContext, master: GainNode, freq: number, when: number) => {
    // Steel-pan timbre: triangle fundamental + 2nd/3rd harmonics with fast decay
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, when)
    g.gain.linearRampToValueAtTime(0.18, when + 0.008)
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.55)
    g.connect(master)

    ;[1, 2.756, 5.404].forEach((ratio, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 0 ? 'triangle' : 'sine'
      osc.frequency.value = freq * ratio
      const hg = ctx.createGain(); hg.gain.value = i === 0 ? 1 : i === 1 ? 0.28 : 0.1
      osc.connect(hg); hg.connect(g)
      osc.start(when); osc.stop(when + 0.6)
    })
  }, [])

  const boot = useCallback(() => {
    if (startedRef.current) {
      ctxRef.current?.resume()
      masterRef.current?.gain.linearRampToValueAtTime(0.72, (ctxRef.current?.currentTime??0)+0.8)
      return
    }
    const ctx = new AudioContext(); ctxRef.current = ctx
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
    masterRef.current = master

    // Warm bass pad — C2 + G2 sine drones
    const padFreqs = [65.41, 98.00, 130.81, 196.00]
    padFreqs.forEach(f => {
      const osc = ctx.createOscillator(), pg = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = f; pg.gain.value = 0.06
      osc.connect(pg); pg.connect(master); osc.start()
    })

    // Breath LFO on pad (slow swell)
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain()
    lfo.frequency.value = 0.22; lfoG.gain.value = 0.04
    lfo.connect(lfoG); lfoG.connect(master.gain); lfo.start()

    // C major pentatonic arpeggio — upbeat 16th-note island feel at 118bpm
    // C4 E4 G4 A4 C5 E5 G5 A5
    const scale = [261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 880.00]
    const pattern = [0, 2, 4, 5, 4, 2, 6, 4, 1, 3, 5, 4, 2, 0, 3, 2] // index into scale
    const step16ms = (60 / 118) * 1000 * 0.5 // 16th note at 118bpm ≈ 254ms
    let beat = 0

    // Fade in then start arpeggio
    master.gain.linearRampToValueAtTime(0.72, ctx.currentTime + 1.4)

    timerRef.current = setInterval(() => {
      if (!ctxRef.current || ctxRef.current.state === 'suspended') return
      const now = ctxRef.current.currentTime
      const noteIdx = pattern[beat % pattern.length]
      const freq = scale[noteIdx]
      // Accent every 4 beats with a higher octave note
      const f = beat % 8 === 0 ? freq * 2 : beat % 4 === 0 ? freq * 1.5 : freq
      pluck(ctxRef.current, masterRef.current!, f, now)
      beat++
    }, step16ms)

    startedRef.current = true
  }, [pluck])

  const silence = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (!masterRef.current || !ctxRef.current) return
    masterRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.7)
    setTimeout(() => ctxRef.current?.suspend(), 800)
  }, [])

  useEffect(() => { enabled ? boot() : silence() }, [enabled, boot, silence])
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    ctxRef.current?.close()
  }, [])
}

// ─── Save badge ───────────────────────────────────────────────────────────────

type SaveStatus = 'idle'|'saving'|'saved'
// ─── VIP Member Banner ────────────────────────────────────────────────────────

function VIPMemberBanner() {
  const expiry = Number(localStorage.getItem(VIP_EXPIRY_KEY) ?? '0')
  const expiryDate = expiry
    ? new Date(expiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - Date.now()) / (1000*60*60*24))) : null

  return (
    <div className="relative w-full overflow-hidden rounded-2xl vip-border-glow"
      style={{ background:'linear-gradient(135deg,#0D0B18 0%,#1A1628 50%,#0D0B18 100%)',
               border:'1px solid rgba(212,175,55,0.35)' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="crown-pulse flex-shrink-0 text-[26px] leading-none">👑</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-[3px]">
            <span className="font-black text-[13px] tracking-[0.12em] uppercase"
              style={{ fontFamily:"'Cormorant Garamond',serif",
                       background:'linear-gradient(90deg,#C9A84C,#FFE08A,#D4AF37)',
                       WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
              VIP Member
            </span>
            <div className="h-[1px] flex-1 opacity-25" style={{ background:'linear-gradient(90deg,#D4AF37,transparent)' }}/>
          </div>
          <p className="text-[11px] font-semibold" style={{ color:'rgba(212,175,55,0.55)' }}>
            Custom boards · HD export · Sponsored squares
          </p>
          {expiryDate&&(
            <p className="text-[10px] font-bold mt-[2px]"
              style={{ color: daysLeft&&daysLeft<=5 ? 'rgba(255,100,60,0.85)' : 'rgba(212,175,55,0.4)' }}>
              {daysLeft&&daysLeft<=5
                ? `⚠ Expires in ${daysLeft} day${daysLeft===1?'':'s'} — ${expiryDate}`
                : `Valid until ${expiryDate}`}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#D4AF37',boxShadow:'0 0 6px #D4AF37' }}/>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:'rgba(212,175,55,0.7)' }}>Active</span>
        </div>
      </div>
    </div>
  )
}

// ─── Save badge ───────────────────────────────────────────────────────────────

function SaveBadge({ status }: { status: SaveStatus }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold transition-all duration-300"
      style={{ color:status==='saving'?'rgba(255,200,60,0.9)':'rgba(100,220,130,0.85)' }}>
      {status==='saving' ? (
        <><span className="w-[7px] h-[7px] rounded-full border border-yellow-400/70 border-t-transparent animate-spin inline-block"/>Saving…</>
      ) : (
        <><svg viewBox="0 0 10 10" width="9" height="9" fill="none">
          <circle cx="5" cy="5" r="4.5" fill="#22C55E" opacity="0.85"/>
          <path d="M2.8 5l1.4 1.4 3-3" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>Saved to device</>
      )}
    </span>
  )
}

// ─── VIP Modal ────────────────────────────────────────────────────────────────

function VIPModal({ isVIP, onClose, onUpgrade, onToggleEdit, isEditing, onShareLink }: {
  isVIP: boolean; onClose: ()=>void; onUpgrade: ()=>void
  onToggleEdit: ()=>void; isEditing: boolean; onShareLink: ()=>void
}) {
  const [paymentPending, setPaymentPending] = useState(false)

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex:9999 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}/>
      <div className="modal-bounce-in relative mx-4 rounded-[28px] overflow-hidden w-full"
        style={{ maxWidth:370,
                 background: isVIP
                   ? 'linear-gradient(150deg,#0D0B18,#1A1628,#0D0B18)'
                   : 'linear-gradient(150deg,#12043A,#2D1B69,#1A0533)',
                 border: isVIP ? '1.5px solid rgba(212,175,55,0.4)' : '1.5px solid rgba(255,255,255,0.13)',
                 boxShadow: isVIP ? '0 8px 60px rgba(212,175,55,0.25)' : '0 8px 60px rgba(139,92,246,0.5)' }}>
        <div className="h-[3px]" style={{ background: isVIP
          ? 'linear-gradient(90deg,transparent,#8B6914,#D4AF37,#FFE08A,#D4AF37,#8B6914,transparent)'
          : 'linear-gradient(90deg,#FF2D78,#FF6B35,#FFD60A,#8B5CF6)' }}/>
        <div className="px-5 pt-5 pb-6">

          {/* Header */}
          <div className="text-center mb-5">
            <div className="text-4xl mb-2 crown-pulse inline-block">{isVIP ? '👑' : '✨'}</div>
            <h2 className="font-black text-[22px] mb-1"
              style={{ fontFamily:'Pacifico,cursive',
                       color: isVIP ? undefined : 'white',
                       background: isVIP ? 'linear-gradient(90deg,#C9A84C,#FFE08A,#D4AF37)' : undefined,
                       WebkitBackgroundClip: isVIP ? 'text' : undefined,
                       WebkitTextFillColor: isVIP ? 'transparent' : undefined,
                       backgroundClip: isVIP ? 'text' : undefined }}>
              {isVIP ? 'VIP Member' : 'Go VIP — $2.99'}
            </h2>
            {isVIP ? (
              <p className="text-[11px] font-semibold" style={{ color:'rgba(212,175,55,0.55)' }}>
                Customize your board · Share with up to {MAX_PLAYERS} players · Valid 30 days
              </p>
            ) : (
              <p className="text-pink-300/80 text-sm font-semibold">One-time · $2.99 · Valid 30 days</p>
            )}
          </div>

          {/* What VIP gives you */}
          {isVIP ? (
            <div className="flex flex-col gap-2.5 mb-5">
              {/* Step 1 */}
              <div className="rounded-2xl p-3.5 flex items-start gap-3"
                style={{ background:'rgba(212,175,55,0.07)',border:'1px solid rgba(212,175,55,0.2)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#8B6914,#D4AF37)' }}>✏️</div>
                <div>
                  <p className="font-black text-[13px] mb-0.5" style={{ color:'rgba(212,175,55,0.9)' }}>
                    Step 1 — Customize Your Board
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color:'rgba(212,175,55,0.5)' }}>
                    Tap "Edit Board" below to change the emoji and text on any square.
                  </p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="rounded-2xl p-3.5 flex items-start gap-3"
                style={{ background:'rgba(212,175,55,0.07)',border:'1px solid rgba(212,175,55,0.2)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#8B6914,#D4AF37)' }}>🔗</div>
                <div>
                  <p className="font-black text-[13px] mb-0.5" style={{ color:'rgba(212,175,55,0.9)' }}>
                    Step 2 — Generate &amp; Share Link
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color:'rgba(212,175,55,0.5)' }}>
                    Get a unique link with your custom board baked in. Send it to up to {MAX_PLAYERS} players — each plays on their own device.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Pre-purchase teaser */
            <div className="mb-5 rounded-2xl p-4"
              style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(219,39,119,0.15))',
                       border:'1.5px solid rgba(139,92,246,0.4)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 mb-2">What you unlock</p>
              <p className="text-white font-black text-[15px] leading-snug mb-2">
                Custom Board + Shareable Player Link
              </p>
              <p className="text-white/65 text-[12px] leading-relaxed mb-3">
                Customize every square with your own text and emojis, then share a unique link with up to {MAX_PLAYERS} friends. Each player gets your exact board on their device.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['✏️ Edit any tile','🎨 Custom emojis','🔗 Unique share link',`👥 Up to ${MAX_PLAYERS} players`].map(tag=>(
                  <span key={tag} className="text-[10px] font-bold px-2 py-[3px] rounded-full"
                    style={{ background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {isVIP ? (
            <div className="flex flex-col gap-2.5">
              <button onClick={()=>{onShareLink();onClose()}}
                className="w-full py-3.5 rounded-2xl font-black text-[#06050F] text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                style={{ background:'linear-gradient(90deg,#C9A84C,#FFE08A)',boxShadow:'0 4px 20px rgba(212,175,55,0.4)' }}>
                <span>🔗</span><span>Generate Player Link</span>
              </button>
              <button onClick={()=>{onToggleEdit();onClose()}}
                className="w-full py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                style={isEditing
                  ? { background:'linear-gradient(90deg,#4ADE80,#059669)',color:'white',boxShadow:'0 4px 20px rgba(74,222,128,0.4)' }
                  : { background:'rgba(212,175,55,0.1)',color:'rgba(212,175,55,0.9)',
                      border:'1px solid rgba(212,175,55,0.35)',boxShadow:'0 4px 20px rgba(212,175,55,0.1)' }}>
                <span>{isEditing?'✅':'✏️'}</span>
                <span>{isEditing?'Done Editing':'Edit Board Squares'}</span>
              </button>
            </div>
          ) : paymentPending ? (
            <div className="flex flex-col gap-2.5">
              <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                style={{ background:'rgba(255,213,0,0.1)',border:'1.5px solid rgba(255,213,0,0.35)' }}>
                <div className="w-5 h-5 rounded-full border-2 border-yellow-400/60 border-t-transparent animate-spin flex-shrink-0"/>
                <div>
                  <p className="text-yellow-300 font-black text-[13px] leading-tight">Payment window open</p>
                  <p className="text-white/55 text-[11px] leading-tight mt-0.5">Complete payment — Stripe will send you back here automatically to unlock VIP.</p>
                </div>
              </div>
              <button
                onClick={()=>window.open('https://buy.stripe.com/6oUbJ1dDq3LBcJP5AT0Ba01','_blank','noopener,noreferrer')}
                className="w-full py-3 rounded-2xl font-bold text-white/60 text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform border"
                style={{ background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.1)' }}>
                <span>↩</span><span>Re-open payment page</span>
              </button>
            </div>
          ) : (
            <button
              onClick={()=>{
                window.open('https://buy.stripe.com/6oUbJ1dDq3LBcJP5AT0Ba01','_blank','noopener,noreferrer')
                setPaymentPending(true)
              }}
              className="w-full py-4 rounded-2xl font-black text-white text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{ background:'linear-gradient(90deg,#FF2D78,#8B5CF6)',boxShadow:'0 4px 24px rgba(255,45,120,0.5)' }}>
              <span>✨</span><span>Unlock VIP & Start Customizing — $2.99</span>
            </button>
          )}

          <button onClick={onClose}
            className="w-full mt-2.5 py-3 rounded-2xl font-bold text-white/50 text-sm border active:scale-[0.97] transition-transform"
            style={{ background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.09)' }}>
            {isVIP ? 'Close' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Custom tile editor (VIP) ─────────────────────────────────────────────────

function CustomTileEditor({ square, current, onSave, onClose }: {
  square: typeof SQUARES[0]
  current: { label:string; emoji:string }|undefined
  onSave: (label:string,emoji:string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(current?.label ?? square.label)
  const [emoji, setEmoji] = useState(current?.emoji ?? square.emoji)
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex:10001 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="modal-bounce-in relative mx-6 rounded-2xl overflow-hidden w-full"
        style={{ maxWidth:340,background:'linear-gradient(145deg,#12043A,#2D1B69)',border:'1.5px solid rgba(255,255,255,0.13)' }}>
        <div className="h-[3px]" style={{ background:'linear-gradient(90deg,#FFD60A,#FF6B35,#8B5CF6)' }}/>
        <div className="p-5">
          <h3 className="text-white font-black text-lg text-center mb-4">✏️ Edit Square</h3>
          <div className="mb-3">
            <label className="text-white/50 text-[10px] font-black uppercase tracking-wider mb-1.5 block">Emoji</label>
            <input type="text" value={emoji} onChange={e=>setEmoji(e.target.value)} maxLength={4}
              className="w-full rounded-xl px-4 py-2.5 text-2xl text-center font-bold focus:outline-none"
              style={{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white' }}/>
          </div>
          <div className="mb-5">
            <label className="text-white/50 text-[10px] font-black uppercase tracking-wider mb-1.5 block">Challenge Text</label>
            <input type="text" value={label} onChange={e=>setLabel(e.target.value)} maxLength={32}
              className="w-full rounded-xl px-4 py-2.5 font-bold focus:outline-none"
              style={{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white' }}/>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-white/60 text-sm border active:scale-95 transition-transform"
              style={{ background:'rgba(255,255,255,0.06)',borderColor:'rgba(255,255,255,0.12)' }}>
              Cancel
            </button>
            <button onClick={()=>{onSave(label.trim()||square.label,emoji||square.emoji);onClose()}}
              className="flex-[2] py-3 rounded-xl font-black text-white text-sm active:scale-95 transition-transform"
              style={{ background:'linear-gradient(90deg,#FF2D78,#FF6B35)',boxShadow:'0 3px 14px rgba(255,45,120,0.4)' }}>
              Save ✓
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Shared effect components ─────────────────────────────────────────────────

function TileBurst({ x, y, onDone }: { x:number; y:number; onDone:()=>void }) {
  useEffect(()=>{ const t=setTimeout(onDone,900); return ()=>clearTimeout(t) },[onDone])
  const particles=Array.from({length:22},(_,i)=>{
    const angle=(i/22)*360+rnd(-8,8),dist=rnd(45,100),rad=(angle*Math.PI)/180
    const shape=pick(['circle','rect','star'] as const)
    return {i,shape,size:rnd(6,14),color:pick(BURST_COLORS),dur:rnd(0.45,0.75),
            tx:Math.cos(rad)*dist,ty:Math.sin(rad)*dist,rot:rnd(-360,360)}
  })
  return createPortal(
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:9998 }}>
      {particles.map(p=>(
        <div key={p.i} className="burst-particle absolute"
          style={{ left:x,top:y,width:p.size,height:p.shape==='rect'?p.size*0.48:p.size,
                   borderRadius:p.shape==='circle'?'50%':p.shape==='star'?'0':'2px',
                   background:p.color,boxShadow:`0 0 8px 2px ${p.color}90`,
                   clipPath:p.shape==='star'?'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)':undefined,
                   transform:'translate(-50%,-50%)','--tx':`${p.tx}px`,'--ty':`${p.ty}px`,'--rot':`${p.rot}deg`,
                   animationDuration:`${p.dur}s`} as CSSProperties}/>
      ))}
      <div className="tap-ripple absolute rounded-full border-2 border-white pointer-events-none"
        style={{ left:x,top:y,width:40,height:40,transform:'translate(-50%,-50%)' }}/>
    </div>,
    document.body
  )
}

function ConfettiCanvas({ count=110 }: { count?:number }) {
  const pieces=Array.from({length:count},(_,i)=>({
    id:i,x:rnd(0,100),color:pick(BURST_COLORS),size:rnd(6,15),dur:rnd(2.4,5),delay:rnd(0,2.8),isCircle:Math.random()>0.45
  }))
  return createPortal(
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:9997 }}>
      {pieces.map(p=>(
        <div key={p.id} className="confetti-piece absolute"
          style={{ left:`${p.x}%`,top:'-20px',width:p.size,height:p.isCircle?p.size:p.size*0.45,
                   borderRadius:p.isCircle?'50%':'2px',background:p.color,boxShadow:`0 0 5px ${p.color}80`,
                   animationDuration:`${p.dur}s`,animationDelay:`${p.delay}s`}}/>
      ))}
    </div>,
    document.body
  )
}

function FireworksCanvas() {
  type FW={id:number;xPct:number;yPct:number;sparks:{a:number;d:number;c:string;dur:number}[]}
  const [bursts,setBursts]=useState<FW[]>([])
  const nid=useRef(0)
  const spawn=useCallback(()=>{
    const id=nid.current++
    const sparks=Array.from({length:28},(_,i)=>({a:(i/28)*360+rnd(-6,6),d:rnd(55,150),c:pick(BURST_COLORS),dur:rnd(0.7,1.1)}))
    setBursts(prev=>[...prev,{id,xPct:rnd(12,88),yPct:rnd(8,55),sparks}])
    setTimeout(()=>setBursts(prev=>prev.filter(b=>b.id!==id)),1200)
  },[])
  useEffect(()=>{
    const ts=[0,280,600,980,1380,1750].map(d=>setTimeout(spawn,d))
    return ()=>ts.forEach(clearTimeout)
  },[spawn])
  return createPortal(
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:9998 }}>
      {bursts.map(b=>(
        <div key={b.id} className="absolute" style={{ left:`${b.xPct}%`,top:`${b.yPct}%` }}>
          <div className="fw-flash absolute rounded-full" style={{ width:18,height:18,background:'white',boxShadow:'0 0 30px 14px white',transform:'translate(-50%,-50%)' }}/>
          {b.sparks.map((s,i)=>{
            const rad=(s.a*Math.PI)/180
            return <div key={i} className="fw-spark absolute rounded-full"
              style={{ width:rnd(4,9),height:rnd(4,9),background:s.c,boxShadow:`0 0 10px 3px ${s.c}`,
                       transform:'translate(-50%,-50%)','--sx':`${Math.cos(rad)*s.d}px`,'--sy':`${Math.sin(rad)*s.d}px`,
                       animationDuration:`${s.dur}s`} as CSSProperties}/>
          })}
        </div>
      ))}
    </div>,
    document.body
  )
}

function GoldShimmer() {
  return createPortal(<div className="fixed inset-0 gold-shimmer-overlay pointer-events-none" style={{ zIndex:9996 }}/>,document.body)
}

function AffirmationBanner({ text, emoji, onDone }: { text:string; emoji:string; onDone:()=>void }) {
  const [leaving,setLeaving]=useState(false)
  useEffect(()=>{ const t1=setTimeout(()=>setLeaving(true),2200),t2=setTimeout(onDone,2600); return ()=>{clearTimeout(t1);clearTimeout(t2)} },[onDone])
  const sparkles=Array.from({length:10},(_,i)=>({id:i,r:rnd(58,78),size:rnd(5,10),color:pick(BURST_COLORS),dur:rnd(1.6,2.8),delay:(i/10)*-2.5,shape:Math.random()>0.5?'★':'✦'}))
  const floaters=['✨','🌈','🔥','💅'].map((e,i)=>({e,i,x:rnd(10,90),dur:rnd(1.2,2),delay:rnd(0,0.5)}))
  const [c1,c2]=[pick(BURST_COLORS),pick(BURST_COLORS)]
  return createPortal(
    <div className="fixed inset-x-0 flex justify-center pointer-events-none" style={{ top:'18%',zIndex:9990 }}>
      {floaters.map(f=>(
        <div key={f.i} className="emoji-float absolute text-xl"
          style={{ left:`${f.x}%`,bottom:'100%','--dur':`${f.dur}s`,'--delay':`${f.delay}s`} as CSSProperties}>{f.e}</div>
      ))}
      <div className={leaving?'aff-out':'aff-in'} style={{ position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ overflow:'visible' }}>
          {sparkles.map(s=>(
            <div key={s.id} className="sparkle-orbit absolute text-center leading-none"
              style={{ color:s.color,fontSize:s.size,'--r':`${s.r}px`,'--dur':`${s.dur}s`,'--delay':`${s.delay}s`} as CSSProperties}>{s.shape}</div>
          ))}
        </div>
        <div className="relative px-7 py-4 rounded-2xl"
          style={{ background:`linear-gradient(135deg,${c1},${c2})`,
                   boxShadow:`0 8px 40px ${c1}70,0 0 60px ${c2}40`,border:'1.5px solid rgba(255,255,255,0.25)' }}>
          <div className="text-3xl mb-1 text-center">{emoji}</div>
          <div className="font-black text-white text-2xl text-center text-glow-pulse leading-tight">{text}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function LightboxModal({ square, photo, timestamp, onClose, onReplace, onDelete }: {
  square:typeof SQUARES[0]; photo:string; timestamp:Date|null
  onClose:()=>void; onReplace:()=>void; onDelete:()=>void
}) {
  const [zoom,setZoom]=useState(1),[panX,setPanX]=useState(0),[panY,setPanY]=useState(0)
  const [showControls,setShowControls]=useState(true)
  const touchRef=useRef<{startDist:number;startZoom:number;startX:number;startY:number;startPanX:number;startPanY:number}|null>(null)
  const lastTap=useRef(0),ctrlTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const resetZoom=()=>{setZoom(1);setPanX(0);setPanY(0)}
  const bump=()=>{
    setShowControls(true)
    if(ctrlTimer.current)clearTimeout(ctrlTimer.current)
    ctrlTimer.current=setTimeout(()=>setShowControls(false),3500)
  }
  useEffect(()=>{bump();return ()=>{if(ctrlTimer.current)clearTimeout(ctrlTimer.current)}},[])
  const getTD=(t:React.TouchList)=>Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY)
  const getTM=(t:React.TouchList)=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2})
  const onTS=(e:TouchEvent<HTMLDivElement>)=>{
    bump()
    if(e.touches.length===2){e.preventDefault();const m=getTM(e.touches);touchRef.current={startDist:getTD(e.touches),startZoom:zoom,startX:m.x,startY:m.y,startPanX:panX,startPanY:panY}}
    else if(e.touches.length===1){const now=Date.now();if(now-lastTap.current<280){zoom>1?resetZoom():setZoom(2.5)};lastTap.current=now}
  }
  const onTM=(e:TouchEvent<HTMLDivElement>)=>{
    if(e.touches.length===2&&touchRef.current){
      e.preventDefault();const ref=touchRef.current,dist=getTD(e.touches),mid=getTM(e.touches)
      setZoom(Math.min(5,Math.max(1,ref.startZoom*(dist/ref.startDist))))
      setPanX(ref.startPanX+mid.x-ref.startX);setPanY(ref.startPanY+mid.y-ref.startY)
    }
  }
  const [c1,c2]=TILE_COLORS[square.id]
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex:10000,background:'rgba(0,0,0,0.94)' }}>
      <div className="absolute inset-0" onClick={()=>{if(zoom>1)resetZoom();else onClose()}}/>
      <div className="lightbox-in relative w-full h-full flex items-center justify-center"
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={()=>{touchRef.current=null}}
        onClick={bump} style={{ touchAction:'none' }}>
        <img src={photo} alt={square.label} draggable={false}
          style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain',userSelect:'none',borderRadius:zoom===1?16:0,
                   transform:`scale(${zoom}) translate(${panX/zoom}px,${panY/zoom}px)`,
                   transition:zoom===1?'transform 0.3s cubic-bezier(0.34,1.2,0.64,1)':'none' }}/>
      </div>
      <div className={`absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-10 pb-5 pointer-events-none transition-opacity duration-300 controls-up ${showControls?'opacity-100':'opacity-0'}`}
        style={{ background:'linear-gradient(to bottom,rgba(0,0,0,0.75),transparent)' }}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-auto"
          style={{ background:`linear-gradient(90deg,${c1},${c2})`,boxShadow:`0 2px 14px ${c1}60` }}>
          <span className="text-base">{square.emoji}</span>
          <div>
            <p className="text-white font-black text-xs leading-tight">{square.label}</p>
            {timestamp&&<p className="text-white/70 text-[10px] leading-tight">Added {formatTime(timestamp)}</p>}
          </div>
        </div>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-transform"
          style={{ background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div className={`absolute bottom-0 inset-x-0 px-5 pb-10 pt-6 pointer-events-none transition-opacity duration-300 controls-up ${showControls?'opacity-100':'opacity-0'}`}
        style={{ background:'linear-gradient(to top,rgba(0,0,0,0.82),transparent)' }}>
        <p className="text-white/40 text-[10px] text-center mb-3 font-semibold">
          {zoom>1?'Double-tap to reset · Drag to pan':'Pinch to zoom · Double-tap to expand · Tap outside to close'}
        </p>
        <div className="flex gap-3 pointer-events-auto">
          <button onClick={()=>{onDelete();onClose()}}
            className="flex-1 py-3 rounded-2xl font-bold text-white/80 text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{ background:'rgba(239,68,68,0.25)',border:'1px solid rgba(239,68,68,0.4)',backdropFilter:'blur(8px)' }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>Delete
          </button>
          <button onClick={onReplace}
            className="flex-[2] py-3 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background:'linear-gradient(90deg,#FF2D78,#FF6B35)',boxShadow:'0 4px 16px rgba(255,45,120,0.4)' }}>
            Replace Photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Bingo Modal ──────────────────────────────────────────────────────────────

function BingoModal({ lineCount, affirmation, onClose, onShare }: {
  lineCount:number; affirmation:{text:string;emoji:string}; onClose:()=>void; onShare:()=>void
}) {
  const body=lineCount>=12?'Full board — you are New York City royalty. Period.':lineCount>=3?'Three rows in? You literally ate the whole board!':lineCount===2?'Double bingo! Double the drama. We love to see it.':'The city that never sleeps bows before you 🗽'
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex:9999 }}>
      <div className="absolute inset-0 bg-black/78 backdrop-blur-[6px]"/>
      <ConfettiCanvas count={130}/><FireworksCanvas/><GoldShimmer/>
      <div className="modal-bounce-in relative mx-5 rounded-[28px] overflow-hidden w-full"
        style={{ maxWidth:350,background:'linear-gradient(150deg,#12043A,#2D1B69,#1A0533)',
                 border:'1.5px solid rgba(255,255,255,0.13)',boxShadow:'0 0 0 1px rgba(255,45,120,0.3),0 8px 60px rgba(219,39,119,0.55)' }}>
        <div className="h-[3px]" style={{ background:'linear-gradient(90deg,#FF2D78,#FF6B35,#FFD60A,#00D4AA,#8B5CF6,#FF2D78)' }}/>
        <div className="px-6 pt-6 pb-7 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {['B','I','N','G','O','!'].map((ch,i)=>(
              <div key={i} className="letter-stamp w-10 h-10 rounded-[10px] flex items-center justify-center font-black text-[17px] text-white"
                style={{ background:LETTER_COLORS[Math.min(i,4)],boxShadow:`0 4px 16px ${LETTER_COLORS[Math.min(i,4)]}70`,animationDelay:`${i*0.07}s`,textShadow:'0 1px 4px rgba(0,0,0,0.45)' }}>
                {ch}
              </div>
            ))}
          </div>
          <div className="mb-3 px-4 py-2.5 rounded-xl"
            style={{ background:'linear-gradient(90deg,rgba(255,45,120,0.2),rgba(139,92,246,0.2))',border:'1px solid rgba(255,45,120,0.3)' }}>
            <span className="text-2xl">{affirmation.emoji}</span>
            <p className="font-black text-white text-xl leading-tight text-glow-pulse">{affirmation.text}</p>
          </div>
          <p className="text-pink-300 font-semibold text-sm mb-5 leading-snug px-2">{body}</p>
          <div className="flex flex-col gap-2.5">
            <button onClick={onShare}
              className="w-full py-3.5 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{ background:'linear-gradient(90deg,#FF2D78,#FF6B35)',boxShadow:'0 4px 22px rgba(255,45,120,0.5)' }}>
              <span>📲</span><span>Share My Bingo</span>
            </button>
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-white/70 text-sm border active:scale-[0.97] transition-transform"
              style={{ background:'rgba(255,255,255,0.07)',borderColor:'rgba(255,255,255,0.14)' }}>
              Keep Playing 🚕
            </button>
          </div>
        </div>
        <div className="h-[2px]" style={{ background:'linear-gradient(90deg,#8B5CF6,#00D4AA,#FFD60A,#FF6B35,#FF2D78)' }}/>
      </div>
    </div>,
    document.body
  )
}

// ─── Share Drawer ─────────────────────────────────────────────────────────────

function ShareDrawer({ photos, completedCount, isVIP, onClose, onExportHD }: {
  photos:Record<number,string>; completedCount:number; isVIP:boolean; onClose:()=>void; onExportHD:()=>void
}) {
  const [copied,setCopied]=useState(false)
  const shareText=`🗽 New York City Bingo! I completed ${completedCount}/24 challenges 🚕\nCan you beat my score?`
  const subject='My New York City Bingo Card 🗽🚕'
  const handleSMS=()=>{window.location.href=`sms:?body=${encodeURIComponent(shareText)}`}
  const handleEmail=()=>{window.location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hey!\n\n${shareText}\n\nPlay along! 🗽`)}`}
  const handleCopy=async()=>{
    try{await navigator.clipboard.writeText(shareText)}
    catch{const el=document.createElement('textarea');el.value=shareText;document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el)}
    setCopied(true);setTimeout(()=>setCopied(false),2500)
  }
  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex:9999 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="drawer-up relative w-full rounded-t-[28px] overflow-hidden"
        style={{ maxWidth:480,background:'linear-gradient(160deg,#12043A,#2D1B69)',border:'1.5px solid rgba(255,255,255,0.1)',borderBottom:'none',boxShadow:'0 -8px 60px rgba(139,92,246,0.4)' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20"/></div>
        <div className="px-5 pb-10 pt-2">
          <h3 className="text-[20px] font-black text-white text-center mb-0.5" style={{ fontFamily:'Pacifico,cursive' }}>Share My Bingo 📲</h3>
          <p className="text-pink-300/75 text-center text-xs mb-4 font-semibold">{completedCount} / 24 completed · screenshot to share visuals</p>
          {/* Mini card */}
          <div className="rounded-2xl overflow-hidden p-3 mb-5" style={{ background:'linear-gradient(135deg,#7C3AED,#DB2777,#EA580C)' }}>
            <p className="text-white font-black text-center text-sm mb-2" style={{ fontFamily:'Pacifico,cursive',textShadow:'0 1px 6px rgba(0,0,0,0.4)' }}>🗽 New York City Bingo</p>
            <div className="grid grid-cols-5 gap-[3px] mb-2">
              {SQUARES.map(sq=>{
                const [c1,c2]=TILE_COLORS[sq.id]
                return (
                  <div key={sq.id} className="aspect-square rounded-md overflow-hidden flex items-center justify-center"
                    style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
                    {photos[sq.id]?<img src={photos[sq.id]} alt="" className="w-full h-full object-cover"/>
                      :sq.isCenter?<span className="text-[6px] text-yellow-300 font-black">FREE</span>
                      :<span className="text-[11px] leading-none">{sq.emoji}</span>}
                  </div>
                )
              })}
            </div>
            <p className="text-yellow-300 font-black text-center text-[11px]">{completedCount} / 24 completed ✨</p>
          </div>
          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {[
              {label:'Text\nMessage',emoji:'💬',bg:'linear-gradient(135deg,#34D399,#059669)',fn:handleSMS},
              {label:'Send\nEmail',  emoji:'✉️',bg:'linear-gradient(135deg,#60A5FA,#2563EB)',fn:handleEmail},
              {label:copied?'Copied!':'Copy\nLink',emoji:copied?'✅':'🔗',
               bg:copied?'linear-gradient(135deg,#4ADE80,#16A34A)':'linear-gradient(135deg,#F472B6,#DB2777)',fn:handleCopy},
            ].map((b,i)=>(
              <button key={i} onClick={b.fn}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-95 transition-transform"
                style={{ background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:b.bg }}>{b.emoji}</div>
                <span className="text-white font-bold text-[11px] leading-tight text-center whitespace-pre">{b.label}</span>
              </button>
            ))}
          </div>
          {/* VIP HD Export */}
          {isVIP && (
            <button onClick={()=>{onClose();onExportHD()}}
              className="w-full py-3.5 rounded-2xl font-black text-[#1a0533] flex items-center justify-center gap-2 mb-3 active:scale-[0.97] transition-transform"
              style={{ background:'linear-gradient(90deg,#FFD60A,#FF6B35)',boxShadow:'0 3px 16px rgba(255,180,0,0.35)' }}>
              <span>🖼️</span><span>Download HD Card (VIP)</span>
            </button>
          )}
          <button onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-black text-white active:scale-[0.97] transition-transform"
            style={{ background:'linear-gradient(90deg,#FF2D78,#FF6B35)',boxShadow:'0 4px 18px rgba(255,45,120,0.45)' }}>
            Done ✓
          </button>
        </div>
      </div>
      {copied&&createPortal(
        <div className="toast-in fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full font-bold text-sm text-white whitespace-nowrap"
          style={{ background:'linear-gradient(90deg,#4ADE80,#16A34A)',boxShadow:'0 4px 20px rgba(74,222,128,0.4)',zIndex:10001 }}>
          ✓ Copied to clipboard!
        </div>,
        document.body
      )}
    </div>,
    document.body
  )
}

// ─── Bingo Tile ───────────────────────────────────────────────────────────────

// ─── Share Link Drawer (VIP) ──────────────────────────────────────────────────

function ShareLinkDrawer({ customLabels, onClose }: {
  customLabels: CustomLabels; onClose: ()=>void
}) {
  const [copied, setCopied] = useState(false)
  const link = encodeBoardToLink(customLabels)
  const hasCustom = Object.keys(customLabels).length > 0

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link) }
    catch {
      const el = document.createElement('textarea'); el.value = link
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(()=>setCopied(false), 3000)
  }

  const shareViaSMS = () => {
    const msg = `🗽 Join my custom New York City Bingo game! Tap to play on your own card:\n${link}`
    window.location.href = `sms:?body=${encodeURIComponent(msg)}`
  }
  const shareViaEmail = () => {
    const subject = "You're invited — Custom New York City Bingo 🗽"
    const body = `Hey!\n\nI made a custom New York City Bingo card — tap the link below to play on your own device:\n\n${link}\n\nLet's see who gets BINGO first 🗽`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex:9999 }}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose}/>
      <div className="drawer-up relative w-full rounded-t-[28px] overflow-hidden"
        style={{ maxWidth:480, background:'linear-gradient(160deg,#0D0B18,#1A1628)',
                 border:'1.5px solid rgba(212,175,55,0.3)', borderBottom:'none',
                 boxShadow:'0 -8px 60px rgba(212,175,55,0.2)' }}>
        {/* Gold top bar */}
        <div className="h-[2px]" style={{ background:'linear-gradient(90deg,transparent,#D4AF37,#FFE08A,#D4AF37,transparent)' }}/>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background:'rgba(212,175,55,0.25)' }}/>
        </div>
        <div className="px-5 pb-10 pt-2">
          {/* Header */}
          <div className="text-center mb-1">
            <span className="crown-pulse inline-block text-2xl mb-1">👑</span>
            <h3 className="font-black text-[20px] mb-0.5"
              style={{ fontFamily:'Pacifico,cursive',
                       background:'linear-gradient(90deg,#C9A84C,#FFE08A,#D4AF37)',
                       WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
              Your Player Link
            </h3>
            <p className="text-[12px] font-semibold" style={{ color:'rgba(212,175,55,0.5)' }}>
              Share with up to {MAX_PLAYERS} players · Each plays on their own device
            </p>
          </div>

          {/* Warning if no customizations */}
          {!hasCustom && (
            <div className="mt-3 mb-3 rounded-2xl px-4 py-3"
              style={{ background:'rgba(255,180,0,0.08)',border:'1px solid rgba(255,180,0,0.25)' }}>
              <p className="text-[11px] font-bold text-center" style={{ color:'rgba(255,180,60,0.8)' }}>
                ⚠ No customizations yet — tap "Edit Board" first to personalize the squares before sharing.
              </p>
            </div>
          )}

          {/* Link box */}
          <div className="mt-4 mb-4 rounded-2xl px-4 py-3"
            style={{ background:'rgba(212,175,55,0.06)',border:'1.5px solid rgba(212,175,55,0.28)' }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color:'rgba(212,175,55,0.5)' }}>Your unique board link</p>
            <p className="text-[11px] font-mono break-all leading-relaxed" style={{ color:'rgba(212,175,55,0.7)' }}>
              {link.length > 80 ? link.slice(0,77)+'…' : link}
            </p>
          </div>

          {/* Player slots visual */}
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-center" style={{ color:'rgba(212,175,55,0.4)' }}>
              Share with up to {MAX_PLAYERS} players
            </p>
            <div className="flex justify-center gap-2">
              {Array.from({length:MAX_PLAYERS},(_,i)=>(
                <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background:'rgba(212,175,55,0.08)',border:'1.5px dashed rgba(212,175,55,0.25)' }}>
                  {['🗽','🚕','🥯','🍕','🕶️','🐀','💅','👑'][i]}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <button onClick={copyLink}
              className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={copied
                ? { background:'linear-gradient(90deg,#4ADE80,#059669)',color:'white',boxShadow:'0 4px 20px rgba(74,222,128,0.4)' }
                : { background:'linear-gradient(90deg,#C9A84C,#FFE08A)',color:'#06050F',boxShadow:'0 4px 20px rgba(212,175,55,0.4)' }}>
              <span>{copied?'✅':'🔗'}</span>
              <span>{copied?'Link Copied!':'Copy Player Link'}</span>
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={shareViaSMS}
                className="py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)' }}>
                <span>💬</span><span>Text Players</span>
              </button>
              <button onClick={shareViaEmail}
                className="py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)' }}>
                <span>✉️</span><span>Email Players</span>
              </button>
            </div>
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
              style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                       color:'rgba(255,255,255,0.4)' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Bingo Tile ───────────────────────────────────────────────────────────────

function BingoTile({ square, photo, completed, isWinning, springKey, isEditing, isVIP,
                     customLabel, onTap, onEdit, tileRef }: {
  square:typeof SQUARES[0]; photo:string|null; completed:boolean; isWinning:boolean
  springKey:number; isEditing:boolean; isVIP:boolean
  customLabel:{label:string;emoji:string}|undefined
  onTap:()=>void; onEdit:()=>void; tileRef:(el:HTMLButtonElement|null)=>void
}) {
  const [c1,c2]=TILE_COLORS[square.id]
  const isCenter=!!square.isCenter
  const [active,setActive]=useState(false)
  const [springing,setSpringing]=useState(false)
  const prevKey=useRef(springKey)
  useEffect(()=>{
    if(springKey!==prevKey.current&&springKey>0){
      prevKey.current=springKey;setSpringing(false)
      requestAnimationFrame(()=>requestAnimationFrame(()=>setSpringing(true)))
      const t=setTimeout(()=>setSpringing(false),620);return ()=>clearTimeout(t)
    }
  },[springKey])
  const displayLabel = customLabel?.label ?? square.label
  const displayEmoji = customLabel?.emoji ?? square.emoji
  const isSponsored  = isVIP && SPONSORED[square.id] !== undefined
  const border=isCenter?'3px solid #FFD60A':isWinning?'2.5px solid #FFD60A':completed?'2px solid rgba(255,255,255,0.65)':'1.5px solid rgba(255,255,255,0.13)'
  return (
    <button ref={tileRef} onClick={isEditing&&!isCenter?onEdit:onTap}
      onPointerDown={()=>setActive(true)} onPointerUp={()=>setActive(false)} onPointerLeave={()=>setActive(false)}
      className={['relative overflow-hidden aspect-square flex flex-col items-center justify-center select-none transition-transform duration-100',
        isCenter?'rounded-2xl':'rounded-xl',springing?'tile-spring-once':'',
        isWinning?'tile-glow tile-winning-border':'',active?'scale-[0.92]':''].filter(Boolean).join(' ')}
      style={{ background:isCenter?'linear-gradient(135deg,#7C3AED,#DB2777,#EA580C)':`linear-gradient(135deg,${c1},${c2})`,
               border,boxShadow:isCenter?'0 0 28px rgba(219,39,119,0.6)':isWinning?undefined:completed?`0 2px 14px ${c1}55`:'0 2px 8px rgba(0,0,0,0.38)' }}>
      {photo&&<>
        <img src={photo} alt={displayLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false}/>
        <div className="absolute inset-0" style={{ background:'linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.08) 50%,transparent 100%)' }}/>
        {!isEditing&&<div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',border:'0.5px solid rgba(255,255,255,0.2)' }}>
          <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </div>}
      </>}
      {completed&&!isCenter&&<div className="absolute top-1 left-1 w-[14px] h-[14px] rounded-full flex items-center justify-center z-10"
        style={{ background:'#22C55E',boxShadow:'0 1px 5px rgba(0,0,0,0.45)' }}>
        <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
          <path className="check-draw" d="M2 5.2l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>}
      {/* Sponsored badge */}
      {isSponsored&&<div className="absolute bottom-0 left-0 right-0 flex justify-center pb-[2px] z-10">
        <span className="text-[5px] font-black px-1 py-[1px] rounded-sm"
          style={{ background:'rgba(255,213,0,0.9)',color:'#1a0533' }}>⭐ {SPONSORED[square.id]}</span>
      </div>}
      {/* Edit overlay */}
      {isEditing&&!isCenter&&<div className="absolute inset-0 flex items-center justify-center rounded-xl z-20"
        style={{ background:'rgba(139,92,246,0.5)',backdropFilter:'blur(2px)',border:'2px dashed rgba(255,255,255,0.6)' }}>
        <span className="text-white font-black text-lg">✏️</span>
      </div>}
      {isCenter?(
        <div className="relative z-10 flex flex-col items-center gap-0.5 px-1">
          {photo?<><div className="text-[13px]">✅</div><span className="text-[7px] font-black text-yellow-300 leading-tight">DONE</span></>
            :<><span className="text-[18px] cam-breathe">📸</span><span className="text-[7px] font-black text-yellow-300 leading-tight text-center">SELFIE</span><span className="text-[5.5px] font-bold text-white/80 text-center leading-tight">same initial</span></>}
          <div className="absolute -top-px -left-px">
            <span className="text-[5.5px] font-black text-yellow-300 px-1 py-[2px] rounded-tl-xl rounded-br-md" style={{ background:'rgba(0,0,0,0.35)' }}>FREE</span>
          </div>
        </div>
      ):photo?(
        <div className="absolute bottom-0.5 left-0 right-0 z-10 flex justify-center px-0.5">
          <span className="text-[6px] font-bold text-white/90 text-center leading-tight line-clamp-2">{displayLabel}</span>
        </div>
      ):(
        <div className="flex flex-col items-center gap-[2px] px-0.5">
          <span className="text-[13px] leading-none">{displayEmoji}</span>
          <span className="text-[6.5px] font-bold text-white/95 text-center leading-tight">{displayLabel}</span>
          <div className="mt-[2px] cam-breathe opacity-55">
            <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>
      )}
      {isWinning&&<div className="absolute inset-0 gold-shimmer-overlay pointer-events-none" style={{ borderRadius:'inherit',opacity:0.5 }}/>}
      {active&&<div className="tap-ripple absolute rounded-full border-2 border-white/40 pointer-events-none" style={{ width:'120%',height:'120%',left:'-10%',top:'-10%' }}/>}
    </button>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // Metadata from localStorage (synchronous)
  const [completed,     setCompleted]     = useState<Set<number>>(()=>loadMeta().completed)
  const [photoTimes,    setPhotoTimes]    = useState<Record<number,Date>>(()=>loadMeta().photoTimes)
  const [celebratedKey, setCelebratedKey] = useState<Set<string>>(()=>loadMeta().celebratedKey)
  // Photos from IndexedDB (async)
  const [photos,        setPhotos]        = useState<Record<number,string>>({})
  const [dbReady,       setDbReady]       = useState(false)
  // VIP
  const [isVIP, setIsVIP] = useState(()=>{
    if (localStorage.getItem('isVIP') !== 'true') return false
    const expiry = Number(localStorage.getItem(VIP_EXPIRY_KEY) ?? '0')
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem('isVIP'); localStorage.removeItem(VIP_EXPIRY_KEY); return false
    }
    return true
  })
  const [showVIPModal,      setShowVIPModal]      = useState(false)
  const [isEditing,         setIsEditing]         = useState(false)
  const [customLabels,      setCustomLabels]      = useState<CustomLabels>(()=>loadCustomLabels())
  const [sharedBoardLabels, setSharedBoardLabels] = useState<CustomLabels|null>(null)
  const [showShareLink,     setShowShareLink]     = useState(false)
  // Effective labels: shared board takes precedence over local custom labels when a player opened a link
  const effectiveLabels = sharedBoardLabels ?? customLabels
  const [editingTile,   setEditingTile]   = useState<number|null>(null)
  // Audio
  const [audioEnabled,  setAudioEnabled]  = useState(false)
  // UI
  const [springKeys,    setSpringKeys]    = useState<Record<number,number>>({})
  const [burst,         setBurst]         = useState<{x:number;y:number;key:number}|null>(null)
  const [bingoLines,    setBingoLines]    = useState<number[][]>(
    ()=>BINGO_LINES.filter(line=>line.every(i=>loadMeta().completed.has(i)))
  )
  const [shaking,       setShaking]       = useState(false)
  const [showBingo,     setShowBingo]     = useState(false)
  const [showShare,     setShowShare]     = useState(false)
  const [lightboxId,    setLightboxId]    = useState<number|null>(null)
  const [affirmation,   setAffirmation]   = useState<{text:string;emoji:string;key:number}|null>(null)
  const [currentAff,    setCurrentAff]    = useState<{text:string;emoji:string}>({text:'',emoji:''})
  const [saveStatus,    setSaveStatus]    = useState<SaveStatus>('saved')
  const [toast,         setToast]         = useState<'welcome'|'reset'|'vip'|null>(null)
  const [resetKey,      setResetKey]      = useState(0)

  useAmbientAudio(audioEnabled)

  const fileRef      = useRef<HTMLInputElement>(null)
  const pendingId    = useRef<number|null>(null)
  const tileRefs     = useRef<Record<number,HTMLButtonElement|null>>({})
  const burstCounter = useRef(0)
  const affCounter   = useRef(0)
  const saveTimer    = useRef<ReturnType<typeof setTimeout>|null>(null)

  const winningSet     = new Set(bingoLines.flat())
  const completedCount = completed.size - 1

  // ── Boot: load photos from IndexedDB + detect Stripe success ──────────────
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)

    // Shared board detection — player opened a VIP creator's link
    const boardParam = params.get('board')
    if (boardParam) {
      const decoded = decodeBoardFromParam(boardParam)
      if (decoded) setSharedBoardLabels(decoded)
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Stripe payment success detection
    if (params.get('payment')==='success') {
      const expiry = Date.now() + VIP_DURATION_MS
      localStorage.setItem('isVIP','true')
      localStorage.setItem(VIP_EXPIRY_KEY, String(expiry))
      setIsVIP(true)
      setToast('vip')
      setTimeout(()=>setToast(null),6000)
      window.history.replaceState({},document.title,window.location.pathname)
    }

    // Cross-tab VIP sync — fires when Stripe success tab writes localStorage
    const onStorage=(e: StorageEvent)=>{
      if(e.key==='isVIP'&&e.newValue==='true'){
        const expiry = Date.now() + VIP_DURATION_MS
        localStorage.setItem(VIP_EXPIRY_KEY, String(expiry))
        setIsVIP(true); setToast('vip'); setTimeout(()=>setToast(null),6000)
      }
    }
    window.addEventListener('storage',onStorage)

    // Load photos
    idbLoadAll().then(stored=>{
      setPhotos(stored); setDbReady(true)
      const hadAny=Object.keys(stored).length>0||loadMeta().hasPhotos||loadMeta().completed.size>1
      if(hadAny){ setToast(t=>t??'welcome'); setTimeout(()=>setToast(t=>t==='welcome'?null:t),3500) }
    }).catch(()=>setDbReady(true))

    return ()=>window.removeEventListener('storage',onStorage)
  },[])

  // ── Persist metadata ─────────────────────────────────────────────────────
  useEffect(()=>{
    if(!dbReady)return
    saveMeta(completed,photoTimes,celebratedKey,Object.keys(photos).length>0)
  },[completed,photoTimes,celebratedKey,photos,dbReady])

  const flashSaving=useCallback(()=>{
    setSaveStatus('saving')
    if(saveTimer.current)clearTimeout(saveTimer.current)
    saveTimer.current=setTimeout(()=>setSaveStatus('saved'),1200)
  },[])

  // ── Bingo check ───────────────────────────────────────────────────────────
  const checkBingo=useCallback((next:Set<number>)=>{
    const won=BINGO_LINES.filter(line=>line.every(i=>next.has(i)))
    setBingoLines(won); if(won.length===0)return
    const key=won.map(l=>[...l].sort().join('')).sort().join('|')
    setCelebratedKey(prev=>{
      if(prev.has(key))return prev
      setShaking(true); setTimeout(()=>setShaking(false),700)
      const aff=pick(AFFIRMATIONS); setCurrentAff(aff)
      setAffirmation({...aff,key:affCounter.current++})
      setTimeout(()=>setShowBingo(true),350)
      return new Set([...prev,key])
    })
  },[])

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0],id=pendingId.current
    if(!file||id===null)return; e.target.value=''; flashSaving()
    const reader=new FileReader()
    reader.onload=async ev=>{
      const raw=ev.target?.result as string
      const compressed=await compressImage(raw)
      await idbPut(id,compressed)
      const now=new Date()
      setPhotos(prev=>({...prev,[id]:compressed}))
      setPhotoTimes(prev=>({...prev,[id]:now}))
      setSpringKeys(prev=>({...prev,[id]:(prev[id]??0)+1}))
      const el=tileRefs.current[id]
      if(el){const r=el.getBoundingClientRect();setBurst({x:r.left+r.width/2,y:r.top+r.height/2,key:burstCounter.current++})}
      setCompleted(prev=>{const next=new Set(prev);next.add(id);checkBingo(next);return next})
      setSaveStatus('saved')
    }
    reader.readAsDataURL(file)
  }

  const openFileFor=(id:number)=>{pendingId.current=id;fileRef.current?.click()}
  const handleTileTap=(id:number)=>{ photos[id]?setLightboxId(id):openFileFor(id) }

  const handleDeletePhoto=async(id:number)=>{
    flashSaving(); await idbDelete(id)
    setPhotos(prev=>{const n={...prev};delete n[id];return n})
    setPhotoTimes(prev=>{const n={...prev};delete n[id];return n})
    if(id!==12){setCompleted(prev=>{const next=new Set(prev);next.delete(id);setBingoLines(BINGO_LINES.filter(l=>l.every(i=>next.has(i))));return next})}
    setSaveStatus('saved')
  }

  const handleReset=async()=>{
    flashSaving(); await idbClear(); localStorage.removeItem(META_KEY)
    setPhotos({}); setPhotoTimes({}); setCompleted(new Set([12]))
    setSpringKeys({}); setBurst(null); setBingoLines([])
    setCelebratedKey(new Set()); setShaking(false)
    setShowBingo(false); setShowShare(false); setLightboxId(null); setAffirmation(null)
    setToast('reset'); setTimeout(()=>setToast(null),2800); setSaveStatus('saved'); setResetKey(k=>k+1)
  }

  const handleVIPUpgrade=()=>{ window.open('https://buy.stripe.com/6oUbJ1dDq3LBcJP5AT0Ba01', '_blank', 'noopener,noreferrer') }

  const handleExportHD=async()=>{
    if(!isVIP)return
    await exportHDCard(photos,customLabels,completedCount)
  }

  const handleSaveCustomLabel=(id:number,label:string,emoji:string)=>{
    const next={...customLabels,[id]:{label,emoji}}
    setCustomLabels(next); saveCustomLabels(next)
  }

  const lightboxSquare=lightboxId!==null?SQUARES.find(s=>s.id===lightboxId):null

  // ── Derived VIP palette vars ──────────────────────────────────────────────
  const bg = isVIP
    ? 'linear-gradient(160deg,#06050F 0%,#0D0B18 40%,#130F22 70%,#08070D 100%)'
    : 'linear-gradient(160deg,#0F0320 0%,#1B0847 35%,#3B0764 65%,#1A0438 100%)'
  const subtitleColor = isVIP ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.6)'
  const vipLetterColors = ['#8B6914','#C9A84C','#E5C76B','#C9A84C','#8B6914']

  return (
    <div key={resetKey}
      className={['min-h-screen w-full flex flex-col items-center pb-0 transition-all duration-700',shaking?'screen-shake':''].join(' ')}
      style={{ background:bg }}>

      {/* VIP top gold bar */}
      {isVIP&&<div className="w-full h-[3px]" style={{ background:'linear-gradient(90deg,transparent,#8B6914,#D4AF37,#FFE08A,#D4AF37,#8B6914,transparent)' }}/>}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
      {burst&&<TileBurst key={burst.key} x={burst.x} y={burst.y} onDone={()=>setBurst(null)}/>}
      {affirmation&&<AffirmationBanner key={affirmation.key} text={affirmation.text} emoji={affirmation.emoji} onDone={()=>setAffirmation(null)}/>}

      {/* ── Header ── */}
      <div className="w-full pt-7 pb-3 px-4">
        {/* Top row: audio + tier badge */}
        <div className="flex items-center justify-between mb-3">
          {/* Audio toggle */}
          <button
            onClick={()=>setAudioEnabled(v=>!v)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={isVIP
              ? { background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.3)',backdropFilter:'blur(8px)' }
              : { background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',backdropFilter:'blur(8px)' }}
            title={audioEnabled?'Mute ambient':'Play ambient music'}
          >
            {audioEnabled ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                stroke={isVIP?'#D4AF37':'white'} strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                stroke={isVIP?'rgba(212,175,55,0.5)':'white'} strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <span className="text-[20px] animate-float">🗽</span>
            <h1 className={`text-[24px] font-black leading-none ${isVIP?'vip-shimmer-text':'shimmer-text'}`}
              style={{ fontFamily:'Pacifico,cursive' }}>
              New York City Bingo
            </h1>
            <span className="text-[20px] animate-float-delayed">🚕</span>
          </div>

          {/* Tier badge */}
          {isVIP ? (
            <button onClick={()=>setShowVIPModal(true)}
              className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-full active:scale-90 transition-transform overflow-hidden"
              style={{ background:'linear-gradient(135deg,#1A1628,#0D0B18)',
                       border:'1px solid rgba(212,175,55,0.5)',
                       boxShadow:'0 2px 16px rgba(212,175,55,0.25)' }}>
                            <span className="crown-pulse relative text-sm leading-none">👑</span>
              <span className="relative font-black text-[11px] tracking-wider"
                style={{ fontFamily:"'Cormorant Garamond',serif",
                         background:'linear-gradient(90deg,#C9A84C,#FFE08A,#D4AF37)',
                         WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
                VIP
              </span>
            </button>
          ) : (
            <button onClick={()=>setShowVIPModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full font-black text-[11px] active:scale-90 transition-transform"
              style={{ background:'linear-gradient(90deg,#FF2D78,#8B5CF6)',color:'white',
                       boxShadow:'0 2px 12px rgba(255,45,120,0.45)' }}>
              <span>✨</span><span>Go VIP</span>
            </button>
          )}
        </div>

        {/* Subtitle — tier-aware */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="text-[13px] font-semibold tracking-wide text-center" style={{ color:subtitleColor }}>
            {isVIP ? 'Your exclusive VIP board — customize & collect ✦' : 'How many can you check off? 🗽'}
          </p>
        </div>

        {/* FREE tier label */}
        {!isVIP&&(
          <div className="flex justify-center mb-2">
            <span className="free-badge-bob inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[9px] font-black uppercase tracking-[0.15em]"
              style={{ background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.35)' }}>
              FREE PLAN · Tap ✨ Go VIP to unlock custom boards & HD export
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="mt-2 mx-auto" style={{ maxWidth:300 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold" style={{ color:isVIP?'rgba(212,175,55,0.6)':'rgba(255,255,255,0.5)' }}>
              {completedCount} / 24 {isVIP?'completed ✦':'challenges'}
            </span>
            <div className="flex items-center gap-2">
              <SaveBadge status={saveStatus}/>
              {bingoLines.length>0&&(
                <button onClick={()=>setShowBingo(true)}
                  className="text-[11px] font-black px-2.5 py-[3px] rounded-full active:scale-95 transition-transform"
                  style={isVIP
                    ? { background:'linear-gradient(90deg,#8B6914,#D4AF37)',color:'#06050F',boxShadow:'0 0 14px rgba(212,175,55,0.55)' }
                    : { background:'linear-gradient(90deg,#FF2D78,#FF6B35)',color:'white',boxShadow:'0 0 14px rgba(255,45,120,0.55)' }}>
                  {isVIP?'✦ BINGO!':'🎉 BINGO!'}
                </button>
              )}
            </div>
          </div>
          <div className="h-[10px] rounded-full overflow-hidden"
            style={{ background:isVIP?'rgba(212,175,55,0.1)':'rgba(255,255,255,0.08)',
                     border:isVIP?'1px solid rgba(212,175,55,0.18)':'none' }}>
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${isVIP?'vip-progress-shimmer':'progress-shimmer'}`}
              style={{ width:`${(completedCount/24)*100}%` }}/>
          </div>
        </div>
      </div>

      {/* ── VIP Member Banner ── */}
      {isVIP&&(
        <div className="w-full px-3 mb-3" style={{ maxWidth:400 }}>
          <VIPMemberBanner/>
        </div>
      )}

      {/* ── Guest board banner (player opened a shared link) ── */}
      {sharedBoardLabels&&(
        <div className="w-full px-3 mb-2" style={{ maxWidth:400 }}>
          <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5"
            style={{ background:'linear-gradient(90deg,rgba(139,92,246,0.2),rgba(219,39,119,0.15))',
                     border:'1px solid rgba(139,92,246,0.35)' }}>
            <span className="text-lg flex-shrink-0">🔗</span>
            <div>
              <p className="text-white font-black text-[12px] leading-tight">Playing a custom board</p>
              <p className="text-white/50 text-[10px] leading-tight">Shared with you by a VIP member · Play and check off your own progress</p>
            </div>
          </div>
        </div>
      )}

      {/* ── BINGO letters ── */}
      <div className="w-full px-3 mb-2" style={{ maxWidth:400 }}>
        <div className="grid grid-cols-5 gap-[6px]">
          {['B','I','N','G','O'].map((l,i)=>(
            <div key={l}
              className="flex items-center justify-center rounded-2xl font-black text-[22px] tracking-wide select-none"
              style={isVIP
                ? { paddingTop:10, paddingBottom:10,
                    background:'linear-gradient(160deg,#1C1830,#0D0B18)',
                    color:vipLetterColors[i],
                    border:`1.5px solid ${vipLetterColors[i]}60`,
                    textShadow:`0 0 20px ${vipLetterColors[i]}, 0 2px 4px rgba(0,0,0,0.8)`,
                    boxShadow:`0 4px 18px rgba(212,175,55,0.22), inset 0 1px 0 rgba(255,255,255,0.06)` }
                : { paddingTop:10, paddingBottom:10,
                    background:`linear-gradient(160deg,${LETTER_COLORS[i]},${LETTER_COLORS[(i+1)%5]})`,
                    color:'white',
                    textShadow:'0 2px 6px rgba(0,0,0,0.55), 0 0 18px rgba(255,255,255,0.2)',
                    boxShadow:`0 4px 18px ${LETTER_COLORS[i]}70, inset 0 1px 0 rgba(255,255,255,0.2)` }}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── VIP edit mode banner ── */}
      {isEditing&&(
        <div className="w-full px-3 mb-2" style={{ maxWidth:400 }}>
          <div className="rounded-xl px-3 py-2 flex items-center gap-2 relative overflow-hidden"
            style={isVIP
              ? { background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.35)' }
              : { background:'linear-gradient(90deg,rgba(139,92,246,0.3),rgba(219,39,119,0.3))',border:'1px solid rgba(139,92,246,0.4)' }}>
            <span className="text-base">✏️</span>
            <p className="font-bold text-xs flex-1" style={{ color:isVIP?'rgba(212,175,55,0.9)':'white' }}>
              {isVIP?'VIP Edit Mode — tap any square to customize':'Edit mode on — tap any square to customize it'}
            </p>
            <button onClick={()=>setIsEditing(false)}
              className="text-[10px] font-black active:scale-95 transition-transform"
              style={{ color:isVIP?'rgba(212,175,55,0.6)':'rgba(255,255,255,0.7)' }}>Done</button>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="w-full px-3" style={{ maxWidth:400 }}>
        {/* VIP grid frame */}
        {isVIP&&(
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border:'1px solid rgba(212,175,55,0.12)',boxShadow:'inset 0 0 30px rgba(212,175,55,0.04)' }}/>
        )}
        {!dbReady?(
          <div className="grid grid-cols-5 gap-[5px]">
            {SQUARES.map(sq=>(
              <div key={sq.id} className={`aspect-square ${sq.isCenter?'rounded-2xl':'rounded-xl'} animate-pulse`}
                style={{ background:isVIP?'rgba(212,175,55,0.06)':'rgba(255,255,255,0.07)' }}/>
            ))}
          </div>
        ):(
          <div className="grid grid-cols-5 gap-[5px]">
            {SQUARES.map(sq=>(
              <BingoTile key={sq.id} square={sq} photo={photos[sq.id]??null}
                completed={completed.has(sq.id)} isWinning={winningSet.has(sq.id)}
                springKey={springKeys[sq.id]??0} isEditing={isEditing} isVIP={isVIP}
                customLabel={effectiveLabels[sq.id]}
                onTap={()=>handleTileTap(sq.id)}
                onEdit={()=>setEditingTile(sq.id)}
                tileRef={el=>{tileRefs.current[sq.id]=el}}/>
            ))}
          </div>
        )}
      </div>

      {/* ── Free space legend ── */}
      <div className="mt-4 px-3 w-full" style={{ maxWidth:400 }}>
        <div className="rounded-2xl p-3.5 flex items-start gap-3 relative overflow-hidden"
          style={isVIP
            ? { background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.2)',backdropFilter:'blur(10px)' }
            : { background:'rgba(255,255,255,0.055)',border:'1px solid rgba(255,255,255,0.09)',backdropFilter:'blur(10px)' }}>
          <span className="text-[22px] flex-shrink-0 animate-float relative">📸</span>
          <div className="relative">
            <p className="font-black text-[11px] mb-0.5 uppercase tracking-wide"
              style={{ color:isVIP?'rgba(212,175,55,0.9)':'rgb(253,224,71)' }}>
              {isVIP?'✦ ':''}Free Space — Center Square
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color:isVIP?'rgba(212,175,55,0.55)':'rgba(255,255,255,0.65)' }}>
              Snap a selfie with someone who shares your{' '}
              <strong style={{ color:isVIP?'rgba(212,175,55,0.9)':'white' }}>first initial</strong>.{' '}
              (e.g. name starts with B → find another B!)
            </p>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="mt-4 px-3 w-full flex flex-col gap-2.5" style={{ maxWidth:400 }}>
        {/* VIP upgrade CTA (non-VIP users) */}
        {!isVIP&&(
          <button
            onClick={()=>window.open('https://buy.stripe.com/6oUbJ1dDq3LBcJP5AT0Ba01','_blank','noopener,noreferrer')}
            className="w-full py-4 rounded-2xl font-black text-white text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={{ background:'linear-gradient(90deg,#8B5CF6,#DB2777)',boxShadow:'0 4px 22px rgba(139,92,246,0.4)' }}>
            <span>✨</span><span>Unlock VIP & Customize Your Board — $2.99</span>
          </button>
        )}
        {isVIP&&(
          <button
            onClick={()=>setIsEditing(v=>!v)}
            className="w-full py-3.5 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform relative overflow-hidden"
            style={isEditing
              ? { background:'linear-gradient(90deg,#4ADE80,#059669)',color:'white',boxShadow:'0 4px 22px rgba(74,222,128,0.4)' }
              : { background:'linear-gradient(135deg,#1A1628,#0D0B18)',color:'#D4AF37',
                  border:'1px solid rgba(212,175,55,0.4)',boxShadow:'0 4px 22px rgba(212,175,55,0.2)' }}>
            <span>{isEditing?'✅':'✏️'}</span>
            <span>{isEditing?'Done Editing Board':'✦ Edit Board Squares'}</span>
          </button>
        )}
        {isVIP&&!isEditing&&(
          <button onClick={()=>setShowShareLink(true)}
            className="w-full py-3.5 rounded-2xl font-black text-[#06050F] text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={{ background:'linear-gradient(90deg,#C9A84C,#FFE08A)',boxShadow:'0 4px 22px rgba(212,175,55,0.35)' }}>
            <span>🔗</span><span>Generate Player Link</span>
          </button>
        )}
        {bingoLines.length > 0 && (
          <button onClick={()=>setShowShare(true)}
            className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={isVIP
              ? { background:'linear-gradient(90deg,#8B6914,#C9A84C)',color:'#06050F',boxShadow:'0 4px 22px rgba(212,175,55,0.35)' }
              : { background:'linear-gradient(90deg,#FF2D78,#FF6B35)',color:'white',boxShadow:'0 4px 26px rgba(255,45,120,0.48)' }}>
            <span>🎉</span>
            <span>Share My Bingo</span>
          </button>
        )}
        <button onClick={handleReset}
          className="w-full py-[11px] rounded-2xl font-bold text-sm border active:scale-[0.97] transition-transform"
          style={isVIP
            ? { background:'rgba(212,175,55,0.05)',borderColor:'rgba(212,175,55,0.15)',color:'rgba(212,175,55,0.4)' }
            : { background:'rgba(255,255,255,0.05)',borderColor:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)' }}>
          🔄 Reset Card / Start New Adventure
        </button>
      </div>

      <p className="mt-4 text-[11px] text-center px-8 leading-relaxed"
        style={{ color:isVIP?'rgba(212,175,55,0.3)':'rgba(255,255,255,0.3)' }}>
        Tap empty squares to add photos · Tap photos to view or replace {isVIP?'✦':'✨'}
      </p>

      {/* ── Footer ── */}
      <footer className="mt-8 mb-6 px-6 text-center w-full" style={{ maxWidth:400 }}>
        <div className="rounded-2xl px-4 py-3 relative overflow-hidden"
          style={isVIP
            ? { background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.12)' }
            : { background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)' }}>
          <p className="relative text-[11px] leading-relaxed" style={{ color:isVIP?'rgba(212,175,55,0.45)':'rgba(255,255,255,0.4)' }}>
            Enjoying the game? Support future builds ☀️{' '}
            <a
              href="https://venmo.com/u/beau_moldenhauer"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black underline decoration-dotted transition-colors"
              style={{ color:isVIP?'#C9A84C':'#60A5FA' }}
            >
              @beau_moldenhauer on Venmo
            </a>
          </p>
        </div>
      </footer>

      {/* ── Toast notifications ── */}
      {createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex:9995 }}>
          {toast==='welcome'&&(
            <div className="toast-in flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm text-white whitespace-nowrap"
              style={{ background:'linear-gradient(90deg,#7C3AED,#DB2777)',boxShadow:'0 4px 20px rgba(139,92,246,0.5)' }}>
              <span>🗽</span><span>Progress restored! Pick up where you left off.</span><span>✨</span>
            </div>
          )}
          {toast==='reset'&&(
            <div className="toast-in flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm text-white whitespace-nowrap"
              style={{ background:'linear-gradient(90deg,#14B8A6,#0E7490)',boxShadow:'0 4px 20px rgba(20,184,166,0.5)' }}>
              <span>🔄</span><span>Card reset. Fresh adventure awaits!</span><span>🚕</span>
            </div>
          )}
          {toast==='vip'&&(
            <div className="toast-in flex flex-col items-center gap-1 px-5 py-3.5 rounded-2xl text-center leading-snug"
              style={{ background:'linear-gradient(135deg,#1A1628,#0D0B18)',
                       border:'1.5px solid rgba(212,175,55,0.5)',
                       boxShadow:'0 4px 28px rgba(212,175,55,0.35)',maxWidth:320 }}>
              <div className="flex items-center gap-2">
                <span className="crown-pulse text-lg">👑</span>
                <span className="font-black text-sm"
                  style={{ background:'linear-gradient(90deg,#C9A84C,#FFE08A,#D4AF37)',
                           WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
                  VIP Unlocked!
                </span>
              </div>
              <span className="font-semibold text-[11px]" style={{ color:'rgba(212,175,55,0.65)' }}>
                Custom boards &amp; HD export active · Valid for 30 days
              </span>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Lightbox ── */}
      {lightboxId!==null&&lightboxSquare&&photos[lightboxId]&&(
        <LightboxModal square={lightboxSquare} photo={photos[lightboxId]}
          timestamp={photoTimes[lightboxId]??null} onClose={()=>setLightboxId(null)}
          onReplace={()=>{openFileFor(lightboxId);setLightboxId(null)}}
          onDelete={()=>handleDeletePhoto(lightboxId)}/>
      )}

      {/* ── Modals ── */}
      {showBingo&&<BingoModal lineCount={bingoLines.length} affirmation={currentAff}
        onClose={()=>setShowBingo(false)} onShare={()=>{setShowBingo(false);setShowShare(true)}}/>}
      {showShare&&<ShareDrawer photos={photos} completedCount={completedCount} isVIP={isVIP}
        onClose={()=>setShowShare(false)} onExportHD={()=>{}}/>}
      {showVIPModal&&<VIPModal isVIP={isVIP} onClose={()=>setShowVIPModal(false)}
        onUpgrade={handleVIPUpgrade}
        onToggleEdit={()=>setIsEditing(v=>!v)} isEditing={isEditing}
        onShareLink={()=>setShowShareLink(true)}/>}
      {showShareLink&&isVIP&&(
        <ShareLinkDrawer customLabels={customLabels} onClose={()=>setShowShareLink(false)}/>
      )}
      {editingTile!==null&&isVIP&&(
        <CustomTileEditor square={SQUARES[editingTile]} current={customLabels[editingTile]}
          onSave={(l,e)=>handleSaveCustomLabel(editingTile,l,e)}
          onClose={()=>setEditingTile(null)}/>
      )}
    </div>
  )
}
