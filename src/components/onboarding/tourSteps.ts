import type { Step } from 'react-joyride'

interface TourStrings {
  welcomeTitle: string
  welcomeContent: string
  addNodeTitle: string
  addNodeContent: string
  editTitle: string
  editContent: string
  exportTitle: string
  exportContent: string
}

export function getTourSteps(s: TourStrings): Step[] {
  return [
    {
      target: 'body',
      placement: 'center',
      skipBeacon: true,
      title: s.welcomeTitle,
      content: s.welcomeContent,
    },
    {
      target: '[data-tour="btn-add-person"]',
      placement: 'bottom',
      skipBeacon: true,
      title: s.addNodeTitle,
      content: s.addNodeContent,
    },
    {
      target: '[data-tour="org-node"]',
      placement: 'right',
      skipBeacon: true,
      title: s.editTitle,
      content: s.editContent,
    },
    {
      target: '[data-tour="btn-export"]',
      placement: 'bottom',
      skipBeacon: true,
      title: s.exportTitle,
      content: s.exportContent,
    },
  ]
}
