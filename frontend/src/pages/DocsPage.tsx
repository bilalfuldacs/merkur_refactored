import { useEffect, useMemo, useState } from 'react'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  createStaticDoc,
  deleteStaticDoc,
  getStaticDocs,
  updateStaticDoc,
} from '@/api'
import type { StaticDoc, StaticDocInput } from '@/api'
import { DocCard, DocFormDialog } from '@/components/docs'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { APP_PATHS, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function groupDocs(docs: StaticDoc[]): { name: string; docs: StaticDoc[] }[] {
  const groups: { name: string; docs: StaticDoc[] }[] = []
  const indexByName = new Map<string, number>()

  for (const doc of docs) {
    const name = doc.subfolder?.trim() || 'Uploads'
    const existing = indexByName.get(name)
    if (existing === undefined) {
      indexByName.set(name, groups.length)
      groups.push({ name, docs: [doc] })
    } else {
      groups[existing].docs.push(doc)
    }
  }

  return groups
}

export default function DocsPage() {
  const { navigate } = useAppPath()
  const [docs, setDocs] = useState<StaticDoc[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StaticDoc | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'Docs | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getStaticDocs()
      .then((result) => {
        if (!cancelled) {
          setDocs(result)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDocs(null)
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(() => groupDocs(docs ?? []), [docs])
  const sections = groups.map((group) => group.name)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(doc: StaticDoc) {
    setEditing(doc)
    setDialogOpen(true)
  }

  async function handleSave(input: StaticDocInput) {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateStaticDoc(editing.id, input)
        setDocs((current) => current?.map((doc) => (doc.id === updated.id ? updated : doc)) ?? [updated])
      } else {
        const created = await createStaticDoc(input)
        setDocs((current) => [...(current ?? []), created])
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(doc: StaticDoc) {
    if (!window.confirm(`Delete “${doc.title}”? This cannot be undone.`)) {
      return
    }
    await deleteStaticDoc(doc.id)
    setDocs((current) => current?.filter((item) => item.id !== doc.id) ?? [])
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Docs</Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
            <Typography
              component="h1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15 }}
            >
              <MenuBookOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
              Docs
            </Typography>
            <AppButton size="small" startIcon={<UploadFileOutlinedIcon />} onClick={openCreate}>
              Upload
            </AppButton>
          </Box>
          <Typography sx={{ color: 'text.secondary', mb: 3, maxWidth: 720 }}>
            This document library contains information about MERKUR and, specifically, MERKURflow. Upload a PDF to share it
            with the team — you can edit or delete documents you created.
          </Typography>

          {failed ? (
            <Typography color="text.secondary">The document library could not be loaded.</Typography>
          ) : docs === null ? (
            null
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' },
                gap: 3,
                alignItems: 'start',
                mb: 4,
              }}
            >
              <Box>
                {groups.length === 0 ? (
                  <Typography color="text.secondary">No documents yet. Upload the first one.</Typography>
                ) : (
                  groups.map((group, index) => (
                    <Box key={group.name} id={`s${index + 1}`} sx={{ mb: 4 }}>
                      <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main', mb: 2 }}>
                        {roman[index] ?? `${index + 1}.`} {group.name}
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
                          gap: 2,
                        }}
                      >
                        {group.docs.map((doc) => (
                          <DocCard
                            key={doc.id}
                            doc={doc}
                            onEdit={() => openEdit(doc)}
                            onDelete={() => void handleDelete(doc)}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              <Box sx={{ position: { md: 'sticky' }, top: 80 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'secondary.main', mb: 1.5 }}>On this page</Typography>
                <Box component="ol" sx={{ m: 0, pl: 0, listStyle: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'common.white' }}>
                  {groups.map((group, index) => (
                    <Box
                      key={group.name}
                      component="li"
                      sx={{ borderBottom: index === groups.length - 1 ? 0 : '1px solid', borderColor: 'divider' }}
                    >
                      <Box
                        component="a"
                        href={`#s${index + 1}`}
                        sx={{
                          display: 'block',
                          px: 1.5,
                          py: 1.1,
                          color: 'info.main',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: 14,
                          '&:hover': { bgcolor: 'grey.50' },
                        }}
                      >
                        {roman[index] ?? `${index + 1}.`} {group.name}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <AppFooter />
      <DocFormDialog
        open={dialogOpen}
        doc={editing}
        sections={sections}
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </PageBackground>
  )
}
