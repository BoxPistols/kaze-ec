import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined'
import { Link, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'

import { AppIconButton } from '@/components/AppIconButton'
import { UserAvatar } from '@/components/UserAvatar'
import { findListing, LISTINGS } from '@/data/listings'

const CONTAINER_SX = {
  maxWidth: 'md' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const listing = id ? findListing(id) : undefined
  const theme = useTheme()

  if (!listing) {
    return (
      <Container sx={CONTAINER_SX}>
        <Typography>商品が見つかりませんでした。</Typography>
        <Button component={Link} to="/" sx={{ mt: 2 }}>
          一覧に戻る
        </Button>
      </Container>
    )
  }

  return (
    <Container sx={CONTAINER_SX}>
      <AppIconButton
        tooltip="一覧に戻る"
        aria-label="一覧に戻る"
        variant="ghost"
        onClick={() => window.history.back()}
        color="inherit"
      >
        <ArrowBackIosNewOutlinedIcon fontSize="small" />
      </AppIconButton>

      <Grid container spacing={{ xs: 3, sm: 4 }} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              height: 320,
              borderRadius: 1.5,
              backgroundImage: `linear-gradient(155deg, ${listing.swatch} 0%, ${alpha(listing.swatch, 0.6)} 100%)`,
            }}
            aria-hidden
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip label={listing.condition} size="small" color="primary" variant="outlined" />
            <Chip label={listing.category} size="small" variant="outlined" />
            {listing.acceptsStablecoin && (
              <Chip label="暗号資産可" size="small" color="success" />
            )}
            {listing.id === 'l-003' && (
              <Chip label="残りわずか" size="small" color="warning" />
            )}
          </Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
            {listing.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1, mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              ¥{listing.price.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              （税込）送料込み
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8 }}>
            {listing.description}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <UserAvatar name={listing.sellerName} size="medium" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {listing.sellerName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                出品者
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              py: 2,
              bgcolor: 'background.default',
              borderTop: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
              mx: { xs: -2.5, sm: 0 },
              px: { xs: 2.5, sm: 0 },
            }}
          >
            <Button
              component={Link}
              to={`/checkout/${listing.id}`}
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ py: 1.4, fontSize: 16 }}
            >
              購入手続きへ
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        こちらの商品もおすすめです
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
        {LISTINGS.filter((other) => other.id !== listing.id).map((other) => (
          <Box
            key={other.id}
            component={Link}
            to={`/items/${other.id}`}
            sx={{
              display: 'block',
              flex: '0 0 160px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Box
              sx={{
                height: 100,
                borderRadius: 1.5,
                mb: 1,
                backgroundImage: `linear-gradient(135deg, ${other.swatch} 0%, ${alpha(other.swatch, 0.65)} 100%)`,
              }}
              aria-hidden
            />
            <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {other.title}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              ¥{other.price.toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  )
}
