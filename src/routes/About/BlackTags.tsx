import { Chip, ListItem, Text, Icon, useTheme } from '@rneui/themed'
import React from 'react'
import { useStore } from '../../store'

export default React.memo(function BlackTags() {
  const [expanded, setExpanded] = React.useState(false)
  const { $blackTags, set$blackTags } = useStore()
  const { theme } = useTheme()
  return (
    <ListItem.Accordion
      icon={<Icon name={'chevron-down'} type="material-community" />}
      containerStyle={tw('p-0 mt-1 mb-3 bg-transparent')}
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
      <ListItem
        containerStyle={tw('flex-wrap p-0 flex-row px-1 bg-transparent')}>
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
                color: theme.colors.grey2,
                onPress: () => {
                  const blackTags = { ...$blackTags }
                  delete blackTags[tag]
                  set$blackTags(blackTags)
                },
              }}
              iconRight
              titleStyle={tw('text-left')}
              containerStyle={tw('mb-2 self-start')}
              buttonStyle={tw('px-0 py-[2]')}
            />
          )
        })}
        {Object.values($blackTags).length === 0 ? <Text>无</Text> : null}
      </ListItem>
    </ListItem.Accordion>
  )
})
