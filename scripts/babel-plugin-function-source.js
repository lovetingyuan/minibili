const { default: generate } = require('@babel/generator')
const fs = require('node:fs')
const nodePath = require('node:path')

module.exports = babel => {
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
      CallExpression(path, state) {
        if (
          path.node.callee.name === 'inlineRequire' &&
          path.node.arguments.length === 1 &&
          path.node.arguments[0].type === 'StringLiteral'
        ) {
          const filePath = path.node.arguments[0].value
          let absolutePath
          if (filePath.startsWith('.')) {
            absolutePath = nodePath.resolve(
              nodePath.dirname(state.file.opts.filename),
              filePath,
            )
          } else if (filePath.startsWith('/')) {
            absolutePath = filePath
          } else {
            absolutePath = nodePath.resolve(
              __dirname,
              `../node_modules/${filePath}`,
            )
          }
          const fileContent = fs.readFileSync(absolutePath, 'utf8')
          path.replaceWith(t.stringLiteral(fileContent))
        }
      },
    },
  }
}
