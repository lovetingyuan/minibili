import { getDynamicItems } from './services/Bilibili';

export type RootStackParamList = {
  Home: undefined;
  Main: {};
  WebPage: { url: string; title: string; type?: 'pc' | 'mobile' };
  Play: {
    aid: number | string;
    bvid: string;
    name: string;
    mid: string | number;
  };
  Dynamic: {
    mid: string | number;
    name: string;
    face: string;
    sign: string;
    follow: boolean;
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
