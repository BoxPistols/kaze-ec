import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
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
import { SearchField } from '@/components/tw/SearchField'
import { SortSelect } from '@/components/tw/SortSelect'
import { TagChip } from '@/components/tw/TagChip'
import { SALES, soldListingIds } from '@/data/account'
import { ALL_TAGS, CATEGORIES, LISTINGS, type Listing } from '@/data/listings'
import { useFavorites } from '@/hooks/useFavorites'
import { SORT_OPTIONS, useListingFilters } from '@/hooks/useListingFilters'

const CONTAINER_SX = {
  maxWidth: 'lg' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

const ListingCard = ({
  listing,
  favorited,
  isSold,
  onToggleFavorite,
}: {
  listing: Listing
  favorited: boolean
  isSold: boolean
  onToggleFavorite: () => void
}) => {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

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
              // 売却済みは彩度を落とす。ただし色だけで伝えないので下のラベルも出す
              filter: isSold ? 'grayscale(0.8)' : 'none',
            }}
            aria-hidden
          />
        </CardActionArea>
        {isSold && (
          <Chip
            label="売り切れ"
            size="small"
            color="default"
            // 右上はお気に入りボタンが占めているので左上に置く
            sx={{ position: 'absolute', left: 10, top: 10, fontWeight: 700 }}
          />
        )}
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
        {listing.imageCount > 1 && (
          <Chip
            icon={
              <CollectionsOutlinedIcon
                sx={{ color: `${theme.palette.common.white} !important`, fontSize: 15 }}
              />
            }
            label={listing.imageCount}
            size="small"
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              bgcolor: alpha(theme.palette.common.black, 0.6),
              color: theme.palette.common.white,
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          />
        )}
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <AppIconButton
            tooltip={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
            aria-label={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
            variant="filled"
            color={favorited ? 'error' : 'inherit'}
            size="small"
            onClick={onToggleFavorite}
          >
            {favorited ? (
              <FavoriteOutlinedIcon fontSize="small" />
            ) : (
              <FavoriteBorderOutlinedIcon
                fontSize="small"
                sx={{ color: theme.palette.common.white }}
              />
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
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {listing.tags.map((tag) => (
              <TagChip key={tag} label={`#${tag}`} variant="outlined" size="small" />
            ))}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export const ItemListPage = () => {
  // 売却の判定は 1 箇所（account.ts）から引く。画面ごとに別実装すると
  // 「出品管理では売却済み、詳細では購入できる」がまた出る
  const soldIds = soldListingIds(SALES)
  const { ids: favoriteIds, has: isFavorited, toggle: toggleFavorite, count } =
    useFavorites()
  const {
    filters,
    results,
    isFiltered,
    setKeyword,
    setSort,
    toggleCategory,
    toggleTag,
    toggleStablecoinOnly,
    toggleFavoritesOnly,
    reset,
  } = useListingFilters(LISTINGS, favoriteIds)

  return (
    <Container sx={CONTAINER_SX}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ mb: { xs: 2, md: 3 }, fontWeight: 800, letterSpacing: '-0.01em' }}
      >
        出品一覧
      </Typography>

      {/* 検索・並び替え・絞り込みは Tailwind + CVA 実装（MUI を使わない） */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField
          label="キーワード検索"
          value={filters.keyword}
          onChange={setKeyword}
          placeholder="商品名・説明・タグから探す"
          className="flex-1"
        />
        <SortSelect
          label="並び替え"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={setSort}
          className="sm:w-48"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {CATEGORIES.map((category) => (
          <TagChip
            key={category}
            label={category}
            color="primary"
            variant={filters.category === category ? 'filled' : 'outlined'}
            selected={filters.category === category}
            onClick={() => toggleCategory(category)}
          />
        ))}
        <TagChip
          label="暗号資産可のみ"
          color="success"
          variant={filters.stablecoinOnly ? 'filled' : 'outlined'}
          selected={filters.stablecoinOnly}
          onClick={toggleStablecoinOnly}
        />
        {/* お気に入りも絞り込みの 1 つとして並べる（decisions/0006）。
            他の条件と組み合わせられるのがこの置き方の理由 */}
        <TagChip
          label={`♡ お気に入り${count > 0 ? ` (${count})` : ''}`}
          color="error"
          variant={filters.favoritesOnly ? 'filled' : 'outlined'}
          selected={filters.favoritesOnly}
          disabled={count === 0}
          onClick={toggleFavoritesOnly}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {ALL_TAGS.map((tag) => (
          <TagChip
            key={tag}
            label={`#${tag}`}
            variant={filters.tags.includes(tag) ? 'filled' : 'outlined'}
            selected={filters.tags.includes(tag)}
            onClick={() => toggleTag(tag)}
          />
        ))}
      </div>

      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {results.length} 件
          {isFiltered && ` / 全 ${LISTINGS.length} 件`}
        </Typography>
        {isFiltered && (
          <Button size="small" variant="text" onClick={reset}>
            条件をクリア
          </Button>
        )}
      </Box>

      {results.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {filters.favoritesOnly && count === 0
              ? 'お気に入りがまだありません。気になる商品のハートを押すとここに集まります。'
              : '条件に合う商品が見つかりませんでした。'}
          </Typography>
          <Button variant="outlined" size="medium" onClick={reset}>
            条件をクリア
          </Button>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {results.map((listing) => (
            <Grid key={listing.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ListingCard
                listing={listing}
                favorited={isFavorited(listing.id)}
                isSold={soldIds.has(listing.id)}
                onToggleFavorite={() => toggleFavorite(listing.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
