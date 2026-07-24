export interface MoodState {
  /** 情绪效价 -3(非常低落) .. 3(非常明亮) */
  valence: number
  /** 情绪词标签 */
  labels: string[]
}

export type EntryKind = 'now' | 'past'

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  ts: number
}

export interface Entry {
  id: string
  createdAt: number
  kind: EntryKind
  mood: MoodState
  /** 过去的模糊时间标记，如「去年夏天」 */
  timeMark?: string
  /** 现在的快速记录 */
  note?: string
  /** 与 AI 的对话记录 */
  transcript?: ChatMessage[]
  /** 第一人称日记 */
  diary?: string
  /** 是否沉淀为日记 */
  diaryEnabled: boolean
}

export type Screen =
  | { name: 'home' }
  | { name: 'classify' }
  | { name: 'now-note' }
  | { name: 'past-time' }
  | { name: 'chat' }
  | { name: 'diary' }
  | { name: 'card'; entryId: string }
  | { name: 'timeline' }
  | { name: 'detail'; entryId: string }

/** 会话中的草稿数据 */
export interface Draft {
  mood: MoodState
  kind?: EntryKind
  timeMark?: string
  note?: string
  transcript: ChatMessage[]
  diary?: string
  diaryEnabled: boolean
}
