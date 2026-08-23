import type { ReactNode } from 'react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

import { AppIconButton } from '@/components/AppIconButton'
import { ImageGallery } from '@/components/ImageGallery'
import { SettlementToggle } from '@/components/SettlementToggle'
import { SearchField } from '@/components/tw/SearchField'
import { SortSelect } from '@/components/tw/SortSelect'
import { TagChip } from '@/components/tw/TagChip'
import { UserAvatar } from '@/components/UserAvatar'
import catalog from '@/data/componentCatalog.generated.json'
import { SORT_OPTIONS } from '@/hooks/useListingFilters'

interface ComponentSpec {
  name?: string
  category?: string
  description?: string
  import?: string
  variants?: string[]
  sizes?: string[]
  accessibility?: string[]
  props?: Record<string, { control?: string; options?: string[] }>
}

type ComponentSource = 'mui' | 'regenerated' | 'regenerated-tailwind'

interface CatalogComponent {
  kaze: string
  /** kaze-ec 側での実装名。同じ kaze 仕様に複数実装がありうる */
  as: string
  source: ComponentSource
  localPath: string | null
  spec: ComponentSpec
}

const typedCatalog = catalog as unknown as {
  tokens: {
    colors: Record<string, { $value: string }>
    borderRadius: Record<string, { $value: string; $description?: string }>
  }
  components: CatalogComponent[]
}

const CONTAINER_SX = {
  maxWidth: 'md' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

/** キーは kaze-ec 側の実装名（`as`）。同じ kaze 仕様に複数実装が並ぶため */
const SAMPLES: Record<string, ReactNode> = {
  Card: (
    <Card variant="outlined" sx={{ borderRadius: 1.5, p: 2, width: 160 }}>
      <Typography variant="body2">Card</Typography>
    </Card>
  ),
  Chip: (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip label="filled" color="primary" />
      <Chip label="outlined" color="primary" variant="outlined" />
      <Chip label="success" color="success" />
      <Chip label="warning" color="warning" />
    </Stack>
  ),
  TagChip: (
    <div className="flex flex-wrap gap-2">
      <TagChip label="filled" color="primary" />
      <TagChip label="outlined" color="primary" variant="outlined" />
      <TagChip label="success" color="success" />
      <TagChip label="warning" color="warning" />
    </div>
  ),
  Button: (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button variant="contained">Contained</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
    </Stack>
  ),
  UserAvatar: (
    <Stack direction="row" spacing={1}>
      <UserAvatar name="kaze_seller_01" />
      <UserAvatar name="nordic_home" color="success" />
      <UserAvatar name="kz" color="warning" size="small" />
    </Stack>
  ),
  AppIconButton: (
    <Stack direction="row" spacing={1}>
      <AppIconButton tooltip="編集" aria-label="編集" variant="outlined">
        <EditOutlinedIcon fontSize="small" />
      </AppIconButton>
      <AppIconButton tooltip="お気に入り" aria-label="お気に入り" variant="filled" color="error">
        <FavoriteBorderOutlinedIcon fontSize="small" />
      </AppIconButton>
    </Stack>
  ),
  SettlementToggle: <SettlementToggle value="jpy" onChange={() => undefined} />,
  SearchField: (
    <SearchField
      label="キーワード検索"
      value=""
      onChange={() => undefined}
      placeholder="商品名・説明・タグから探す"
    />
  ),
  SortSelect: (
    <SortSelect
      label="並び替え"
      value="newest"
      options={SORT_OPTIONS}
      onChange={() => undefined}
    />
  ),
}

const SOURCE_LABEL: Record<ComponentSource, string> = {
  mui: 'MUI 直使用（テーマのみ適用）',
  regenerated: '再実装（props 仕様のみ流用・MUI ベース）',
  'regenerated-tailwind': '再実装（props 仕様のみ流用・MUI 非依存 / Tailwind + CVA）',
}

const SOURCE_BADGE: Record<ComponentSource, { label: string; color: 'primary' | 'secondary' | 'success' }> = {
  mui: { label: 'MUI', color: 'primary' },
  regenerated: { label: '再実装', color: 'secondary' },
  'regenerated-tailwind': { label: 'Tailwind 再実装', color: 'success' },
}

/** サンプルの色もトークン（テーマ）から取る。hex を直書きしない */
const ImageGallerySample = () => {
  const theme = useTheme()
  return (
    <ImageGallery
      swatch={theme.palette.primary.main}
      count={3}
      alt="サンプル商品"
      height={160}
    />
  )
}

interface OriginalComponent {
  name: string
  localPath: string
  reason: string
  sample: ReactNode
}

const ORIGINAL_COMPONENTS: OriginalComponent[] = [
  {
    name: 'ImageGallery',
    localPath: 'src/components/ImageGallery.tsx',
    reason:
      'kaze MCP の search で image / gallery / carousel 系の DS 部品が無いことを確認済み。フリマは複数写真が前提のため、Box/Grid と同じ「DS 対象外のレイアウト原始要素」として kaze-ec 側で新規に用意した',
    sample: <ImageGallerySample />,
  },
]

const ComponentCard = ({ entry }: { entry: CatalogComponent }) => (
  <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 2.5 }}>
    <CardContent>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {entry.as}
        </Typography>
        {entry.as !== entry.kaze && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            kaze: {entry.kaze}
          </Typography>
        )}
        <Chip
          label={SOURCE_BADGE[entry.source].label}
          size="small"
          color={SOURCE_BADGE[entry.source].color}
          variant="outlined"
        />
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        {SOURCE_LABEL[entry.source]}
        {entry.localPath && ` — ${entry.localPath}`}
      </Typography>

      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
        {SAMPLES[entry.as] ?? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            サンプル未登録
          </Typography>
        )}
      </Box>

      {entry.spec.description && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {entry.spec.description}
        </Typography>
      )}

      {entry.spec.props && (
        <Table size="small">
          <TableBody>
            {Object.entries(entry.spec.props).map(([propName, propSpec]) => (
              <TableRow key={propName}>
                <TableCell sx={{ pl: 0, fontFamily: 'monospace', fontSize: 13, width: '35%' }}>
                  {propName}
                </TableCell>
                <TableCell sx={{ pr: 0, fontSize: 13, color: 'text.secondary' }}>
                  {propSpec.options ? propSpec.options.join(' / ') : propSpec.control}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
)

export const ComponentCatalogPage = () => (
  <Container sx={CONTAINER_SX}>
    <Typography variant="h5" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
      コンポーネントカタログ
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4, lineHeight: 1.8 }}>
      この一覧は kaze MCP（<code>get_component</code> / <code>get_token</code>）から取得した
      仕様のスナップショット（<code>tools/catalog/generate-catalog.mjs</code> の生成物）です。
      kaze-ec の画面はすべて、ここにある部品とトークンの組み合わせで作られています —
      kaze-ux のコードは 1 行も import していません。
    </Typography>

    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
      トークン
    </Typography>
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
      {Object.entries(typedCatalog.tokens.colors).map(([name, token]) => (
        <Box key={name} sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1.5,
              bgcolor: token.$value,
              border: '1px solid',
              borderColor: 'divider',
              mb: 0.5,
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {name}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
            {token.$value}
          </Typography>
        </Box>
      ))}
    </Stack>
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
      {Object.entries(typedCatalog.tokens.borderRadius).map(([name, token]) => (
        <Box key={name} sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: token.$value,
              bgcolor: 'action.selected',
              border: '1px solid',
              borderColor: 'divider',
              mb: 0.5,
            }}
          />
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {name}（{token.$value}）
          </Typography>
        </Box>
      ))}
    </Stack>

    <Divider sx={{ mb: 3 }} />

    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
      コンポーネント（{typedCatalog.components.length} 件）
    </Typography>
    {typedCatalog.components.map((entry) => (
      <ComponentCard key={`${entry.kaze}::${entry.as}`} entry={entry} />
    ))}

    <Divider sx={{ my: 3 }} />

    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
      kaze-ec 独自コンポーネント（{ORIGINAL_COMPONENTS.length} 件）
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.8 }}>
      kaze-ux の DS に対応する仕様が無いもの。MCP から仕様を引けないため、
      なぜ独自実装したかを明示する。
    </Typography>
    {ORIGINAL_COMPONENTS.map((entry) => (
      <Card
        key={entry.name}
        variant="outlined"
        sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 2.5 }}
      >
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {entry.name}
            </Typography>
            <Chip label="DS対象外" size="small" color="warning" variant="outlined" />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            {entry.localPath}
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
            {entry.sample}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {entry.reason}
          </Typography>
        </CardContent>
      </Card>
    ))}
  </Container>
)
