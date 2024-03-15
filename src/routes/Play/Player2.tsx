// // import { ResizeMode, Video } from 'expo-av'
// import React from 'react'

// import { UA } from '@/constants'

// function NewPlayer() {
//   const video = React.useRef(null)
//   const [status, setStatus] = React.useState({})
//   return (
//     <Video
//       ref={video}
//       className="w-full border h-[100px]"
//       source={{
//         headers: {
//           Referer: 'https://www.bilibili.com/',
//           'user-agent': UA,
//         },
//         uri: 'https://upos-sz-mirrorali.bilivideo.com/upgcxcode/53/68/1454646853/1454646853-1-192.mp4?e=ig8euxZM2rNcNbN1nWdVhwdlhbRHhwdVhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&nbs=1&deadline=1709677030&gen=playurlv2&os=alibv&oi=1974397343&trid=d6d5b651ff8e4c829bf06c3ae3787031u&mid=0&platform=pc&upsig=318749d2c0c728f8d5a9033106bc2874&uparams=e,uipk,nbs,deadline,gen,os,oi,trid,mid,platform&bvc=vod&nettype=0&orderid=1,3&buvid=641EE3F5-8940-B336-A1CD-BD269C8F65A819916infoc&build=0&f=u_0_0&agrr=1&bw=219376&logo=40000000',
//       }}
//       useNativeControls
//       resizeMode={ResizeMode.CONTAIN}
//       isLooping
//       onPlaybackStatusUpdate={s => setStatus(() => s)}
//     />
//   )
// }

// export default React.memo(NewPlayer)
