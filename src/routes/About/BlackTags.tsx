import { Chip, Icon, ListItem, Text } from '@rn-vui/themed'
import React from 'react'

import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'

export default React.memo(BlackTags)

function BlackTags() {
  const [expanded, setExpanded] = React.useState(false)
  const { $blackTags, set$blackTags } = useStore()
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
        containerStyle={tw('flex-wrap p-0 flex-row px-1 pb-4 bg-transparent')}>
        {Object.values($blackTags).map((tag) => {
          return (
            <Chip
              title={tag}
              key={tag}
              type="outline"
              icon={{
                name: 'close',
                type: 'Ionicons',
                size: 16,
                ...tw(colors.gray5.text),
                onPress: () => {
                  const blackTags = { ...$blackTags }
                  delete blackTags[tag]
                  set$blackTags(blackTags)
                },
              }}
              iconRight
              titleStyle={tw('text-left text-sm font-thin')}
              containerStyle={tw('mb-2 self-start')}
              buttonStyle={tw('pl-1 py-[2px]')}
            />
          )
        })}
        {Object.values($blackTags).length === 0 ? <Text>🈚</Text> : null}
      </ListItem>
    </ListItem.Accordion>
  )
}
