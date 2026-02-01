// my-plugin.js

// 插件本质上就是一个函数
// 它接收当前的 config 对象，你可以在这里修改它，最后必须把它返回
const withMyLogPlugin = (config) => {
  console.log('------------------------------------------------')
  console.log('🚀 我的插件正在运行！(Hello from my plugin)')
  console.log('------------------------------------------------')

  // 你甚至可以在这里动态修改 app 的名字，证明插件生效了
  // config.name = "被插件修改的名字";

  return config
}

module.exports = withMyLogPlugin
