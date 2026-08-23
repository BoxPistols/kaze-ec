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

import { AppIconButton } from '@/components/AppIconButton'
import { SettlementToggle } from '@/components/SettlementToggle'
import { UserAvatar } from '@/components/UserAvatar'
import catalog from '@/data/componentCatalog.generated.json'

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

interface CatalogComponent {
  kaze: string
  source: 'mui' | 'regenerated'
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
  IconButton: (
    <Stack direction="row" spacing={1}>
      <AppIconButton tooltip="編集" aria-label="編集" variant="outlined">
        <EditOutlinedIcon fontSize="small" />
      </AppIconButton>
      <AppIconButton tooltip="お気に入り" aria-label="お気に入り" variant="filled" color="error">
        <FavoriteBorderOutlinedIcon fontSize="small" />
      </AppIconButton>
    </Stack>
  ),
  ToggleButton: (
    <SettlementToggle value="jpy" onChange={() => undefined} />
  ),
}

const SOURCE_LABEL: Record<CatalogComponent['source'], string> = {
  mui: 'MUI 直使用（テーマのみ適用）',
  regenerated: '再実装（props 仕様のみ流用）',
}

const ComponentCard = ({ entry }: { entry: CatalogComponent }) => (
  <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 2.5 }}>
    <CardContent>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {entry.kaze}
        </Typography>
        <Chip
          label={entry.source === 'mui' ? 'MUI' : '再実装'}
          size="small"
          color={entry.source === 'mui' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        {SOURCE_LABEL[entry.source]}
        {entry.localPath && ` — ${entry.localPath}`}
      </Typography>

      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
        {SAMPLES[entry.kaze] ?? (
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
      <ComponentCard key={entry.kaze} entry={entry} />
    ))}
  </Container>
)
