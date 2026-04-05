import { Joyride, type EventData, STATUS } from 'react-joyride'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { useOrgStore } from '@/store/useOrgStore'
import { useT } from '@/hooks/useT'
import { getTourSteps } from './tourSteps'
import { useEffect, useRef } from 'react'

const STORAGE_KEY = 'organo-tour-completed'

export function OnboardingTour() {
  const { run, startTour, stopTour } = useOnboardingStore()
  const applyAutoLayout = useOrgStore(s => s.applyAutoLayout)
  const t = useT()
  const prevRun = useRef(false)

  // Apply auto-layout the first time the tour becomes active
  useEffect(() => {
    if (run && !prevRun.current) {
      applyAutoLayout()
    }
    prevRun.current = run
  }, [run, applyAutoLayout])

  const steps = getTourSteps({
    welcomeTitle: t('tourWelcomeTitle'),
    welcomeContent: t('tourWelcomeContent'),
    addNodeTitle: t('tourAddNodeTitle'),
    addNodeContent: t('tourAddNodeContent'),
    editTitle: t('tourEditTitle'),
    editContent: t('tourEditContent'),
    exportTitle: t('tourExportTitle'),
    exportContent: t('tourExportContent'),
  })

  const handleEvent = (data: EventData) => {
    const { status } = data
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
        next: t('tourNext'),
        back: t('tourBack'),
        last: t('tourFinish'),
        skip: t('tourSkip'),
        close: t('tourSkip'),
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
