import { Icon, ListItem, Text } from '@rneui/themed'
import React from 'react'

import { useStore } from '../../store'

export default React.memo(function BlackUps() {
  const [expandedUp, setExpandedUp] = React.useState(false)
  const { $blackUps } = useStore()
  return (
    <ListItem.Accordion
      icon={<Icon name={'chevron-down'} type="material-community" />}
      containerStyle={tw('p-0 mt-1 mb-3 bg-transparent')}
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
      <ListItem
        containerStyle={tw('flex-wrap p-0 flex-row px-1 mb-3 bg-transparent')}>
        {Object.values($blackUps).map(name => {
          return (
            <Text key={name} className="text-gray-500 line-through">
              {name}
            </Text>
          )
        })}
        {Object.values($blackUps).length === 0 ? <Text>无</Text> : null}
      </ListItem>
    </ListItem.Accordion>
  )
})
