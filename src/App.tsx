import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Link, Route, Routes } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import { AppIconButton } from '@/components/AppIconButton'
import { CheckoutWalletPage } from '@/pages/CheckoutWalletPage'
import { ComponentCatalogPage } from '@/pages/ComponentCatalogPage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { ItemListPage } from '@/pages/ItemListPage'
import { useColorMode } from '@/theme/ColorModeContext'

const Header = () => {
  const { mode, toggle } = useColorMode()
  const isLight = mode === 'light'

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: isLight ? 'primary.main' : 'background.paper',
        color: isLight ? 'primary.contrastText' : 'text.primary',
        borderBottom: isLight ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
        <Container
          maxWidth="lg"
          disableGutters
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
        >
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            kaze-ec
          </Typography>
          <Chip
            label="DEMO"
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: isLight ? 'rgba(255,255,255,0.18)' : 'action.selected',
              color: 'inherit',
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <AppIconButton
            tooltip="コンポーネントカタログ（kaze MCP から生成）"
            aria-label="コンポーネントカタログを開く"
            color="inherit"
            component={Link}
            to="/components"
          >
            <WidgetsOutlinedIcon />
          </AppIconButton>
          <AppIconButton
            tooltip={isLight ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
            aria-label="配色モードを切り替え"
            color="inherit"
            onClick={toggle}
          >
            {isLight ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </AppIconButton>
        </Container>
      </Toolbar>
    </AppBar>
  )
}

export const App = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Header />
    <Routes>
      <Route path="/" element={<ItemListPage />} />
      <Route path="/items/:id" element={<ItemDetailPage />} />
      <Route path="/checkout/:id" element={<CheckoutWalletPage />} />
      <Route path="/components" element={<ComponentCatalogPage />} />
    </Routes>
  </Box>
)
