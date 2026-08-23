import { Link, Route, Routes } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import { CheckoutWalletPage } from '@/pages/CheckoutWalletPage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { ItemListPage } from '@/pages/ItemListPage'

export const App = () => (
  <>
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Container maxWidth="lg" disableGutters>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            kaze-ec
          </Typography>
        </Container>
      </Toolbar>
    </AppBar>
    <Routes>
      <Route path="/" element={<ItemListPage />} />
      <Route path="/items/:id" element={<ItemDetailPage />} />
      <Route path="/checkout/:id" element={<CheckoutWalletPage />} />
    </Routes>
  </>
)
