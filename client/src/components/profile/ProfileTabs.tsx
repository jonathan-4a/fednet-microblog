import { Box, Typography } from '@mui/material';
import { formatNumber } from '../../utils/user';

const TAB_GAP = 28;
const TAB_PADDING_Y = 14;
const TAB_TRANSITION = 'color 180ms ease, border-color 180ms ease';

export interface ProfileTabsProps {
  value: number;
  onChange: (value: number) => void;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  followersPrivate?: boolean;
  followingPrivate?: boolean;
}

function TabSegment({
  label,
  count,
  isPrivate: _isPrivate, // Only affects content area (UserList), not tab display
  selected,
  onClick,
}: {
  label: string;
  count?: number;
  isPrivate?: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  // Always show count in tab; never show "Private" - content area shows "This information is private."
  const countDisplay = count !== undefined ? formatNumber(count) : null
  return (
    <Box
      component='button'
      type='button'
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        py: `${TAB_PADDING_Y}px`,
        px: 0,
        mr: `${TAB_GAP}px`,
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: selected ? 700 : 600,
        color: selected ? 'text.primary' : '#666',
        letterSpacing: '-0.01em',
        transition: TAB_TRANSITION,
        '&:hover': {
          color: 'text.primary',
        },
        '&:last-of-type': { mr: 0 },
      }}
    >
      {countDisplay !== null ? (
        <>
          <Typography
            component='span'
            sx={{
              fontWeight: 'inherit',
              color: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
            }}
          >
            {countDisplay}
          </Typography>
          <Typography
            component='span'
            sx={{
              fontWeight: 'inherit',
              color: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
            }}
          >
            {label}
          </Typography>
        </>
      ) : (
        <Typography
          component='span'
          sx={{
            fontWeight: 'inherit',
            color: 'inherit',
            fontSize: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}

export function ProfileTabs({
  value,
  onChange,
  postsCount,
  followersCount,
  followingCount,
  followersPrivate,
  followingPrivate,
}: ProfileTabsProps) {
  return (
    <Box
      sx={{
        borderBottom: '1px solid #eee',
        display: 'flex',
        flexWrap: 'wrap',
        pl: 2,
      }}
    >
      <TabSegment
        label={postsCount === 1 ? 'Post' : 'Posts'}
        count={postsCount}
        selected={value === 0}
        onClick={() => onChange(0)}
      />
      <TabSegment
        label={followersCount === 1 ? 'Follower' : 'Followers'}
        count={followersCount}
        isPrivate={followersPrivate}
        selected={value === 1}
        onClick={() => onChange(1)}
      />
      <TabSegment
        label='Following'
        count={followingCount}
        isPrivate={followingPrivate}
        selected={value === 2}
        onClick={() => onChange(2)}
      />
    </Box>
  );
}

