/**
 * SiYuan API response wrapper (all endpoints return this shape).
 */
export interface SiYuanResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface NotebookItem {
  id: string;
  name: string;
  icon: string;
  sort: number;
  closed: boolean;
}

export interface NotebookConf {
  name: string;
  closed: boolean;
  refCreateSavePath?: string;
  createDocNameTemplate?: string;
  dailyNoteSavePath?: string;
  dailyNoteTemplatePath?: string;
}
