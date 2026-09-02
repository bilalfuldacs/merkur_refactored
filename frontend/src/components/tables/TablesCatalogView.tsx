import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getTablesCatalog } from '@/api'
import type { TablesCatalog } from '@/api'
import { tableBrowsePath } from '@/config/tablePages'
import { useAppPath } from '@/routing'
import { TableCatalogCard } from './TableCatalogCard'
import { TablesAboutCard } from './TablesAboutCard'

const emptyCatalog: TablesCatalog = { groups: [] }

export function TablesCatalogView() {
  const { navigate } = useAppPath()
  const [catalog, setCatalog] = useState<TablesCatalog>(emptyCatalog)

  useEffect(() => {
    let cancelled = false

    void getTablesCatalog()
      .then((payload) => {
        if (!cancelled) {
          setCatalog(payload)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog(emptyCatalog)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
        gap: { xs: 3, md: 4 },
        alignItems: 'start',
      }}
    >
      <Box>
        {catalog.groups.length === 0 ? (
          <Typography color="text.secondary">No tables available.</Typography>
        ) : (
          catalog.groups.map((group) => (
            <Box key={group.title} sx={{ mb: 3 }}>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: 22, md: 26 }, mb: 2 }}>
                {group.title}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {group.tables.map((item) => (
                  <TableCatalogCard
                    key={item.id}
                    item={item}
                    onOpen={() => navigate(tableBrowsePath(item.table))}
                  />
                ))}
              </Box>
            </Box>
          ))
        )}
      </Box>
      <TablesAboutCard />
    </Box>
  )
}
