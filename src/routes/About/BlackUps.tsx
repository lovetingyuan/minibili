import { ListItem, Text, Icon, useTheme } from '@rneui/themed'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useStore } from '../../store'

export default React.memo(function BlackUps() {
  const [expandedUp, setExpandedUp] = React.useState(false)
  const { $blackUps } = useStore()
  const { theme } = useTheme()
  return (
    <ListItem.Accordion
      icon={<Icon name={'chevron-down'} type="material-community" />}
      containerStyle={styles.blackTitle}
      content={
        <ListItem.Content>
          <ListItem.Title>
            不喜欢的UP（{Object.keys($blackUps).length}）
          </ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expandedUp}
      onPress={() => {
        setExpandedUp(!expandedUp)
      }}>
      <ListItem containerStyle={[styles.blackContent]}>
        {Object.values($blackUps).map(name => {
          return (
            <Text key={name} style={{ color: theme.colors.grey2 }}>
              {name}
            </Text>
          )
        })}
        {Object.values($blackUps).length === 0 ? <Text>无</Text> : null}
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
  blackContent: {
    flexWrap: 'wrap',
    padding: 0,
    flexDirection: 'row',
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
})
