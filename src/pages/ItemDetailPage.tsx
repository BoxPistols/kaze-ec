import { Link, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { UserAvatar } from '@/components/UserAvatar'
import { findListing } from '@/data/listings'

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const listing = id ? findListing(id) : undefined

  if (!listing) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>商品が見つかりませんでした。</Typography>
        <Button component={Link} to="/" sx={{ mt: 2 }}>
          一覧に戻る
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              height: 320,
              borderRadius: '12px',
              bgcolor: listing.swatch,
              opacity: 0.85,
            }}
            aria-hidden
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip label={listing.condition} size="small" color="primary" variant="outlined" />
            <Chip label={listing.category} size="small" variant="outlined" />
            {listing.acceptsStablecoin && (
              <Chip label="暗号資産可" size="small" color="success" />
            )}
            {listing.id === 'l-003' && (
              <Chip label="残りわずか" size="small" color="warning" />
            )}
          </Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            {listing.title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
            ¥{listing.price.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
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

          <Button
            component={Link}
            to={`/checkout/${listing.id}`}
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            購入手続きへ
          </Button>
        </Grid>
      </Grid>
    </Container>
  )
}
