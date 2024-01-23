import { ListItem, Text, Icon, useTheme } from '@rneui/themed'
import React from 'react'
import { Linking } from 'react-native'
import { githubLink } from '../../constants'

export default React.memo(function Statement() {
  const [expandedStatement, setExpandedStatement] = React.useState(true)
  const { theme } = useTheme()
  return (
    <ListItem.Accordion
      containerStyle={tw('p-0 mt-1 mb-3 bg-transparent')}
      icon={<Icon name={'chevron-down'} type="material-community" />}
      content={
        <ListItem.Content>
          <ListItem.Title className="font-bold">声明</ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expandedStatement}
      onPress={() => {
        setExpandedStatement(!expandedStatement)
      }}>
      <ListItem containerStyle={tw('py-0 px-3 mb-5 bg-transparent')}>
        <ListItem.Subtitle right>
          <Text>
            🔈本应用完全开源并且所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!（有问题欢迎使用意见反馈或者在
          </Text>
          <Text
            style={{ color: theme.colors.primary }}
            onPress={() => {
              Linking.openURL(githubLink)
            }}>
            {' Github '}
          </Text>
          <Text>中提出 😀）</Text>
          <Text>{'\n'}⚠️ 切勿频繁刷新数据！🙏</Text>
        </ListItem.Subtitle>
      </ListItem>
    </ListItem.Accordion>
  )
})
