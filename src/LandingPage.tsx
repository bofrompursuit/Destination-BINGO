import { useState, type CSSProperties } from 'react'
import { saveLead } from './supabaseClient'

const NAVY    = '#050B1F'
const PINK    = '#FF2D7B'
const MAGENTA = '#E0006F'
const CYAN    = '#00E5FF'
const PURPLE  = '#A855F7'
const ORANGE  = '#F97316'

// ─── Background balls ─────────────────────────────────────────────────────────
const BG_BALLS = [
  { letter:'B', num:7,  x:3,  y:8,  dur:12, delay:0,   rot:15,  size:88,  col:PINK    },
  { letter:'I', num:22, x:15, y:62, dur:9,  delay:1.5, rot:-22, size:72,  col:PURPLE  },
  { letter:'N', num:38, x:84, y:5,  dur:13, delay:0.8, rot:8,   size:96,  col:CYAN    },
  { letter:'G', num:49, x:88, y:54, dur:10, delay:2.2, rot:-14, size:80,  col:MAGENTA },
  { letter:'O', num:64, x:50, y:85, dur:11, delay:0.4, rot:22,  size:104, col:ORANGE  },
  { letter:'B', num:3,  x:33, y:2,  dur:8,  delay:3,   rot:-5,  size:60,  col:CYAN    },
  { letter:'N', num:33, x:70, y:74, dur:14, delay:1,   rot:30,  size:68,  col:PINK    },
  { letter:'G', num:55, x:6,  y:44, dur:9,  delay:2.8, rot:-18, size:76,  col:PURPLE  },
  { letter:'I', num:17, x:62, y:37, dur:11, delay:0.6, rot:10,  size:56,  col:ORANGE  },
  { letter:'O', num:72, x:26, y:87, dur:10, delay:1.8, rot:-8,  size:90,  col:MAGENTA },
]

const BG_LETTERS = [
  { l:'B', x:7,  y:30, size:128, rot:-18, dur:13, delay:0.5, col:PINK,    bx:20,  by:-28 },
  { l:'I', x:91, y:18, size:94,  rot:12,  dur:10, delay:2,   col:CYAN,    bx:-16, by:22  },
  { l:'N', x:44, y:91, size:134, rot:-8,  dur:15, delay:0.3, col:PURPLE,  bx:18,  by:-20 },
  { l:'G', x:77, y:80, size:104, rot:20,  dur:11, delay:1.4, col:MAGENTA, bx:-22, by:18  },
  { l:'O', x:21, y:70, size:114, rot:-15, dur:12, delay:0.9, col:ORANGE,  bx:14,  by:-24 },
]

// ─── BINGO ball SVG ───────────────────────────────────────────────────────────
function BingoBall({ letter, num, size, col, id }: { letter:string; num:number; size:number; col:string; id:string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <defs>
        <radialGradient id={`rg-${id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2"/>
          <stop offset="100%" stopColor={col} stopOpacity="0.85"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#rg-${id})`} stroke={col} strokeWidth="2.5"/>
      <circle cx="50" cy="50" r="36" fill="rgba(5,11,31,0.68)" stroke={col} strokeWidth="1.2"/>
      <text x="50" y="38" textAnchor="middle" dominantBaseline="middle"
        fill={col} fontSize="13" fontWeight="900"
        style={{ fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>
        {letter}
      </text>
      <text x="50" y="60" textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="22" fontWeight="900"
        style={{ fontFamily:"'Black Han Sans',sans-serif" }}>
        {num}
      </text>
    </svg>
  )
}

// ─── Hero BINGO letters (hovering, always visible) ────────────────────────────
const HERO = [
  { l:'B', x:4,   y:6,  rot:-20, scale:1.08, glow:PINK,    shadow:'#8B0030', dur:3.8, delay:0    },
  { l:'I', x:22,  y:-7, rot:14,  scale:0.90, glow:CYAN,    shadow:'#005566', dur:3.2, delay:0.4  },
  { l:'N', x:41,  y:7,  rot:-7,  scale:1.12, glow:MAGENTA, shadow:'#6B0035', dur:4.1, delay:0.8  },
  { l:'G', x:61,  y:-5, rot:17,  scale:0.95, glow:PURPLE,  shadow:'#4B0082', dur:3.5, delay:0.2  },
  { l:'O', x:89,  y:4,  rot:-11, scale:1.06, glow:ORANGE,  shadow:'#7A3800', dur:3.9, delay:0.6  },
]

export default function LandingPage({ onEnter }: { onEnter: ()=>void }) {
  const [contact, setContact] = useState('')
  const [loading, setLoading]   = useState(false)
  const [touched, setTouched]   = useState(false)
  const [fieldError, setFieldError] = useState<string|null>(null)
  const [saveError, setSaveError]   = useState<string|null>(null)

  const value = contact.trim()
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handlePlay = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setSaveError(null)

    if (!value) {
      setFieldError('Please enter your email address to continue.')
      return
    }
    if (!valid) {
      setFieldError('Please enter a valid email address.')
      return
    }
    setFieldError(null)
    setLoading(true)

    try {
      await saveLead(contact)
      onEnter()
    } catch (err) {
      setLoading(false)
      setSaveError(
        err instanceof Error && err.message.includes('relation')
          ? 'Database not set up yet — run the SQL setup in your Supabase dashboard.'
          : "Couldn't save your info. Please try again."
      )
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background:`radial-gradient(ellipse 130% 80% at 50% -8%,#091440 0%,${NAVY} 55%,#020810 100%)` }}>

      {/* ── Floating BINGO balls ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ filter:'blur(1.5px)', opacity:0.7 }}>
        {BG_BALLS.map((b,i)=>(
          <div key={i} className="lp-ball-drift absolute"
            style={{ left:`${b.x}%`, top:`${b.y}%`, '--dur':`${b.dur}s`, '--delay':`${b.delay}s` } as CSSProperties}>
            <BingoBall letter={b.letter} num={b.num} size={b.size} col={b.col} id={`ball${i}`}/>
          </div>
        ))}
      </div>

      {/* ── Floating BG letters ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ filter:'blur(2px)', opacity:0.65 }}>
        {BG_LETTERS.map((bl,i)=>(
          <div key={i} className="lp-bg-letter absolute select-none"
            style={{ left:`${bl.x}%`, top:`${bl.y}%`,
                     fontFamily:"'Black Han Sans',sans-serif",
                     fontSize:bl.size, fontWeight:900, color:bl.col,
                     transform:`rotate(${bl.rot}deg)`,
                     textShadow:`0 0 50px ${bl.col}55`,
                     '--dur':`${bl.dur}s`, '--delay':`${bl.delay}s`,
                     '--bx':`${bl.bx}px`, '--by':`${bl.by}px`, '--br':`${bl.rot}deg`,
                   } as CSSProperties}>
            {bl.l}
          </div>
        ))}
      </div>

      {/* ── Ambient radial flares ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { cx:'14%', cy:'18%', col:PINK,    w:520, h:440, dur:5, delay:0   },
          { cx:'84%', cy:'10%', col:CYAN,    w:440, h:380, dur:4, delay:1.2 },
          { cx:'68%', cy:'80%', col:MAGENTA, w:480, h:400, dur:6, delay:0.5 },
          { cx:'6%',  cy:'65%', col:PURPLE,  w:380, h:340, dur:7, delay:1.8 },
        ].map((f,i)=>(
          <div key={i} className="lp-flare absolute"
            style={{ left:f.cx, top:f.cy, width:f.w, height:f.h,
                     transform:'translate(-50%,-50%)',
                     background:`radial-gradient(ellipse,${f.col}14 0%,transparent 72%)`,
                     filter:'blur(34px)',
                     '--dur':`${f.dur}s`, '--delay':`${f.delay}s`,
                   } as CSSProperties}/>
        ))}
      </div>

      {/* ── Hero section ── */}
      {/* Hovering BINGO letters — full viewport width, outside constrained column */}
      <div className="relative z-10 w-full mb-2" style={{ height:'clamp(130px,18vw,200px)' }}>
        <div className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ width:'90vw', height:280, transform:'translate(-50%,-58%)',
                   background:`radial-gradient(ellipse,${PINK}1A 0%,${CYAN}0C 45%,transparent 70%)`,
                   filter:'blur(28px)' }}/>
        {HERO.map((hl,i)=>(
          <div key={i} className="lp-letter-float absolute select-none"
            style={{
              left:`${hl.x}%`, top:'50%',
              fontFamily:"'Black Han Sans',sans-serif",
              fontSize:'clamp(80px,13vw,158px)',
              fontWeight:900, lineHeight:1, color:'white',
              '--base':`rotate(${hl.rot}deg) scale(${hl.scale}) translateY(-50%)`,
              '--dur':`${hl.dur}s`, '--delay':`${hl.delay}s`,
              '--glow':hl.glow, '--glow2':hl.shadow, '--shadow':hl.shadow,
              transform:`rotate(${hl.rot}deg) scale(${hl.scale}) translateY(-50%)`,
              textShadow:[
                `0 0 30px ${hl.glow}`,
                `0 0 75px ${hl.glow}88`,
                `0 0 150px ${hl.glow}44`,
                `5px 8px 0 ${hl.shadow}`,
                `10px 16px 0 ${hl.shadow}44`,
              ].join(','),
            } as CSSProperties}
            aria-hidden>
            {hl.l}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-4" style={{ maxWidth:860 }}>

        {/* ── Sign-up card ── */}
        <div className="lp-modal-in w-full" style={{ maxWidth:420 }}>
          {/* Glow halo */}
          <div className="absolute pointer-events-none"
            style={{ inset:-40, borderRadius:64,
                     background:`radial-gradient(ellipse,${PINK}18 0%,${CYAN}0A 55%,transparent 100%)`,
                     filter:'blur(36px)', zIndex:0 }}/>

          <div className="relative" style={{ zIndex:1, borderRadius:24,
            background:'rgba(255,255,255,0.048)',
            backdropFilter:'blur(30px) saturate(1.5)',
            border:`1.5px solid ${PINK}52`,
            boxShadow:`0 0 0 1px rgba(255,45,123,0.11),0 30px 80px rgba(2,8,16,0.9),0 0 70px ${PINK}16` }}>

            <div className="px-8 pt-7 pb-8">
              {/* Badge */}
              <span className="inline-block text-[10px] font-black tracking-[0.22em] uppercase px-3 py-1 rounded-full mb-5"
                style={{ background:`${CYAN}1A`, color:CYAN, border:`1px solid ${CYAN}44`,
                         fontFamily:"'Barlow Condensed',sans-serif" }}>
                FREE TO PLAY
              </span>

              {/* Header */}
              <h1 className="font-black text-white leading-tight mb-2"
                style={{ fontFamily:"'Barlow Condensed',sans-serif",
                         fontSize:'clamp(28px,5.5vw,40px)', letterSpacing:'0.02em',
                         textShadow:`0 0 40px ${PINK}55` }}>
                Ready to Play?
              </h1>
              <p className="font-semibold leading-relaxed mb-6"
                style={{ fontSize:14, color:'rgba(255,255,255,0.50)', fontFamily:"'Nunito',sans-serif" }}>
                Enter your email address to instantly unlock your free digital bingo board.
              </p>

              {/* Form */}
              <form onSubmit={handlePlay} className="flex flex-col gap-0" noValidate>
                {/* Input */}
                <div>
                  <input
                    value={contact}
                    onChange={e => {
                      setContact(e.target.value)
                      setFieldError(null)
                      setSaveError(null)
                      setTouched(false)
                    }}
                    placeholder="Email Address"
                    autoComplete="email"
                    type="email"
                    disabled={loading}
                    className="w-full rounded-xl font-semibold text-white text-sm placeholder:text-white/30 focus:outline-none transition-all duration-200 disabled:opacity-60"
                    style={{ padding:'17px 18px',
                             background:'rgba(255,255,255,0.075)',
                             border:`1.5px solid ${fieldError ? `${PINK}BB` : 'rgba(255,255,255,0.13)'}`,
                             fontFamily:"'Nunito',sans-serif",
                             boxShadow: fieldError ? `0 0 0 3px ${PINK}22` : 'none' }}
                    onFocus={e => {
                      if (!fieldError) {
                        e.currentTarget.style.borderColor = CYAN
                        e.currentTarget.style.boxShadow  = `0 0 0 3px ${CYAN}22`
                      }
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = fieldError ? `${PINK}BB` : 'rgba(255,255,255,0.13)'
                      e.currentTarget.style.boxShadow   = fieldError ? `0 0 0 3px ${PINK}22` : 'none'
                    }}
                  />

                  {/* Field-level error */}
                  {fieldError && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7.5" stroke={PINK} strokeWidth="1.2"/>
                        <path d="M8 4.5v4M8 10.5v1" stroke={PINK} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <p className="text-xs font-bold" style={{ color:PINK, fontFamily:"'Nunito',sans-serif" }}>
                        {fieldError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl font-black tracking-widest lp-cta-glow active:scale-[0.97] transition-transform disabled:opacity-75"
                  style={{ background:CYAN, color:NAVY,
                           fontFamily:"'Barlow Condensed',sans-serif",
                           fontSize:17, letterSpacing:'0.13em',
                           marginTop:12 }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                        <path d="M12 2a10 10 0 0 1 10 10"/>
                      </svg>
                      SAVING…
                    </span>
                  ) : 'PLAY NOW'}
                </button>

                {/* Save / network error */}
                {saveError && (
                  <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl"
                    style={{ background:`${ORANGE}18`, border:`1px solid ${ORANGE}44` }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop:1, flexShrink:0 }}>
                      <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke={ORANGE} strokeWidth="1.3"/>
                      <path d="M8 6v3.5M8 11v1" stroke={ORANGE} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <p className="text-xs font-semibold leading-snug" style={{ color:ORANGE, fontFamily:"'Nunito',sans-serif" }}>
                      {saveError}
                    </p>
                  </div>
                )}
              </form>

              {/* Trust row */}
              <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
                {['🔒 Private','🎉 Free forever','🎱 Play anywhere'].map(t=>(
                  <span key={t} className="text-[11px] font-semibold"
                    style={{ color:'rgba(255,255,255,0.28)', fontFamily:"'Nunito',sans-serif" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[11px] font-semibold" style={{ color:'rgba(255,255,255,0.18)', fontFamily:"'Nunito',sans-serif" }}>
          Built for the community by{' '}
          <a href="https://venmo.com/u/beau_moldenhauer" target="_blank" rel="noopener noreferrer"
            className="underline decoration-dotted hover:opacity-80 transition-opacity"
            style={{ color:'rgba(255,255,255,0.32)' }}>
            @beau_moldenhauer
          </a>
        </p>
      </div>
    </div>
  )
}
