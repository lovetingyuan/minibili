// 获取正确的cookie
// https://github.com/SocialSisterYi/bilibili-API-collect/issues/686

function getuuid(time: number) {
  const randString8 = randomString(8),
    randString4_1 = randomString(4),
    randString4_2 = randomString(4),
    randString4_3 = randomString(4),
    randString12 = randomString(12),
    truncatedTime = time

  return (
    randString8 +
    '-' +
    randString4_1 +
    '-' +
    randString4_2 +
    '-' +
    randString4_3 +
    '-' +
    randString12 +
    padLeft((truncatedTime % 1e5).toString(), 5) +
    'infoc'
  )
}

function randomString(length: number) {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += toHex(Math.floor(16 * Math.random()))
  }
  return padLeft(result, length)
}

function padLeft(str: string, length: number) {
  let padding = ''
  if (str.length < length) {
    for (let i = 0; i < length - str.length; i++) {
      padding += '0'
    }
  }
  return padding + str
}

function toHex(num: number) {
  return Math.ceil(num).toString(16).toUpperCase()
}
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67'

function getbuvid3(mid = 14427395) {
  return fetch('https://space.bilibili.com/' + mid + '/dynamic', {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': UA,
      'upgrade-insecure-requests': '1',
    },
    referrer: 'https://www.bilibili.com/',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
  }).then(response => {
    const cookie = response.headers.get('Set-Cookie') || ''
    const cookies = cookie.split('; ')
    return cookies.find(v => v.startsWith('buvid3='))
  })
}

function getbuvid4(bvuid3: string, uuid: string) {
  return fetch('https://api.bilibili.com/x/frontend/finger/spi', {
    headers: {
      accept: '*/*',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': UA,
      cookie: `${bvuid3}; _uuid=${uuid}`,
    },
    referrer: 'https://api.bilibili.com/x/frontend/finger/spi',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
    .then(res => res.json())
    .then(res => {
      return res.data.b_4
    })
}

function getPayload(now: number, uuid: string) {
  return {
    3064: 1,
    5062: now.toString(),
    '03bf': 'https%3A%2F%2Fspace.bilibili.com%2F85997303%2Fdynamic',
    '39c8': '333.999.fp.risk',
    '34f1': '',
    d402: '',
    '654a': '',
    '6e7c': '539x770',
    '3c43': {
      2673: 0,
      5766: 30,
      6527: 0,
      7003: 1,
      '807e': 1,
      b8ce: UA,
      '641c': 0,
      '07a4': 'zh-CN',
      '1c57': 8,
      '0bd0': 8,
      '748e': [900, 1440],
      d61f: [817, 1440],
      fc9d: -480,
      '6aa9': 'Asia/Shanghai',
      '75b8': 1,
      '3b21': 1,
      '8a1c': 1,
      d52f: 'not available',
      adca: 'MacIntel',
      '80c9': [
        [
          'PDF Viewer',
          'Portable Document Format',
          [
            ['application/pdf', 'pdf'],
            ['text/pdf', 'pdf'],
          ],
        ],
        [
          'Chrome PDF Viewer',
          'Portable Document Format',
          [
            ['application/pdf', 'pdf'],
            ['text/pdf', 'pdf'],
          ],
        ],
        [
          'Chromium PDF Viewer',
          'Portable Document Format',
          [
            ['application/pdf', 'pdf'],
            ['text/pdf', 'pdf'],
          ],
        ],
        [
          'Microsoft Edge PDF Viewer',
          'Portable Document Format',
          [
            ['application/pdf', 'pdf'],
            ['text/pdf', 'pdf'],
          ],
        ],
        [
          'WebKit built-in PDF',
          'Portable Document Format',
          [
            ['application/pdf', 'pdf'],
            ['text/pdf', 'pdf'],
          ],
        ],
      ],
      '13ab': '78cAAAAASUVORK5CYII=',
      bfe9: 'YokI0CACsbq0kUBewr8H9+OQu1o/AjFQAAAABJRU5ErkJggg==',
      a3c1: [
        'extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_disjoint_timer_query;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;EXT_sRGB;KHR_parallel_shader_compile;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linear;OES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_color_buffer_float;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_debug_shaders;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_multi_draw',
        'webgl aliased line width range:[1, 1]',
        'webgl aliased point size range:[1, 64]',
        'webgl alpha bits:8',
        'webgl antialiasing:yes',
        'webgl blue bits:8',
        'webgl depth bits:24',
        'webgl green bits:8',
        'webgl max anisotropy:16',
        'webgl max combined texture image units:32',
        'webgl max cube map texture size:16384',
        'webgl max fragment uniform vectors:1024',
        'webgl max render buffer size:16384',
        'webgl max texture image units:16',
        'webgl max texture size:16384',
        'webgl max varying vectors:31',
        'webgl max vertex attribs:16',
        'webgl max vertex texture image units:16',
        'webgl max vertex uniform vectors:1024',
        'webgl max viewport dims:[16384, 16384]',
        'webgl red bits:8',
        'webgl renderer:WebKit WebGL',
        'webgl shading language version:WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
        'webgl stencil bits:0',
        'webgl vendor:WebKit',
        'webgl version:WebGL 1.0 (OpenGL ES 2.0 Chromium)',
        'webgl unmasked vendor:Google Inc. (Apple)',
        'webgl unmasked renderer:ANGLE (Apple, Apple M1, OpenGL 4.1)',
        'webgl vertex shader high float precision:23',
        'webgl vertex shader high float precision rangeMin:127',
        'webgl vertex shader high float precision rangeMax:127',
        'webgl vertex shader medium float precision:23',
        'webgl vertex shader medium float precision rangeMin:127',
        'webgl vertex shader medium float precision rangeMax:127',
        'webgl vertex shader low float precision:23',
        'webgl vertex shader low float precision rangeMin:127',
        'webgl vertex shader low float precision rangeMax:127',
        'webgl fragment shader high float precision:23',
        'webgl fragment shader high float precision rangeMin:127',
        'webgl fragment shader high float precision rangeMax:127',
        'webgl fragment shader medium float precision:23',
        'webgl fragment shader medium float precision rangeMin:127',
        'webgl fragment shader medium float precision rangeMax:127',
        'webgl fragment shader low float precision:23',
        'webgl fragment shader low float precision rangeMin:127',
        'webgl fragment shader low float precision rangeMax:127',
        'webgl vertex shader high int precision:0',
        'webgl vertex shader high int precision rangeMin:31',
        'webgl vertex shader high int precision rangeMax:30',
        'webgl vertex shader medium int precision:0',
        'webgl vertex shader medium int precision rangeMin:31',
        'webgl vertex shader medium int precision rangeMax:30',
        'webgl vertex shader low int precision:0',
        'webgl vertex shader low int precision rangeMin:31',
        'webgl vertex shader low int precision rangeMax:30',
        'webgl fragment shader high int precision:0',
        'webgl fragment shader high int precision rangeMin:31',
        'webgl fragment shader high int precision rangeMax:30',
        'webgl fragment shader medium int precision:0',
        'webgl fragment shader medium int precision rangeMin:31',
        'webgl fragment shader medium int precision rangeMax:30',
        'webgl fragment shader low int precision:0',
        'webgl fragment shader low int precision rangeMin:31',
        'webgl fragment shader low int precision rangeMax:30',
      ],
      '6bc5': 'Google Inc. (Apple)~ANGLE (Apple, Apple M1, OpenGL 4.1)',
      ed31: 0,
      '72bd': 0,
      '097b': 0,
      '52cd': [0, 0, 0],
      a658: [
        'Andale Mono',
        'Arial',
        'Arial Black',
        'Arial Hebrew',
        'Arial Narrow',
        'Arial Rounded MT Bold',
        'Arial Unicode MS',
        'Comic Sans MS',
        'Courier',
        'Courier New',
        'Geneva',
        'Georgia',
        'Helvetica',
        'Helvetica Neue',
        'Impact',
        'LUCIDA GRANDE',
        'Microsoft Sans Serif',
        'Monaco',
        'Palatino',
        'Tahoma',
        'Times',
        'Times New Roman',
        'Trebuchet MS',
        'Verdana',
        'Wingdings',
        'Wingdings 2',
        'Wingdings 3',
      ],
      d02f: '124.04344968475198',
    },
    '54ef': '{"in_new_ab":true,"ab_version":{},"ab_split_num":{}}',
    '8b94': 'https%3A%2F%2Fwww.bilibili.com%2F',
    df35: uuid,
    '07a4': 'zh-CN',
    '5f45': null,
    db46: 0,
  }
}

function wuzhi(now: number, bvuid3: string, uuid: string) {
  const payload = getPayload(now, uuid)
  const body = JSON.stringify({ payload: JSON.stringify(payload) })

  return fetch(
    'https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi',
    {
      headers: {
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json;charset=UTF-8',
        pragma: 'no-cache',
        'user-agent': UA,
        cookie: `${bvuid3}; _uuid=${uuid}`,
      },
      referrer: 'https://space.bilibili.com/85997303/dynamic',
      referrerPolicy: 'no-referrer-when-downgrade',
      body,
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    },
  )
}

export default async function getCookie() {
  const buvid3 = (await getbuvid3()) || getuuid(Date.now())
  const now = Date.now()
  const uuid = getuuid(now)
  const buvid4 = await getbuvid4(buvid3, uuid)
  await wuzhi(now, buvid3, uuid)
  return `${buvid3}; _uuid=${uuid}; bvuid4=${buvid4}`
}
