import { Joyride, type EventData, STATUS } from 'react-joyride'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useOrgStore } from '@/store/useOrgStore'
import { getTourSteps } from './tourSteps'
import { useEffect, useRef } from 'react'

const STORAGE_KEY = 'organo-tour-completed'

// ── Bilingual step data ─────────────────────────────────────────────────────
const TOUR_DATA = [
  {
    ja: { title: 'ようこそ！', content: '組織図アプリの基本的な使い方をご案内します。' },
    en: { title: 'Welcome!', content: "Let's walk you through the basics." },
  },
  {
    ja: { title: 'ノードを追加', content: 'このボタンから人物や部署ノードを追加できます。' },
    en: { title: 'Add Nodes', content: 'Use these buttons to add person or unit nodes.' },
  },
  {
    ja: { title: 'ノードを編集', content: 'ノードをクリックすると右側のパネルで詳細を編集できます。' },
    en: { title: 'Edit Nodes', content: 'Click any node to edit its details in the side panel.' },
  },
  {
    ja: { title: 'エクスポート', content: '完成した組織図を画像やデータとして書き出せます。' },
    en: { title: 'Export', content: 'Export your chart as an image or data file.' },
  },
]

// ── Bilingual JSX helpers ───────────────────────────────────────────────────
function BiTitle({ ja, en }: { ja: string; en: string }) {
  return (
    <span>
      {ja}
      <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(200,200,220,0.7)', fontStyle: 'italic', marginLeft: 6 }}>
        / {en}
      </span>
    </span>
  )
}

function BiContent({ ja, en }: { ja: string; en: string }) {
  return (
    <div>
      <div style={{ lineHeight: 1.6 }}>{ja}</div>
      <div style={{ fontSize: 12, color: 'rgba(180,180,200,0.8)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
        {en}
      </div>
    </div>
  )
}

export function OnboardingTour() {
  const { run, stopTour } = useOnboardingStore()
  const applyAutoLayout = useOrgStore(s => s.applyAutoLayout)
  const prevRun = useRef(false)

  // Apply auto-layout the first time the tour becomes active
  useEffect(() => {
    if (run && !prevRun.current) {
      applyAutoLayout()
    }
    prevRun.current = run
  }, [run, applyAutoLayout])

  const steps = getTourSteps({
    welcomeTitle:   <BiTitle   ja={TOUR_DATA[0].ja.title}   en={TOUR_DATA[0].en.title}   />,
    welcomeContent: <BiContent ja={TOUR_DATA[0].ja.content} en={TOUR_DATA[0].en.content} />,
    addNodeTitle:   <BiTitle   ja={TOUR_DATA[1].ja.title}   en={TOUR_DATA[1].en.title}   />,
    addNodeContent: <BiContent ja={TOUR_DATA[1].ja.content} en={TOUR_DATA[1].en.content} />,
    editTitle:      <BiTitle   ja={TOUR_DATA[2].ja.title}   en={TOUR_DATA[2].en.title}   />,
    editContent:    <BiContent ja={TOUR_DATA[2].ja.content} en={TOUR_DATA[2].en.content} />,
    exportTitle:    <BiTitle   ja={TOUR_DATA[3].ja.title}   en={TOUR_DATA[3].en.title}   />,
    exportContent:  <BiContent ja={TOUR_DATA[3].ja.content} en={TOUR_DATA[3].en.content} />,
  })

  const handleEvent = (data: EventData) => {
    const { status, type } = data
    if (type === 'tooltip') {
      setTimeout(() => {
        const btn = document.querySelector<HTMLElement>('button[data-action="primary"]')
          ?? document.querySelector<HTMLElement>('.react-joyride__button--primary')
        btn?.focus()
      }, 150)
    }
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(STORAGE_KEY, 'true')
      stopTour()
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      locale={{
        next:  '次へ / Next',
        back:  '戻る / Back',
        last:  '完了 / Finish',
        skip:  'スキップ / Skip',
        close: 'スキップ / Skip',
      }}
      options={{
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
        skipScroll: true,
        spotlightPadding: 8,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        primaryColor: '#6366f1',
        backgroundColor: '#1e1e2e',
        textColor: '#e0e0e0',
        arrowColor: '#1e1e2e',
        zIndex: 9999,
      }}
      styles={{
        tooltip: {
          borderRadius: 10,
          fontSize: 14,
        },
        buttonPrimary: {
          borderRadius: 6,
          fontSize: 13,
        },
        buttonBack: {
          fontSize: 13,
        },
        buttonSkip: {
          fontSize: 12,
        },
      }}
    />
  )
}
