export type Locale = 'ja' | 'en'

export const translations = {
  // ── Toolbar ──────────────────────────────────────────
  autoLayout: { ja: '自動整列', en: 'Auto Layout' },
  exportBtn: { ja: 'エクスポート', en: 'Export' },
  importBtn: { ja: 'インポート', en: 'Import' },
  addPerson: { ja: '人物追加', en: 'Add Person' },
  addUnit: { ja: '組織追加', en: 'Add Org' },
  switchToLight: { ja: 'ライトモードに切り替え', en: 'Switch to Light Mode' },
  switchToDark: { ja: 'ダークモードに切り替え', en: 'Switch to Dark Mode' },
  importError: { ja: 'JSONファイルの読み込みに失敗しました', en: 'Failed to load JSON file' },

  // ── SearchBar ────────────────────────────────────────
  searchPlaceholder: { ja: '名前・役職・部署で検索...', en: 'Search by name, role, dept...' },

  // ── Sidebar ──────────────────────────────────────────
  editPerson: { ja: '人物の編集', en: 'Edit Person' },
  editUnit: { ja: '組織の編集', en: 'Edit Unit' },
  delete: { ja: '削除', en: 'Delete' },
  save: { ja: '保存', en: 'Save' },

  // ── PersonEditForm ────────────────────────────────────
  fieldName: { ja: '氏名', en: 'Name' },
  fieldRole: { ja: '役職', en: 'Role' },
  fieldDept: { ja: '部署', en: 'Department' },
  fieldEmail: { ja: 'メールアドレス', en: 'Email' },
  fieldPhone: { ja: '電話番号', en: 'Phone' },
  fieldEmployment: { ja: '雇用形態', en: 'Employment Type' },
  fieldTags: { ja: 'タグ（Enterで追加）', en: 'Tags (Enter to add)' },
  selectPlaceholder: { ja: '選択してください', en: 'Select...' },
  empFullTime: { ja: '正社員', en: 'Full-time' },
  empPartTime: { ja: 'パートタイム', en: 'Part-time' },
  empContract: { ja: '業務委託', en: 'Contract' },
  empIntern: { ja: 'インターン', en: 'Intern' },
  empAdvisor: { ja: 'アドバイザー', en: 'Advisor' },

  // ── UnitEditForm ─────────────────────────────────────
  fieldUnitName: { ja: '組織名', en: 'Unit Name' },
  fieldUnitType: { ja: '種別', en: 'Type' },
  fieldHeadPerson: { ja: '部門長名', en: 'Head Person' },
  fieldMemberCount: { ja: '人数', en: 'Members' },
  fieldDescription: { ja: '説明', en: 'Description' },

  // ── Unit types ───────────────────────────────────────
  unitCompany: { ja: '会社・法人', en: 'Company' },
  unitHQ: { ja: '本部', en: 'HQ' },
  unitBureau: { ja: '局', en: 'Bureau' },
  unitDept: { ja: '部', en: 'Department' },
  unitDivision: { ja: '室・事業部', en: 'Division' },
  unitSection: { ja: '課', en: 'Section' },
  unitTeam: { ja: '係・チーム', en: 'Team' },
  unitPost: { ja: '担当', en: 'Post' },

  // ── Employment labels (card display) ─────────────────
  empLabelFullTime: { ja: '正社員', en: 'Full-time' },
  empLabelPartTime: { ja: 'パート', en: 'Part-time' },
  empLabelContract: { ja: '業務委託', en: 'Contract' },
  empLabelIntern: { ja: 'インターン', en: 'Intern' },
  empLabelAdvisor: { ja: 'アドバイザー', en: 'Advisor' },

  // ── Context menu ─────────────────────────────────────
  addPersonBelow: { ja: '配下に人物を追加', en: 'Add Person Below' },
  addUnitBelow: { ja: '配下に組織を追加', en: 'Add Unit Below' },
  menuEdit: { ja: '編集', en: 'Edit' },
  menuExpand: { ja: '展開する', en: 'Expand' },
  menuCollapse: { ja: '折りたたむ', en: 'Collapse' },
  menuDelete: { ja: '削除', en: 'Delete' },

  // ── Export modal ─────────────────────────────────────
  exportTitle: { ja: 'エクスポート形式を選択', en: 'Select Export Format' },
  jsonDesc: { ja: 'データの保存・再インポートに', en: 'Save & reimport data' },
  pngDesc: { ja: '高解像度の画像ファイル', en: 'High-resolution image' },
  svgDesc: { ja: 'スケーラブルなベクター形式', en: 'Scalable vector format' },
  pdfDesc: { ja: '印刷・配布用', en: 'For print & distribution' },
  treeJsonDesc: { ja: 'ツリー構造のJSONファイル', en: 'Tree-structured JSON file' },
  flatCsvDesc: { ja: 'Excel対応フラットCSV', en: 'Flat CSV (Excel-compatible)' },
  standaloneHtmlDesc: { ja: 'スタンドアロンHTMLファイル', en: 'Standalone HTML file' },

  // ── Quick menu ───────────────────────────────────────
  createNode: { ja: 'ノードを作成', en: 'Create Node' },
  quickPerson: { ja: '人物', en: 'Person' },
  quickUnit: { ja: '部門', en: 'Unit' },

  // ── TagInput ─────────────────────────────────────────
  tagPlaceholder: { ja: 'Enterでタグ追加', en: 'Press Enter to add' },

  // ── Save status & new chart ──────────────────────────────
  saved: { ja: '保存済み', en: 'Saved' },
  unsaved: { ja: '未保存の変更あり', en: 'Unsaved changes' },
  newChart: { ja: '新規', en: 'New' },
  newChartConfirm: {
    ja: '現在の組織図を破棄して新規作成しますか？',
    en: 'Discard current chart and start fresh?',
  },
  tooltipNew: { ja: '新しい組織図を作成', en: 'Create new chart' },

  // ── Tooltip labels ───────────────────────────────────
  tooltipAutoLayout: { ja: 'ノードを自動で整列', en: 'Auto-arrange nodes' },
  tooltipExport: { ja: '組織図をエクスポート', en: 'Export chart' },
  tooltipImport: { ja: 'データをインポート', en: 'Import data' },
  tooltipAddPerson: { ja: '人物ノードを追加', en: 'Add person node' },
  tooltipAddUnit: { ja: '組織ノードを追加', en: 'Add unit node' },
  tooltipLang: { ja: '言語を切り替え', en: 'Switch language' },
  tooltipTheme: { ja: 'テーマを切り替え', en: 'Toggle theme' },
  tooltipSearch: { ja: 'ノードを検索', en: 'Search nodes' },

  // ── Empty state ──────────────────────────────────────
  emptyStateTitle: { ja: '組織図がまだありません', en: 'No chart yet' },
  emptyStateSubtitle: {
    ja: '最初のノードを追加して始めましょう',
    en: 'Add your first node to get started',
  },
  emptyStateAddPerson: { ja: '人物を追加', en: 'Add Person' },
  emptyStateAddUnit: { ja: '部署を追加', en: 'Add Unit' },

  // ── Tour ─────────────────────────────────────────────
  tourWelcomeTitle: { ja: 'ようこそ！', en: 'Welcome!' },
  tourWelcomeContent: {
    ja: '組織図アプリの基本的な使い方をご案内します。',
    en: "Let's walk you through the basics.",
  },
  tourAddNodeTitle: { ja: 'ノードを追加', en: 'Add Nodes' },
  tourAddNodeContent: {
    ja: 'このボタンから人物や部署ノードを追加できます。',
    en: 'Use these buttons to add person or unit nodes.',
  },
  tourEditTitle: { ja: 'ノードを編集', en: 'Edit Nodes' },
  tourEditContent: {
    ja: 'ノードをクリックすると右側のパネルで詳細を編集できます。',
    en: 'Click any node to edit its details in the side panel.',
  },
  tourExportTitle: { ja: 'エクスポート', en: 'Export' },
  tourExportContent: {
    ja: '完成した組織図を画像やデータとして書き出せます。',
    en: 'Export your chart as an image or data file.',
  },
  tourNext: { ja: '次へ', en: 'Next' },
  tourBack: { ja: '戻る', en: 'Back' },
  tourFinish: { ja: '完了', en: 'Finish' },
  tourSkip: { ja: 'スキップ', en: 'Skip' },
  helpBtnLabel: { ja: 'ヘルプ', en: 'Help' },
} as const satisfies Record<string, Record<Locale, string>>

export type TranslationKey = keyof typeof translations
