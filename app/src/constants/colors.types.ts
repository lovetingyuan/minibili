/** 同一语义颜色用于文字、原生属性、填充和描边。 */
export type Tone = {
  text: string;
  accent: string;
  bg: string;
  border: string;
};

export type BrandTone = Tone & {
  tint: string;
  content: string;
  onDark: string;
  accentOnDark: string;
};
