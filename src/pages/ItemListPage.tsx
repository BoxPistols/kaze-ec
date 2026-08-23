import { useState } from 'react'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'

import { AppIconButton } from '@/components/AppIconButton'
import { LISTINGS, type Listing } from '@/data/listings'

const CONTAINER_SX = {
  maxWidth: 'lg' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

const ListingCard = ({ listing }: { listing: Listing }) => {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const [favorited, setFavorited] = useState(false)

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        height: '100%',
        overflow: 'hidden',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isLight
            ? `0 16px 32px ${alpha(theme.palette.primary.main, 0.14)}`
            : `0 16px 32px ${alpha(theme.palette.common.black, 0.5)}`,
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardActionArea component={Link} to={`/items/${listing.id}`}>
          <Box
            sx={{
              height: 168,
              backgroundImage: `linear-gradient(135deg, ${listing.swatch} 0%, ${alpha(listing.swatch, 0.65)} 100%)`,
            }}
            aria-hidden
          />
        </CardActionArea>
        <Chip
          label={`¥${listing.price.toLocaleString()}`}
          size="small"
          sx={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            bgcolor: alpha(theme.palette.common.black, 0.6),
            color: theme.palette.common.white,
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <AppIconButton
            tooltip={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
            aria-label={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
            variant="filled"
            color={favorited ? 'error' : 'inherit'}
            size="small"
            onClick={() => setFavorited((prev) => !prev)}
          >
            {favorited ? (
              <FavoriteOutlinedIcon fontSize="small" />
            ) : (
              <FavoriteBorderOutlinedIcon fontSize="small" sx={{ color: theme.palette.common.white }} />
            )}
          </AppIconButton>
        </Box>
      </Box>
      <CardActionArea component={Link} to={`/items/${listing.id}`}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
            <Chip label={listing.condition} size="small" color="primary" variant="outlined" />
            {listing.acceptsStablecoin && (
              <Chip label="暗号資産可" size="small" color="success" />
            )}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
            {listing.title}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export const ItemListPage = () => (
  <Container sx={CONTAINER_SX}>
    <Typography
      variant="h5"
      component="h1"
      sx={{ mb: { xs: 3, md: 4 }, fontWeight: 800, letterSpacing: '-0.01em' }}
    >
      出品一覧
    </Typography>
    <Grid container spacing={{ xs: 2.5, md: 3 }}>
      {LISTINGS.map((listing) => (
        <Grid key={listing.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <ListingCard listing={listing} />
        </Grid>
      ))}
    </Grid>
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" size="medium" disabled>
        もっと見る（デモデータのみ）
      </Button>
    </Box>
  </Container>
)
