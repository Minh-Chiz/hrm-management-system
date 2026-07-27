import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from './Avatar';

export interface AvatarGroupProps {
  avatars: string[];
  avatarSize?: 'sm' | 'md' | 'lg' | number;
  max?: number;
  onAddPress?: () => void;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  avatarSize = 'md',
  max = 4,
  onAddPress,
  className = '',
}) => {
  // Determine pixel size to calculate offset and typography
  let pixelSize = 40;
  if (typeof avatarSize === 'number') {
    pixelSize = avatarSize;
  } else {
    switch (avatarSize) {
      case 'sm':
        pixelSize = 24;
        break;
      case 'lg':
        pixelSize = 56;
        break;
      case 'md':
      default:
        pixelSize = 40;
        break;
    }
  }

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const overlapMargin = -Math.floor(pixelSize * 0.35); // overlapping effect

  return (
    <View className={`flex-row items-center ${className}`}>
      <View className="flex-row items-center">
        {visibleAvatars.map((uri, index) => (
          <View
            key={index}
            style={[
              {
                zIndex: index,
                marginLeft: index === 0 ? 0 : overlapMargin,
              },
            ]}
          >
            <Avatar
              uri={uri}
              size={avatarSize}
              border
              borderWidth={2}
              borderColor="#0d1516" // uses brand-bg background color for cutout effect
            />
          </View>
        ))}

        {remainingCount > 0 && (
          <View
            style={[
              {
                width: pixelSize,
                height: pixelSize,
                borderRadius: pixelSize / 2,
                marginLeft: overlapMargin,
                zIndex: max,
                borderWidth: 2,
                borderColor: '#0d1516',
              },
            ]}
            className="bg-[#2e3638] items-center justify-center"
          >
            <Text 
              style={{ fontSize: Math.floor(pixelSize * 0.35) }}
              className="text-[#dce4e5] font-bold"
            >
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>

      {onAddPress && (
        <Pressable
          onPress={onAddPress}
          style={[
            {
              width: pixelSize,
              height: pixelSize,
              borderRadius: pixelSize / 2,
              borderWidth: 1,
              borderColor: 'rgba(0, 218, 243, 0.5)', // neon-dim color at 50% opacity
            },
          ]}
          className="border-dashed items-center justify-center ml-3 active:scale-95 transition-all bg-brand-neon/5"
        >
          <MaterialIcons name="add" size={Math.floor(pixelSize * 0.5)} color="#00daf3" />
        </Pressable>
      )}
    </View>
  );
};
