import React from 'react';
import { View, Image, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | number;
  showBadge?: boolean;
  badgeIcon?: keyof typeof MaterialIcons.glyphMap;
  border?: boolean;
  borderWidth?: number;
  borderColor?: string;
  className?: string;
}

const getInitials = (text?: string): string => {
  if (!text) return '??';
  const clean = text.trim();
  if (clean.startsWith('http') || clean.startsWith('data:') || clean.startsWith('file:')) return '??';
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  showBadge = false,
  badgeIcon = 'star',
  border = false,
  borderWidth = 1,
  borderColor = 'rgba(132, 147, 150, 0.5)',
  className = '',
}) => {
  // Determine pixel size
  let pixelSize = 40;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
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

  // Styles for dynamic width/height
  const avatarStyle = {
    width: pixelSize,
    height: pixelSize,
    borderRadius: pixelSize / 2,
  };

  const containerStyle = {
    width: pixelSize,
    height: pixelSize,
  };

  // Badge size and position based on avatar size
  const badgeSize = Math.max(16, Math.floor(pixelSize * 0.45));
  const badgeStyle = {
    width: badgeSize,
    height: badgeSize,
    borderRadius: badgeSize / 2,
    top: -badgeSize * 0.15,
    right: -badgeSize * 0.15,
  };

  const avatarSource = uri || name || '';
  const isImageUri =
    typeof avatarSource === 'string' &&
    (avatarSource.startsWith('http') ||
      avatarSource.startsWith('data:image') ||
      avatarSource.startsWith('file:') ||
      avatarSource.startsWith('ph:'));

  const initials = getInitials(name || uri);

  return (
    <View style={[containerStyle]} className={`relative ${className}`}>
      {isImageUri ? (
        <Image
          source={{ uri: avatarSource }}
          style={[
            avatarStyle,
            border && {
              borderWidth: borderWidth,
              borderColor: borderColor,
            },
          ]}
          className="bg-brand-card"
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            avatarStyle,
            {
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            },
            border && {
              borderWidth: borderWidth,
              borderColor: borderColor,
            },
          ]}
        >
          <Text
            style={{
              color: '#00e5ff',
              fontWeight: '700',
              fontSize: Math.max(10, Math.floor(pixelSize * 0.38)),
            }}
          >
            {initials}
          </Text>
        </View>
      )}

      {showBadge && (
        <View
          style={badgeStyle}
          className="absolute bg-brand-warning-container items-center justify-center shadow-sm"
        >
          <MaterialIcons
            name={badgeIcon}
            size={Math.floor(badgeSize * 0.7)}
            color="#221b00"
          />
        </View>
      )}
    </View>
  );
};

export default Avatar;
