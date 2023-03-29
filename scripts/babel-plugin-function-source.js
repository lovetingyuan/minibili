const { default: generate } = require('@babel/generator')
module.exports = function (babel) {
  const { types: t } = babel

  return {
    name: 'replace-function-with-variable',
    visitor: {
      FunctionDeclaration(path) {
        const name = path.node.id?.name || ''
        if (!name.startsWith('__$')) {
          return
        }
        const sourceCode = generate(path.node).code
        const variableDeclaration = t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier(name), t.stringLiteral(sourceCode)),
        ])
        path.replaceWith(variableDeclaration)
      },
    },
  }
}
