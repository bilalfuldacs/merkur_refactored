import { useCallback, useEffect, useRef, useState } from 'react'
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { countIcePending, subscribeIceOffline, syncIcePending } from '@/offline/iceOffline'

export function IceOfflineBar({ onUploaded }: { onUploaded?: () => void }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [pending, setPending] = useState(0)
  const [note, setNote] = useState('')
  const onUploadedRef = useRef(onUploaded)
  onUploadedRef.current = onUploaded

  const refreshPending = useCallback(() => {
    void countIcePending().then(setPending)
  }, [])

  useEffect(() => {
    refreshPending()
    return subscribeIceOffline(refreshPending)
  }, [refreshPending])

  useEffect(() => {
    async function goOnline() {
      setOnline(true)
      const result = await syncIcePending()
      if (result.uploaded > 0) {
        setNote(
          result.uploaded === 1
            ? 'Uploaded 1 saved form to the server.'
            : `Uploaded ${result.uploaded} saved forms to the server.`,
        )
        onUploadedRef.current?.()
      }
      refreshPending()
    }

    function goOffline() {
      setOnline(false)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    if (navigator.onLine) {
      void goOnline()
    }
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [refreshPending])

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip
          size="small"
          icon={online ? <CloudDoneOutlinedIcon /> : <CloudOffOutlinedIcon />}
          label={online ? 'Online' : 'Offline · phone copy'}
          color={online ? 'success' : 'warning'}
          sx={{ fontWeight: 700 }}
        />
        {pending > 0 ? (
          <Chip
            size="small"
            icon={<CloudSyncOutlinedIcon />}
            label={pending === 1 ? '1 waiting to upload' : `${pending} waiting to upload`}
            color="warning"
            sx={{ fontWeight: 700 }}
          />
        ) : null}
      </Stack>
      {!online ? (
        <Alert severity="warning">No connection. You can still fill and save on this phone.</Alert>
      ) : null}
      {note ? (
        <Alert severity="success" onClose={() => setNote('')}>
          {note}
        </Alert>
      ) : null}
    </Stack>
  )
}
