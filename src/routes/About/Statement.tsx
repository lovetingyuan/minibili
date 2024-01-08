import { ListItem, Text, Icon, useTheme } from '@rneui/themed'
import React from 'react'
import { StyleSheet, Linking } from 'react-native'
import { githubLink } from '../../constants'

export default React.memo(function Statement() {
  const [expandedStatement, setExpandedStatement] = React.useState(true)
  const { theme } = useTheme()
  return (
    <ListItem.Accordion
      containerStyle={[styles.blackTitle]}
      icon={<Icon name={'chevron-down'} type="material-community" />}
      content={
        <ListItem.Content>
          <ListItem.Title style={styles.title}>声明</ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expandedStatement}
      onPress={() => {
        setExpandedStatement(!expandedStatement)
      }}>
      <ListItem containerStyle={[styles.statementContent]}>
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

const styles = StyleSheet.create({
  blackTitle: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },

  title: { fontWeight: 'bold' },
  statementContent: {
    paddingVertical: 0,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
})
