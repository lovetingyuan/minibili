import { getDynamicItems } from './services/Bilibili';

export type RootStackParamList = {
  Home: undefined;
  Main: {};
  WebPage: { url: string; bvid?: string; title: string };
  Play: {
    aid: number | string;
    bvid: string;
    name: string;
    mid: number;
  };
  Dynamic: {
    upId: number;
  };
  Hot: undefined;
  Follow: undefined;
};

export type GetFuncPromiseType<F extends (...a: any) => any> =
  ReturnType<F> extends Promise<infer R> ? R : never;

export type DynamicItem = GetFuncPromiseType<
  typeof getDynamicItems
>['items'][0];

export const enum DynamicType {
  Video = 'video',
  Draw = 'draw',
  ForwardVideo = 'ForwardVideo',
  ForwardDraw = 'ForwardDraw',
  ForwardOther = 'ForwardOther',
}
