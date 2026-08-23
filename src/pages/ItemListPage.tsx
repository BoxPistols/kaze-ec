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

import { LISTINGS } from '@/data/listings'

export const ItemListPage = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
      出品一覧
    </Typography>
    <Grid container spacing={3}>
      {LISTINGS.map((listing) => (
        <Grid key={listing.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{ borderRadius: '12px', height: '100%' }}
          >
            <CardActionArea
              component={Link}
              to={`/items/${listing.id}`}
              sx={{ height: '100%' }}
            >
              <Box
                sx={{
                  height: 160,
                  bgcolor: listing.swatch,
                  opacity: 0.85,
                }}
                aria-hidden
              />
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip label={listing.condition} size="small" color="primary" variant="outlined" />
                  {listing.acceptsStablecoin && (
                    <Chip label="暗号資産可" size="small" color="success" />
                  )}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {listing.title}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  ¥{listing.price.toLocaleString()}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
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
