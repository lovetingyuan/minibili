import { Chip, ListItem, Text, Icon } from '@rneui/themed'
import React from 'react'
import { StyleSheet } from 'react-native'
import store, { useStore } from '../../store'

export default React.memo(function BlackTags() {
  const [expanded, setExpanded] = React.useState(false)
  const { $blackTags } = useStore()
  return (
    <ListItem.Accordion
      icon={<Icon name={'chevron-down'} type="material-community" />}
      containerStyle={styles.blackTitle}
      content={
        <ListItem.Content>
          <ListItem.Title>
            不感兴趣的分类（{Object.keys($blackTags).length}）
          </ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expanded}
      onPress={() => {
        setExpanded(!expanded)
      }}>
      <ListItem containerStyle={[styles.blackContent]}>
        {Object.values($blackTags).map(tag => {
          return (
            <Chip
              title={tag}
              key={tag}
              type="outline"
              icon={{
                name: 'close',
                type: 'Ionicons',
                size: 18,
                color: '#666',
                onPress: () => {
                  delete store.$blackTags[tag]
                },
              }}
              iconRight
              titleStyle={styles.chipTitle}
              containerStyle={styles.chip}
              buttonStyle={styles.chipButton}
            />
          )
        })}
        {Object.values($blackTags).length === 0 ? <Text>无</Text> : null}
      </ListItem>
    </ListItem.Accordion>
  )
})

const styles = StyleSheet.create({
  blackTitle: {
    padding: 0,
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
  },
  chip: {
    marginBottom: 7,
    alignSelf: 'flex-start',
  },
  chipTitle: { textAlign: 'left' },
  chipButton: {
    padding: 0,
    paddingVertical: 2,
  },
})
